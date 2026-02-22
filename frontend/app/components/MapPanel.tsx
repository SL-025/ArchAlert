"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Rectangle, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type AnyCell = Record<string, any>;

type DrawItem =
  | { kind: "rect"; bounds: [[number, number], [number, number]]; value: number }
  | { kind: "point"; lat: number; lng: number; value: number; radius: number };

export default function MapPanel({
  monthlyCells,
  showHistorical,
  mapKey,
}: {
  monthlyCells: AnyCell[];
  showHistorical: boolean;
  mapKey: string;
}) {
  const normalized = useMemo(() => {
    const cells = Array.isArray(monthlyCells) ? monthlyCells : [];
    const rects: DrawItem[] = [];
    const pointsRaw: Array<{ lat: number; lng: number; value: number }> = [];

    const toNum = (x: any) => {
      const n = Number(x);
      return Number.isFinite(n) ? n : NaN;
    };

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
          kind: "rect",
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

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        pointsRaw.push({ lat, lng, value });
      }
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
    const binned = Array.from(bins.values()).sort((a, b) => b.value - a.value).slice(0, MAX_POINTS);

    const points: DrawItem[] = binned.map((p) => {
      const radius = Math.max(3, Math.min(18, 3 + Math.sqrt(Math.max(0, p.value)) * 1.0));
      return { kind: "point", lat: p.lat, lng: p.lng, value: p.value, radius };
    });

    const items = [...rects, ...points];

    let max = 1;
    for (const e of items) max = Math.max(max, e.value || 0);

    return { items, max, rawPoints: pointsRaw.length, binnedPoints: points.length };
  }, [monthlyCells]);

  const center: [number, number] = [38.627, -90.1994];

  const colorFor = (v: number, max: number) => {
    const t = Math.max(0, Math.min(1, v / Math.max(1, max)));
    const stops = ["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#075985"];
    const idx = Math.min(stops.length - 1, Math.floor(t * (stops.length - 1)));
    return stops[idx];
  };

  const styleRect = (v: number) => {
    const fill = colorFor(v, normalized.max);
    const alpha = Math.min(0.55, 0.12 + (v / Math.max(1, normalized.max)) * 0.45);
    return { color: fill, weight: 1, fillColor: fill, fillOpacity: alpha } as const;
  };

  const showEmpty = !showHistorical || normalized.items.length === 0;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0 }}>Map</h3>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            Historical heat layer {showHistorical ? "ON" : "OFF"} • Raw points: {normalized.rawPoints} → Binned:{" "}
            {normalized.binnedPoints}
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
            color: "#0f172a",
            maxWidth: 360,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={mapKey}
        >
          Active: {mapKey}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div
          key={mapKey}
          style={{
            height: 520,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            position: "relative",
          }}
        >
          <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {!showEmpty &&
              normalized.items.map((it, idx) => {
                if (it.kind === "rect") {
                  return <Rectangle key={`r-${idx}`} bounds={it.bounds} pathOptions={styleRect(it.value)} />;
                }
                const fill = colorFor(it.value, normalized.max);
                const alpha = Math.min(0.75, 0.18 + (it.value / Math.max(1, normalized.max)) * 0.55);
                return (
                  <CircleMarker
                    key={`p-${idx}`}
                    center={[it.lat, it.lng]}
                    radius={it.radius}
                    pathOptions={{ color: fill, fillColor: fill, fillOpacity: alpha, weight: 1 }}
                  />
                );
              })}
          </MapContainer>

          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              zIndex: 9999,
              background: "rgba(255,255,255,0.96)",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 10,
              width: 190,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8, color: "#0f172a" }}>Legend</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 10, background: "#0ea5e9", borderRadius: 3, border: "1px solid #e5e7eb" }} />
              <div style={{ fontSize: 12, color: "#334155" }}>Historical intensity</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#64748b", lineHeight: 1.35 }}>
              Points are aggregated into bins to reduce clutter.
            </div>
          </div>

          {showEmpty && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.92)",
                color: "#64748b",
                fontWeight: 700,
                zIndex: 9998,
              }}
            >
              {showHistorical ? "Loading / No historical cells..." : "Historical layer is OFF"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}