"use client";

import NavBar from "../components/NavBar";

export default function AboutPage() {
  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <NavBar />
      <h2 style={{ marginTop: 0 }}>About / Methodology</h2>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, lineHeight: 1.55 }}>
        <p><b>ArchAlert</b> is an urban safety awareness dashboard for St. Louis.</p>

        <h3>Data Sources</h3>
        <ul>
          <li><b>Live layer:</b> SLMPD Calls for Service page (unverified calls).</li>
          <li><b>Historical layer:</b> SLMPD monthly CSV (January 2026) aggregated into privacy-safe grid cells.</li>
        </ul>

        <h3>What this is / isn’t</h3>
        <ul>
          <li>✅ Awareness + urban data visualization</li>
          <li>✅ Aggregated (no pinpointing individual residences)</li>
          <li>❌ Not predictive policing</li>
          <li>❌ Not a guarantee of safety</li>
        </ul>

        <h3>AI (Lightweight, Explainable)</h3>
        <p>
          “AI insights” are generated from simple, transparent statistics: dominant types, trends, and anomaly-style spikes
          in reported activity. No model training is required for the MVP.
        </p>
      </div>
    </div>
  );
}