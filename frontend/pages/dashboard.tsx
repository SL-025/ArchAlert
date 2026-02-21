import { useEffect, useState } from "react";

export default function Dashboard() {
  const [meta, setMeta] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [liveSummary, setLiveSummary] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/meta").then(r => r.json()).then(setMeta);
    fetch("http://localhost:8000/monthly-heat").then(r => r.json()).then(setMonthly);
    fetch("http://localhost:8000/live-summary").then(r => r.json()).then(setLiveSummary);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>ArchAlert – Dashboard</h1>

      {meta && (
        <div style={{ marginBottom: 12 }}>
          <b>Live last updated:</b> {meta.live_last_updated}<br/>
          <b>Disclaimer:</b> {meta.disclaimer}
        </div>
      )}

      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ border: "1px solid #ddd", padding: 12, width: 260 }}>
          <h3>KPIs</h3>
          <div><b>Monthly cells:</b> {monthly?.cells?.length ?? "..."}</div>
          <div><b>Live calls total:</b> {liveSummary?.total ?? "..."}</div>
        </div>

        <div style={{ flex: 1, border: "1px solid #ddd", padding: 12 }}>
          <h3>Map area (next)</h3>
          <p>Once KPIs load, we add Leaflet heat overlay using monthly.cells centers + counts.</p>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 12, width: 320 }}>
          <h3>Top Live Types</h3>
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