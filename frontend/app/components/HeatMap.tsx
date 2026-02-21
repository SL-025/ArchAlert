"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";

type Cell = { center: [number, number]; count: number };

export default function HeatMap({ cells }: { cells: Cell[] }) {
  const mapRef = useRef<L.Map | null>(null);
  const max = Math.max(...cells.map((c) => c.count), 1);

  // ✅ cleanup on unmount / hot reload
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ height: 520, width: "100%" }}>
      <MapContainer
        ref={(m) => {
          // MapContainer gives us the Leaflet map instance
          mapRef.current = m as unknown as L.Map;
        }}
        center={[38.627, -90.1994]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {cells.slice(0, 6000).map((c, i) => {
          const intensity = c.count / max;
          const color =
            intensity > 0.6 ? "#ff2d2d" : intensity > 0.3 ? "#ff9f1a" : "#ffd60a";

          return (
            <CircleMarker
              key={i}
              center={c.center}
              radius={2 + intensity * 8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 0 }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}