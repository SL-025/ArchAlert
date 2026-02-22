from __future__ import annotations

import math
import os
import re
from typing import Any, Dict, List, Tuple

try:
    import httpx
except Exception:
    httpx = None  # type: ignore


LLM_LAST_ERROR = ""


def _normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def parse_region_from_query(q: str) -> str:
    t = _normalize_text(q)
    for k in ["north", "south", "east", "west", "downtown", "midtown", "central"]:
        if re.search(rf"\b{k}\b", t):
            return k
    return "city"


def bbox_from_points(points: List[Dict[str, Any]]) -> Tuple[float, float, float, float]:
    lats = [p.get("lat") for p in points if isinstance(p.get("lat"), (int, float))]
    lngs = [p.get("lng") for p in points if isinstance(p.get("lng"), (int, float))]
    if not lats or not lngs:
        return (38.50, -90.40, 38.82, -90.10)
    return (min(lats), min(lngs), max(lats), max(lngs))


def split_bbox_region(b: Tuple[float, float, float, float], region: str) -> Tuple[float, float, float, float]:
    min_lat, min_lng, max_lat, max_lng = b
    mid_lat = (min_lat + max_lat) / 2.0
    mid_lng = (min_lng + max_lng) / 2.0

    if region == "north":
        return (mid_lat, min_lng, max_lat, max_lng)
    if region == "south":
        return (min_lat, min_lng, mid_lat, max_lng)
    if region == "east":
        return (min_lat, mid_lng, max_lat, max_lng)
    if region == "west":
        return (min_lat, min_lng, max_lat, mid_lng)

    if region in ["downtown", "central", "midtown"]:
        pad_lat = (max_lat - min_lat) * 0.30
        pad_lng = (max_lng - min_lng) * 0.30
        return (mid_lat - pad_lat / 2, mid_lng - pad_lng / 2, mid_lat + pad_lat / 2, mid_lng + pad_lng / 2)

    return b


def in_bbox(p: Dict[str, Any], b: Tuple[float, float, float, float]) -> bool:
    lat = p.get("lat")
    lng = p.get("lng")
    if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
        return False
    min_lat, min_lng, max_lat, max_lng = b
    return (min_lat <= lat <= max_lat) and (min_lng <= lng <= max_lng)


def type_weights() -> Dict[str, float]:
    return {
        "shooting": 3.0,
        "shots fired": 3.0,
        "armed": 2.6,
        "robbery": 2.4,
        "assault": 2.2,
        "burglary": 2.0,
        "domestic": 1.8,
        "auto": 1.6,
        "theft": 1.4,
        "disturbance": 1.2,
        "suspicious": 1.1,
        "default": 1.0,
    }


def weight_for_type(t: str) -> float:
    s = _normalize_text(t)
    w = type_weights()
    for k, v in w.items():
        if k != "default" and k in s:
            return v
    return w["default"]


def grid_id(lat: float, lng: float, tile_km: float, lat0: float) -> Tuple[int, int]:
    km_per_deg_lat = 111.0
    km_per_deg_lng = 111.0 * math.cos(math.radians(lat0))
    dy = tile_km / km_per_deg_lat
    dx = tile_km / max(1e-6, km_per_deg_lng)
    gy = int(math.floor(lat / dy))
    gx = int(math.floor(lng / dx))
    return gx, gy


def grid_bounds(gx: int, gy: int, tile_km: float, lat0: float) -> Tuple[Tuple[float, float], Tuple[float, float]]:
    km_per_deg_lat = 111.0
    km_per_deg_lng = 111.0 * math.cos(math.radians(lat0))
    dy = tile_km / km_per_deg_lat
    dx = tile_km / max(1e-6, km_per_deg_lng)
    min_lng = gx * dx
    min_lat = gy * dy
    return ((min_lat, min_lng), (min_lat + dy, min_lng + dx))


def score_tiles(points: List[Dict[str, Any]], tile_km: float = 0.45, max_tiles: int = 14) -> Dict[str, Any]:
    if not points:
        return {"tiles": [], "max_score": 1}

    lats = [p["lat"] for p in points if isinstance(p.get("lat"), (int, float))]
    lat0 = (sum(lats) / len(lats)) if lats else 38.627

    bins: Dict[Tuple[int, int], Dict[str, Any]] = {}
    for p in points:
        lat = p.get("lat")
        lng = p.get("lng")
        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
            continue

        gx, gy = grid_id(lat, lng, tile_km, lat0)
        b = bins.get((gx, gy))
        if not b:
            bins[(gx, gy)] = {
                "score": 0.0,
                "type_counts": {},
                "sample_lat": lat,
                "sample_lng": lng,
            }
            b = bins[(gx, gy)]

        t = str(p.get("type") or p.get("call_type") or p.get("category") or "Unknown")
        w = weight_for_type(t)
        b["score"] += w
        b["type_counts"][t] = b["type_counts"].get(t, 0) + 1

    tiles: List[Dict[str, Any]] = []
    max_score = 1.0
    for (gx, gy), b in bins.items():
        s = float(b["score"])
        max_score = max(max_score, s)

        (min_lat, min_lng), (max_lat, max_lng) = grid_bounds(gx, gy, tile_km, lat0)

        top_type = "—"
        if b["type_counts"]:
            top_type = sorted(b["type_counts"].items(), key=lambda x: x[1], reverse=True)[0][0]

        tiles.append(
            {
                "id": f"{gx}_{gy}",
                "score": s,
                "top_type": top_type,
                "bounds": [[min_lat, min_lng], [max_lat, max_lng]],
                "center": [float(b["sample_lat"]), float(b["sample_lng"])],
            }
        )

    tiles.sort(key=lambda x: x["score"], reverse=True)
    return {"tiles": tiles[:max_tiles], "max_score": max_score}


async def llm_narrative(prompt: str) -> str:
    global LLM_LAST_ERROR
    LLM_LAST_ERROR = ""

    if httpx is None:
        LLM_LAST_ERROR = "httpx_missing"
        return ""

    api_url = os.getenv("LLM_API_URL", "").strip()
    api_key = os.getenv("LLM_API_KEY", "").strip()
    model = os.getenv("LLM_MODEL", "gpt-4o-mini").strip()

    if not api_url or not api_key:
        LLM_LAST_ERROR = "llm_env_missing"
        return ""

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a safety-awareness assistant. Do not claim prediction. Use only provided data. Keep concise.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(api_url, headers=headers, json=payload)
            if r.status_code == 401:
                LLM_LAST_ERROR = "unauthorized_401"
                return ""
            r.raise_for_status()
            j = r.json()

        return (j.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
    except Exception as e:
        LLM_LAST_ERROR = f"llm_error:{str(e)[:80]}"
        return ""


def template_narrative(region: str, hours: int, tiles: List[Dict[str, Any]]) -> str:
    if not tiles:
        return f"No high-intensity zones found for the last {hours}h in {region}. Try 24h or city-wide."
    top = tiles[:3]
    lines = [f"Awareness only (unverified). In {region}, the most active zones in the last {hours}h are:"]
    for i, t in enumerate(top, 1):
        lines.append(f"- Zone {i}: score {t['score']:.1f}, top type: {t['top_type']}")
    lines.append("Consider avoiding the highest-score zone and prefer well-lit main routes.")
    return "\n".join(lines)