from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone
import os
import glob
import re
from datetime import timedelta

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
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    resp = requests.get(LIVE_URL, headers=headers, timeout=25)
    resp.raise_for_status()
    html = resp.text

    calls = []

    # 1) Try pandas read_html (often easiest if table is standard)
    try:
        tables = pd.read_html(html)
        if tables:
            df = tables[0].fillna("")
            for _, row in df.iterrows():
                cols = list(row.values)
                if len(cols) >= 4:
                    calls.append({
                        "time": str(cols[0]).strip(),
                        "event": str(cols[1]).strip(),
                        "location": str(cols[2]).strip(),
                        "type": str(cols[3]).strip(),
                        "source": "SLMPD Calls for Service (unverified)",
                    })
    except Exception:
        pass

    # 2) Fallback: BeautifulSoup parse
    if not calls:
        soup = BeautifulSoup(html, "html.parser")
        table = soup.find("table")
        if table:
            rows = table.find_all("tr")
            for r in rows[1:]:
                cols = [c.get_text(" ", strip=True) for c in r.find_all(["td", "th"])]
                if len(cols) >= 4:
                    calls.append({
                        "time": cols[0],
                        "event": cols[1],
                        "location": cols[2],
                        "type": cols[3],
                        "source": "SLMPD Calls for Service (unverified)",
                    })

    cache["live_calls"] = calls[:500]
    cache["live_last_updated"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def parse_live_dt(time_str: str):
    """
    Best-effort parse for SLMPD live 'time' strings.
    Returns pandas.Timestamp or NaT.
    """
    if time_str is None:
        return pd.NaT
    s = str(time_str).strip()

    # normalize whitespace
    s = re.sub(r"\s+", " ", s)

    # try common formats first, then fallback to pandas inference
    for fmt in [
        "%Y-%m-%d %H:%M:%S",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y %I:%M %p",
        "%m/%d/%y %H:%M",
        "%m/%d/%y %I:%M %p",
    ]:
        try:
            return pd.to_datetime(s, format=fmt)
        except Exception:
            pass

    # last resort: let pandas infer
    return pd.to_datetime(s, errors="coerce")

def live_df_filtered(since_hours: int):
    fetch_live_calls()
    df = pd.DataFrame(cache.get("live_calls", []))
    if df.empty or "time" not in df.columns:
        return df

    df["dt"] = df["time"].apply(parse_live_dt)
    df = df.dropna(subset=["dt"])
    if df.empty:
        return df

    max_dt = df["dt"].max()
    cutoff = max_dt - pd.Timedelta(hours=int(since_hours))
    return df[df["dt"] >= cutoff].copy()

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
        hours = dt.dt.hour.dropna()
        if not hours.empty and hours.nunique() == 1 and int(hours.iloc[0]) == 0:
            # time column has no time-of-day (all midnight) -> hourly chart is misleading
            hour_series = []
        else:
            hour_counts = hours.astype(int).value_counts().sort_index()
            hour_series = [{"hour": int(h), "count": int(c)} for h, c in hour_counts.items()]
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
def live_summary(since_hours: int = 6, top_n: int = 10):
    df = live_df_filtered(since_hours)
    if df.empty:
        return {"since_hours": since_hours, "last_updated": cache.get("live_last_updated"), "top_types": [], "total": 0}

    if "type" not in df.columns:
        return {"since_hours": since_hours, "last_updated": cache.get("live_last_updated"), "top_types": [], "total": int(len(df))}

    vc = df["type"].fillna("UNKNOWN").astype(str).value_counts().head(int(top_n))
    top = [[str(k), int(v)] for k, v in vc.items()]
    return {"since_hours": since_hours, "last_updated": cache.get("live_last_updated"), "top_types": top, "total": int(len(df))}


@app.get("/alerts")
def alerts(since_hours: int = 6):
    df = live_df_filtered(since_hours)
    if df.empty:
        return {
            "since_hours": since_hours,
            "last_updated": cache.get("live_last_updated"),
            "total": 0,
            "top_types": [],
            "summary": "No live calls available right now (or time parsing failed).",
            "items": [],
        }

    by_type = df["type"].fillna("UNKNOWN").astype(str).value_counts().head(5)
    top = [[str(k), int(v)] for k, v in by_type.items()]
    top_label = top[0][0] if top else "—"

    summary = f"Last {since_hours}h: dominated by {top_label}. Live calls are unverified; awareness only."

    # Items (latest first)
    out_items = df.sort_values("dt", ascending=False)[["time", "type", "location"]].head(50).to_dict("records")

    return {
        "since_hours": since_hours,
        "last_updated": cache.get("live_last_updated"),
        "total": int(len(df)),
        "top_types": top,
        "summary": summary,
        "items": out_items,
    }

@app.get("/live-hourly")
def live_hourly(since_hours: int = 24):
    try:
        fetch_live_calls()

        df = pd.DataFrame(cache.get("live_calls", []))
        if df.empty:
            return {"since_hours": since_hours, "hourly": [], "error": "no live calls (live_calls empty)"}

        if "time" not in df.columns:
            return {"since_hours": since_hours, "hourly": [], "error": f"missing 'time' column. columns={list(df.columns)}"}

        df["dt"] = df["time"].apply(parse_live_dt)
        df = df.dropna(subset=["dt"])
        if df.empty:
            return {"since_hours": since_hours, "hourly": [], "error": "time parse failed (all dt are NaT)"}

        max_dt = df["dt"].max()
        cutoff = max_dt - pd.Timedelta(hours=int(since_hours))
        df = df[df["dt"] >= cutoff]

        df["hour_bucket"] = df["dt"].dt.floor("h")
        g = df.groupby("hour_bucket").size().sort_index()

        hourly = [{"hour": t.isoformat(), "count": int(c)} for t, c in g.items()]
        return {"since_hours": since_hours, "last_updated": cache.get("live_last_updated"), "hourly": hourly}

    except Exception as e:
        return {"since_hours": since_hours, "hourly": [], "error": f"EXCEPTION: {type(e).__name__}: {e}"}

@app.get("/live-types")
def live_types(since_hours: int = 24, top_n: int = 10):
    fetch_live_calls()

    df = pd.DataFrame(cache["live_calls"])
    if df.empty or "time" not in df.columns:
        return {"since_hours": since_hours, "top_types": [], "error": "no live calls"}

    df["dt"] = df["time"].apply(parse_live_dt)
    df = df.dropna(subset=["dt"])
    if df.empty:
        return {"since_hours": since_hours, "top_types": [], "error": "time parse failed"}

    max_dt = df["dt"].max()
    cutoff = max_dt - pd.Timedelta(hours=since_hours)
    df = df[df["dt"] >= cutoff]

    if "type" not in df.columns:
        return {"since_hours": since_hours, "top_types": [], "error": "no type column"}

    vc = df["type"].fillna("UNKNOWN").astype(str).value_counts().head(int(top_n))
    top_types = [{"type": str(k), "count": int(v)} for k, v in vc.items()]

    return {"since_hours": since_hours, "last_updated": cache["live_last_updated"], "top_types": top_types}

@app.get("/live-geo")
def live_geo(since_hours: int = 6, limit: int = 500):
    df = live_df_filtered(since_hours)
    if df.empty:
        return {"since_hours": since_hours, "last_updated": cache.get("live_last_updated"), "items": []}

    # Try common coordinate column names
    lat_col = None
    lng_col = None
    for c in ["lat", "latitude", "Latitude", "LAT"]:
        if c in df.columns:
            lat_col = c
            break
    for c in ["lng", "lon", "long", "longitude", "Longitude", "LON"]:
        if c in df.columns:
            lng_col = c
            break

    if not lat_col or not lng_col:
        # No coordinates in live feed → map overlay can’t be drawn
        return {
            "since_hours": since_hours,
            "last_updated": cache.get("live_last_updated"),
            "items": [],
            "note": "Live feed has no lat/lng columns (map overlay disabled).",
        }

    # Build items
    out = df.copy()
    out[lat_col] = pd.to_numeric(out[lat_col], errors="coerce")
    out[lng_col] = pd.to_numeric(out[lng_col], errors="coerce")
    out = out.dropna(subset=[lat_col, lng_col])

    if out.empty:
        return {"since_hours": since_hours, "last_updated": cache.get("live_last_updated"), "items": []}

    cols = []
    for c in ["time", "type", "location"]:
        if c in out.columns:
            cols.append(c)

    cols += [lat_col, lng_col]

    out = out.sort_values("dt", ascending=False).head(int(limit))

    items = []
    for _, r in out.iterrows():
        items.append(
            {
                "time": str(r["time"]) if "time" in out.columns else "",
                "type": str(r["type"]) if "type" in out.columns else "UNKNOWN",
                "location": str(r["location"]) if "location" in out.columns else "",
                "lat": float(r[lat_col]),
                "lng": float(r[lng_col]),
            }
        )

    return {"since_hours": since_hours, "last_updated": cache.get("live_last_updated"), "items": items}