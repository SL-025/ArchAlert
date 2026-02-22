from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import os
import glob
import re

app = FastAPI()

# CORS so frontend can call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LIVE_URL = "https://slmpd.org/calls/"

cache = {
    "live_calls": [],
    "live_last_updated": None,
}

# --- Paths (robust on Windows) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MONTHLY_DIR = os.path.join(BASE_DIR, "data", "monthly")  # backend/data/monthly


# --- Month filename helpers ---
# Supports: January2026.csv, December2025.csv, etc.
MONTH_NAME_TO_NUM = {
    "january": "01",
    "february": "02",
    "march": "03",
    "april": "04",
    "may": "05",
    "june": "06",
    "july": "07",
    "august": "08",
    "september": "09",
    "october": "10",
    "november": "11",
    "december": "12",
}

def list_month_files():
    return sorted(glob.glob(os.path.join(MONTHLY_DIR, "*.csv")))

def file_base_no_ext(path: str) -> str:
    return os.path.basename(path).replace(".csv", "")

def to_month_key_from_basename(basename: str) -> str | None:
    """
    Convert "January2026" -> "2026-01"
    Also allows already normalized "2026-01".
    """
    b = basename.strip()

    # already normalized
    if re.fullmatch(r"\d{4}-\d{2}", b):
        return b

    # MonthNameYYYY
    m = re.fullmatch(r"([A-Za-z]+)\s*(\d{4})", b)
    if not m:
        return None

    month_name = m.group(1).lower()
    year = m.group(2)
    mm = MONTH_NAME_TO_NUM.get(month_name)
    if not mm:
        return None
    return f"{year}-{mm}"

def build_month_index():
    """
    Builds mappings:
      - key_to_path: "2026-01" -> ".../January2026.csv"
      - name_to_path: "January2026" -> ".../January2026.csv"
    """
    key_to_path = {}
    name_to_path = {}

    for p in list_month_files():
        base = file_base_no_ext(p)  # e.g., January2026
        name_to_path[base] = p

        key = to_month_key_from_basename(base)  # e.g., 2026-01
        if key:
            key_to_path[key] = p

    return key_to_path, name_to_path

def available_months():
    """
    Returns:
      - normalized list like ["2025-09","2025-10",...]
      - original list like ["September2025",...]
    """
    key_to_path, name_to_path = build_month_index()
    keys = sorted(key_to_path.keys())
    names = sorted(name_to_path.keys())
    return {"keys": keys, "names": names}

def resolve_month_path(month: str):
    """
    Accepts:
      - "2026-01"
      - "January2026"
    Returns: file path or None
    """
    month = (month or "").strip()
    key_to_path, name_to_path = build_month_index()

    if month in key_to_path:
        return key_to_path[month]
    if month in name_to_path:
        return name_to_path[month]

    # try converting input if it's like January2026 without exact match
    maybe_key = to_month_key_from_basename(month)
    if maybe_key and maybe_key in key_to_path:
        return key_to_path[maybe_key]

    return None

def load_month_df(month: str):
    path = resolve_month_path(month)
    if not path or not os.path.exists(path):
        return None, None
    return pd.read_csv(path), file_base_no_ext(path)


# --- Column picking + filters ---
def pick_date_col(df: pd.DataFrame):
    candidates = []
    for c in df.columns:
        cl = c.lower()
        if cl in ["incidentdate", "incident_date"]:
            return c
        if "date" in cl or "time" in cl:
            candidates.append(c)
    return candidates[0] if candidates else None

def pick_type_col(df: pd.DataFrame):
    candidates = []
    for c in df.columns:
        cl = c.lower()
        if cl in ["offense", "crimetype", "crime_type", "type"]:
            return c
        if "offense" in cl or "crime" in cl or "type" in cl:
            candidates.append(c)
    return candidates[0] if candidates else None

def filter_last_days(df: pd.DataFrame, days: int):
    time_col = pick_date_col(df)
    if not time_col:
        return df, time_col

    dt = pd.to_datetime(df[time_col], errors="coerce")
    max_dt = dt.max()

    if pd.isna(max_dt):
        # date parsing failed entirely
        return df.iloc[0:0], time_col

    cutoff = max_dt - pd.Timedelta(days=days)
    return df.loc[dt >= cutoff].copy(), time_col

def grid_cell(lat: float, lng: float, precision: int = 3):
    return round(lat, precision), round(lng, precision)


# --- Live calls scraping ---
def fetch_live_calls():
    html = requests.get(LIVE_URL, timeout=20).text

    calls = []
    # Try pandas read_html first (more robust)
    try:
        tables = pd.read_html(html)
        df = tables[0].fillna("")
        for _, row in df.iterrows():
            cols = list(row.values)
            if len(cols) >= 3:
                calls.append(
                    {
                        "time": str(cols[0]),
                        "type": str(cols[1]),
                        "location": str(cols[2]),
                        "source": "SLMPD Calls for Service (unverified)",
                    }
                )
    except Exception:
        # Fallback to basic BeautifulSoup
        soup = BeautifulSoup(html, "html.parser")
        table = soup.find("table")
        if table:
            rows = table.find_all("tr")
            for r in rows[1:]:
                cols = [c.get_text(" ", strip=True) for c in r.find_all(["td", "th"])]
                if len(cols) >= 3:
                    calls.append(
                        {
                            "time": cols[0],
                            "type": cols[1],
                            "location": cols[2],
                            "source": "SLMPD Calls for Service (unverified)",
                        }
                    )

    cache["live_calls"] = calls[:500]
    cache["live_last_updated"] = (
        datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    )


@app.on_event("startup")
def startup():
    fetch_live_calls()


# --- API ---
@app.get("/meta")
def meta():
    am = available_months()
    return {
        "project": "ArchAlert",
        "live_source": LIVE_URL,
        "live_last_updated": cache["live_last_updated"],
        "available_month_keys": am["keys"],      # e.g. ["2025-09", ...]
        "available_month_names": am["names"],    # e.g. ["September2025", ...]
        "disclaimer": "Live layer shows Calls for Service (unverified). Not a guarantee of safety.",
    }


@app.get("/monthly-heat")
def monthly_heat(month: str = "January2026", last_days: int | None = None):
    df, loaded_name = load_month_df(month)
    if df is None:
        return {
            "month": month,
            "cells": [],
            "available": available_months(),
            "error": "month file not found",
        }

    if last_days is not None:
        df, _ = filter_last_days(df, int(last_days))

    possible_lat = [c for c in df.columns if c.lower() in ["lat", "latitude", "y"]]
    possible_lng = [c for c in df.columns if c.lower() in ["lon", "lng", "longitude", "x"]]
    if not possible_lat or not possible_lng:
        return {
            "month": month,
            "loaded_file": loaded_name,
            "cells": [],
            "error": "lat/lng columns not found",
        }

    lat_col, lng_col = possible_lat[0], possible_lng[0]
    df = df.dropna(subset=[lat_col, lng_col])

    counts = {}
    for lat, lng in zip(df[lat_col].astype(float), df[lng_col].astype(float)):
        clat, clng = grid_cell(lat, lng)
        key = f"{clat}_{clng}"
        counts[key] = counts.get(key, 0) + 1

    cells = [
        {"cell_id": k, "center": [float(k.split("_")[0]), float(k.split("_")[1])], "count": v}
        for k, v in counts.items()
    ]
    return {"month": month, "loaded_file": loaded_name, "last_days": last_days, "cells": cells}


@app.get("/historical-heat")
def historical_heat(months: int = 5, last_days: int | None = None):
    files = list_month_files()
    if not files:
        return {"months": months, "cells": [], "used_files": [], "available": available_months()}

    take = files[-int(months):] if int(months) > 0 else files
    dfs = [pd.read_csv(p) for p in take]
    df_all = pd.concat(dfs, ignore_index=True)
    used_files = [file_base_no_ext(p) for p in take]

    if last_days is not None:
        df_all, _ = filter_last_days(df_all, int(last_days))

    possible_lat = [c for c in df_all.columns if c.lower() in ["lat", "latitude", "y"]]
    possible_lng = [c for c in df_all.columns if c.lower() in ["lon", "lng", "longitude", "x"]]
    if not possible_lat or not possible_lng:
        return {
            "months": months,
            "last_days": last_days,
            "cells": [],
            "used_files": used_files,
            "error": "lat/lng columns not found",
        }

    lat_col, lng_col = possible_lat[0], possible_lng[0]
    df_all = df_all.dropna(subset=[lat_col, lng_col])

    counts = {}
    for lat, lng in zip(df_all[lat_col].astype(float), df_all[lng_col].astype(float)):
        clat, clng = grid_cell(lat, lng)
        key = f"{clat}_{clng}"
        counts[key] = counts.get(key, 0) + 1

    cells = [
        {"cell_id": k, "center": [float(k.split("_")[0]), float(k.split("_")[1])], "count": v}
        for k, v in counts.items()
    ]
    return {"months": months, "last_days": last_days, "used_files": used_files, "cells": cells}


@app.get("/monthly-stats")
def monthly_stats(month: str = "January2026", last_days: int | None = None):
    df, loaded_name = load_month_df(month)
    if df is None:
        return {
            "month": month,
            "total_rows": 0,
            "hour_series": [],
            "type_series": [],
            "available": available_months(),
            "error": "month file not found",
        }

    if last_days is not None:
        df, _ = filter_last_days(df, int(last_days))

    time_col = pick_date_col(df)
    type_col = pick_type_col(df)

    hour_series = []
    if time_col:
        dt = pd.to_datetime(df[time_col], errors="coerce")
        hours = dt.dt.hour.dropna().astype(int)
        hour_counts = hours.value_counts().sort_index()
        hour_series = [{"hour": int(h), "count": int(c)} for h, c in hour_counts.items()]

    type_series = []
    if type_col:
        top_types = df[type_col].fillna("UNKNOWN").astype(str).value_counts().head(10)
        type_series = [{"type": str(t), "count": int(c)} for t, c in top_types.items()]

    return {
        "month": month,
        "loaded_file": loaded_name,
        "last_days": last_days,
        "total_rows": int(len(df)),
        "hour_series": hour_series,
        "type_series": type_series,
        "columns": list(df.columns),
        "used_time_col": time_col,
        "used_type_col": type_col,
    }


@app.get("/live-calls")
def live_calls():
    fetch_live_calls()
    return {"last_updated": cache["live_last_updated"], "items": cache["live_calls"]}


@app.get("/live-summary")
def live_summary():
    fetch_live_calls()
    by_type = {}
    for c in cache["live_calls"]:
        t = c["type"]
        by_type[t] = by_type.get(t, 0) + 1
    top = sorted(by_type.items(), key=lambda x: x[1], reverse=True)[:10]
    return {"last_updated": cache["live_last_updated"], "top_types": top, "total": len(cache["live_calls"])}


@app.get("/alerts")
def alerts():
    fetch_live_calls()
    total = len(cache["live_calls"])
    by_type = {}
    for c in cache["live_calls"]:
        by_type[c["type"]] = by_type.get(c["type"], 0) + 1
    top = sorted(by_type.items(), key=lambda x: x[1], reverse=True)[:5]
    top_label = top[0][0] if top else "—"

    summary = (
        f"Live calls are currently dominated by {top_label}. "
        f"This is a real-time awareness view (calls are unverified)."
    )

    return {
        "last_updated": cache["live_last_updated"],
        "total": total,
        "top_types": top,
        "summary": summary,
        "items": cache["live_calls"][:50],
    }