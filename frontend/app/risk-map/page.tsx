"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import NavBar from "../components/NavBar";
import { Button } from "../components/ui";
import { MapContainer, TileLayer, Rectangle, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type RiskTile = {
  id: string;
  score: number;
  top_type: string;
  bounds: [[number, number], [number, number]];
  center?: [number, number];
};

type AnyCell = Record<string, any>;

function sinceToHours(s: string) {
  if (s === "1h") return 1;
  if (s === "6h") return 6;
  if (s === "24h") return 24;
  const n = Number(s);
  return Number.isFinite(n) ? n : 6;
}

function toNum(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeMonthlyCells(monthlyCells: AnyCell[]) {
  const cells = Array.isArray(monthlyCells) ? monthlyCells : [];
  const rects: Array<{ bounds: [[number, number], [number, number]]; value: number }> = [];
  const pointsRaw: Array<{ lat: number; lng: number; value: number }> = [];

  for (const c of cells) {
    const vRaw = c.count ?? c.value ?? c.weight ?? c.n ?? c.total ?? c.intensity ?? c.incidents ?? 0;
    const value = Number(vRaw) || 0;

    const minLat = c.min_lat ?? c.south ?? c.sw_lat ?? c.lat_min ?? c.ymin;
    const minLng = c.min_lng ?? c.west ?? c.sw_lng ?? c.lng_min ?? c.lon_min ?? c.xmin;
    const maxLat = c.max_lat ?? c.north ?? c.ne_lat ?? c.lat_max ?? c.ymax;
    const maxLng = c.max_lng ?? c.east ?? c.ne_lng ?? c.lng_max ?? c.lon_max ?? c.xmax;

    const rMinLat = toNum(minLat);
    const rMinLng = toNum(minLng);
    const rMaxLat = toNum(maxLat);
    const rMaxLng = toNum(maxLng);

    const hasRect = [rMinLat, rMinLng, rMaxLat, rMaxLng].every((n) => Number.isFinite(n));
    if (hasRect) {
      rects.push({
        bounds: [
          [rMinLat, rMinLng],
          [rMaxLat, rMaxLng],
        ],
        value,
      });
      continue;
    }

    const latRaw =
      c.lat ??
      c.latitude ??
      c.y ??
      c.center_lat ??
      c.centroid_lat ??
      c.lat_center ??
      c.cell_lat ??
      (Array.isArray(c.center) ? c.center[0] : undefined);

    const lngRaw =
      c.lng ??
      c.lon ??
      c.long ??
      c.longitude ??
      c.x ??
      c.center_lng ??
      c.center_lon ??
      c.centroid_lng ??
      c.centroid_lon ??
      c.lng_center ??
      c.lon_center ??
      c.cell_lng ??
      (Array.isArray(c.center) ? c.center[1] : undefined);

    const lat = toNum(latRaw);
    const lng = toNum(lngRaw);

    if (Number.isFinite(lat) && Number.isFinite(lng)) pointsRaw.push({ lat, lng, value });
  }

  const BIN = 0.003;
  const keyFor = (lat: number, lng: number) => `${Math.round(lat / BIN) * BIN}|${Math.round(lng / BIN) * BIN}`;

  const bins = new Map<string, { lat: number; lng: number; value: number; n: number }>();
  for (const p of pointsRaw) {
    const k = keyFor(p.lat, p.lng);
    const ex = bins.get(k);
    if (!ex) bins.set(k, { lat: p.lat, lng: p.lng, value: p.value, n: 1 });
    else {
      ex.value += p.value;
      ex.n += 1;
      ex.lat = (ex.lat * (ex.n - 1) + p.lat) / ex.n;
      ex.lng = (ex.lng * (ex.n - 1) + p.lng) / ex.n;
    }
  }

  const MAX_POINTS = 700;
  const points = Array.from(bins.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_POINTS)
    .map((p) => {
      const radius = Math.max(3, Math.min(18, 3 + Math.sqrt(Math.max(0, p.value)) * 1.0));
      return { lat: p.lat, lng: p.lng, value: p.value, radius };
    });

  let max = 1;
  for (const r of rects) max = Math.max(max, r.value);
  for (const p of points) max = Math.max(max, p.value);

  return { rects, points, max };
}

function colorFor(v: number, max: number) {
  const t = Math.max(0, Math.min(1, v / Math.max(1, max)));
  const stops = ["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#2563eb", "#1e3a8a"];
  const idx = Math.min(stops.length - 1, Math.floor(t * (stops.length - 1)));
  return stops[idx];
}

export default function RiskMapPage() {
  const sp = useSearchParams();
  const q = sp.get("q") || "Where are the hotspots right now?";
  const sinceHours = sinceToHours(sp.get("since_hours") || "6");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [answer, setAnswer] = useState("");
  const [region, setRegion] = useState("city");
  const [tiles, setTiles] = useState<RiskTile[]>([]);
  const [source, setSource] = useState<"live_tiles" | "historical_heat" | "none">("none");
  const [histMonth, setHistMonth] = useState<string>("");
  const [monthlyCells, setMonthlyCells] = useState<AnyCell[]>([]);

  const center: [number, number] = [38.627, -90.1994];

  const hist = useMemo(() => normalizeMonthlyCells(monthlyCells), [monthlyCells]);

  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const r1 = await fetch(
        `http://localhost:8000/ask-risk?q=${encodeURIComponent(q)}&since_hours=${sinceHours}`,
        { cache: "no-store" }
      ).then((r) => r.json());

      setAnswer(String(r1?.answer ?? ""));
      setRegion(String(r1?.region ?? "city"));

      const t = Array.isArray(r1?.tiles) ? (r1.tiles as RiskTile[]) : [];
      setTiles(t);

      if (t.length > 0) {
        setSource("live_tiles");
        setMonthlyCells([]);
        setHistMonth("");
        setLoading(false);
        return;
      }

      const meta = await fetch("http://localhost:8000/meta", { cache: "no-store" }).then((r) => r.json());
      const months: string[] = meta?.available_month_names ?? [];
      const pick = months?.[0] || "January2026";
      setHistMonth(pick);

      const heat = await fetch(`http://localhost:8000/monthly-heat?month=${encodeURIComponent(pick)}`, {
        cache: "no-store",
      }).then((r) => r.json());

      const cells = Array.isArray(heat?.cells) ? heat.cells : [];
      setMonthlyCells(cells);

      if (cells.length > 0) setSource("historical_heat");
      else setSource("none");
    } catch (e: any) {
      setErr("Risk map fetch failed. Check backend is running and endpoints return JSON.");
      setSource("none");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sinceHours]);

  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#0b1220", minHeight: "100vh" }}>
      <NavBar />

      <div className="surface" style={{ padding: 16, marginTop: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 20 }}>Risk Map</div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.78)" }}>
            Query: <b style={{ color: "rgba(255,255,255,0.92)" }}>{q}</b>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.62)" }}>
            Window: {sinceHours}h • Region: {region} • Source:{" "}
            <b style={{ color: "rgba(255,255,255,0.85)" }}>
              {source === "live_tiles" ? "Live tiles" : source === "historical_heat" ? `Historical (${histMonth})` : "None"}
            </b>
          </div>
        </div>

        <Button variant="primary" onClick={fetchAll} disabled={loading} style={{ minWidth: 120 }}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 12, marginTop: 12 }}>
        <div className="surface2" style={{ padding: 14 }}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>{source === "live_tiles" ? "Danger tiles" : "Fallback grid"}</div>

          <div style={{ height: 560, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.14)", position: "relative" }}>
            <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {source === "live_tiles" &&
                tiles.map((t, i) => {
                  const fill = colorFor(t.score, Math.max(1, tiles[0]?.score ?? 1));
                  const alpha = Math.min(0.55, 0.16 + (t.score / Math.max(1, tiles[0]?.score ?? 1)) * 0.45);
                  return <Rectangle key={t.id || i} bounds={t.bounds} pathOptions={{ color: "rgba(255,255,255,0.20)", weight: 1, fillColor: fill, fillOpacity: alpha }} />;
                })}

              {source === "historical_heat" &&
                hist.rects.map((r, i) => {
                  const fill = colorFor(r.value, hist.max);
                  const alpha = Math.min(0.55, 0.14 + (r.value / Math.max(1, hist.max)) * 0.45);
                  return <Rectangle key={`hr-${i}`} bounds={r.bounds} pathOptions={{ color: "rgba(255,255,255,0.20)", weight: 1, fillColor: fill, fillOpacity: alpha }} />;
                })}

              {source === "historical_heat" &&
                hist.points.map((p, i) => {
                  const fill = colorFor(p.value, hist.max);
                  const alpha = Math.min(0.75, 0.22 + (p.value / Math.max(1, hist.max)) * 0.50);
                  return (
                    <CircleMarker
                      key={`hp-${i}`}
                      center={[p.lat, p.lng]}
                      radius={p.radius}
                      pathOptions={{ color: "rgba(255,255,255,0.20)", fillColor: fill, fillOpacity: alpha, weight: 1 }}
                    />
                  );
                })}
            </MapContainer>

            {source === "none" && (
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(10,16,32,0.75)", color: "rgba(255,255,255,0.75)", fontWeight: 900 }}>
                No tiles and no historical grid returned.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div
            className="surface"
            style={{
              padding: 14,
              borderRadius: 16,
              border: "1px solid rgba(124,58,237,0.35)",
              background: "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(34,211,238,0.10))",
              minHeight: 220,
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900, marginBottom: 10 }}>AI Narrative</div>
            {err ? (
              <div style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.55 }}>{err}</div>
            ) : (
              <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.92)", lineHeight: 1.55 }}>
                {answer || "No narrative returned yet."}
              </div>
            )}
          </div>

          <div
            className="surface"
            style={{
              padding: 14,
              borderRadius: 16,
              border: "1px solid rgba(34,211,238,0.32)",
              background: "linear-gradient(135deg, rgba(34,211,238,0.16), rgba(52,211,153,0.08))",
              minHeight: 180,
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900, marginBottom: 10 }}>
              Top zones
            </div>

            {source === "live_tiles" && tiles.length > 0 ? (
              <div style={{ display: "grid", gap: 8 }}>
                {tiles.slice(0, 6).map((t, i) => (
                  <div key={t.id || i} className="surface2" style={{ padding: "10px 12px", borderRadius: 14, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{t.top_type ?? "—"}</div>
                    <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>{Number(t.score ?? 0).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            ) : source === "historical_heat" ? (
              <div style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>
                Showing historical fallback grid for <b>{histMonth}</b>.
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.70)" }}>No zones yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}