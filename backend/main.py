from fastapi import FastAPI, Query
import pandas as pd
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta

app = FastAPI()

MONTH_FILE = "january2026.csv"
LIVE_URL = "https://slmpd.org/calls/"

cache = {
    "monthly_cells": [],
    "monthly_loaded": False,
    "live_calls": [],
    "live_last_updated": None,
}

def to_iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

def grid_cell(lat: float, lng: float, precision: int = 3):
    # precision=3 ~ ~100m-ish. Good for privacy + speed.
    return round(lat, precision), round(lng, precision)

def load_monthly():
    # Load CSV and build grid heat cells.
    df = pd.read_csv(MONTH_FILE)

    # Try to find lat/lng columns (names vary). Adjust if needed after you inspect columns.
    possible_lat = [c for c in df.columns if c.lower() in ["lat", "latitude", "y"]]
    possible_lng = [c for c in df.columns if c.lower() in ["lon", "lng", "longitude", "x"]]
    if not possible_lat or not possible_lng:
        # If no coordinates, you can switch to neighborhood aggregation later.
        cache["monthly_cells"] = []
        cache["monthly_loaded"] = True
        return

    lat_col, lng_col = possible_lat[0], possible_lng[0]
    df = df.dropna(subset=[lat_col, lng_col])

    # Build grid counts
    counts = {}
    for lat, lng in zip(df[lat_col].astype(float), df[lng_col].astype(float)):
        clat, clng = grid_cell(lat, lng)
        key = f"{clat}_{clng}"
        counts[key] = counts.get(key, 0) + 1

    cache["monthly_cells"] = [
        {"cell_id": k, "center": [float(k.split("_")[0]), float(k.split("_")[1])], "count": v}
        for k, v in counts.items()
    ]
    cache["monthly_loaded"] = True

def fetch_live_calls():
    # Fetch and parse SLMPD calls page.
    html = requests.get(LIVE_URL, timeout=20).text
    soup = BeautifulSoup(html, "html.parser")

    text = soup.get_text(" ", strip=True).lower()
    # best effort: find "last updated" text if present
    last_updated = None
    if "last updated" in text:
        last_updated = to_iso(datetime.now(timezone.utc))  # fallback if parsing is hard
    else:
        last_updated = to_iso(datetime.now(timezone.utc))

    # Find the first table and read rows
    table = soup.find("table")
    calls = []
    if table:
        rows = table.find_all("tr")
        for r in rows[1:]:
            cols = [c.get_text(" ", strip=True) for c in r.find_all(["td", "th"])]
            if len(cols) >= 3:
                # Columns vary; keep generic
                calls.append({
                    "time": cols[0],
                    "type": cols[1],
                    "location": cols[2],   # keep block text only
                    "source": "SLMPD Calls for Service (unverified)"
                })

    cache["live_calls"] = calls[:500]  # cap for safety
    cache["live_last_updated"] = last_updated

@app.on_event("startup")
def startup():
    load_monthly()
    fetch_live_calls()

@app.get("/meta")
def meta():
    return {
        "project": "ArchAlert",
        "live_source": LIVE_URL,
        "live_last_updated": cache["live_last_updated"],
        "monthly_source": "January 2026 CSV",
        "monthly_loaded": cache["monthly_loaded"],
        "disclaimer": "Live layer shows Calls for Service (unverified). Not a guarantee of safety."
    }

@app.get("/monthly-heat")
def monthly_heat():
    if not cache["monthly_loaded"]:
        load_monthly()
    return {"month": "2026-01", "cells": cache["monthly_cells"]}

@app.get("/live-calls")
def live_calls():
    # In hackathon: refresh on demand
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

@app.get("/refresh-live")
def refresh_live():
    fetch_live_calls()
    return {"ok": True, "last_updated": cache["live_last_updated"], "count": len(cache["live_calls"])}