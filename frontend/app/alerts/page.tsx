"use client";

import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any>(null);

  const load = () => fetch("http://localhost:8000/alerts").then(r => r.json()).then(setAlerts);

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <NavBar />
      <h2 style={{ marginTop: 0 }}>Alerts (Live Calls)</h2>

      {!alerts ? (
        <p>Loading…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Recent Calls (Top 50)</h3>
              <button onClick={load} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", cursor: "pointer" }}>
                Refresh
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
              Last updated: {alerts.last_updated ? new Date(alerts.last_updated).toLocaleString() : "—"} • Total: {alerts.total}
            </div>

            <div style={{ marginTop: 10, overflow: "auto", maxHeight: 520 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Time</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Type</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: 8 }}>Location (block)</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.items.map((x: any, i: number) => (
                    <tr key={i}>
                      <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>{x.time}</td>
                      <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>{x.type}</td>
                      <td style={{ borderBottom: "1px solid #f1f5f9", padding: 8 }}>{x.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>AI Summary (Template)</h3>
            <div style={{ lineHeight: 1.45 }}>{alerts.summary}</div>

            <hr style={{ margin: "14px 0", borderColor: "#e5e7eb" }} />

            <h4 style={{ marginTop: 0 }}>Top Types</h4>
            <ol>
              {(alerts.top_types || []).map((t: any, i: number) => (
                <li key={i}>{t[0]} — <b>{t[1]}</b></li>
              ))}
            </ol>

            <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
              Disclaimer: Calls for service are unverified. For awareness only.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}