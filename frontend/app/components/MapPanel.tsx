"use client";

import dynamic from "next/dynamic";

const HeatMap = dynamic(() => import("./HeatMap"), { ssr: false });

export default function MapPanel({
  monthlyCells,
  showHistorical,
}: {
  monthlyCells: any[];
  showHistorical: boolean;
}) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Map</h3>
        <span style={{ fontSize: 12, color: "#64748b" }}>St. Louis, MO</span>
      </div>

      <div style={{ marginTop: 12 }}>
        {showHistorical && monthlyCells?.length ? (
          <HeatMap cells={monthlyCells} />
        ) : (
          <div style={{ height: 520, display: "grid", placeItems: "center", color: "#64748b" }}>
            Turn on “Historical Heatmap” to view.
          </div>
        )}
      </div>
    </div>
  );
}