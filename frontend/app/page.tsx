"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const HeatMap = dynamic(() => import("./components/HeatMap"), { ssr: false });

export default function Home() {
  const [meta, setMeta] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [liveSummary, setLiveSummary] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/meta").then(r => r.json()).then(setMeta);
    fetch("http://localhost:8000/monthly-heat").then(r => r.json()).then(setMonthly);
    fetch("http://localhost:8000/live-summary").then(r => r.json()).then(setLiveSummary);
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>ArchAlert — Dashboard</h1>

      {meta && (
        <div style={{ marginBottom: 12 }}>
          <b>Live last updated:</b> {meta.live_last_updated}<br/>
          <b>Disclaimer:</b> {meta.disclaimer}
        </div>
      )}

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", padding: 12, width: 280 }}>
          <h3>KPIs</h3>
          <div><b>Monthly heat cells:</b> {monthly?.cells?.length ?? "..."}</div>
          <div><b>Live calls total:</b> {liveSummary?.total ?? "..."}</div>
        </div>

        <div style={{ flex: 1, border: "1px solid #ddd", padding: 12 }}>
          <h3>Historical Heatmap (Jan 2026)</h3>
          {monthly?.cells?.length ? <HeatMap cells={monthly.cells} /> : <p>Loading map…</p>}
        </div>

        <div style={{ border: "1px solid #ddd", padding: 12, width: 340 }}>
          <h3>Top Live Call Types</h3>
          <ol>
            {liveSummary?.top_types?.map((x: any, i: number) => (
              <li key={i}>{x[0]} — {x[1]}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}