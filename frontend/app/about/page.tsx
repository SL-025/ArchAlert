"use client";

import NavBar from "../components/NavBar";

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface2" style={{ padding: 16 }}>
      <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 10 }}>{props.title}</div>
      <div style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.65 }}>{props.children}</div>
    </div>
  );
}

function BulletList(props: { items: string[] }) {
  return (
    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
      {props.items.map((t, i) => (
        <div
          key={i}
          className="surface"
          style={{ padding: 12, borderRadius: 14, display: "flex", gap: 10, alignItems: "flex-start" }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              marginTop: 4,
              borderRadius: 999,
              background: "linear-gradient(135deg, var(--primary), var(--primary2))",
              flex: "0 0 auto",
            }}
          />
          <div style={{ color: "rgba(255,255,255,0.86)" }}>{t}</div>
        </div>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div>
      <NavBar />

      <div className="surface" style={{ padding: 18, marginBottom: 12, textAlign: "center" }}>
        <h1 className="heroTitle" style={{ fontSize: 36, margin: 0 }}>
          About / Methodology
        </h1>
        <div className="heroSub" style={{ maxWidth: 920, margin: "10px auto 0" }}>
          ArchAlert is a premium awareness dashboard that combines historical context with live snapshots of Calls for
          Service style data. Live data is unverified and shown for awareness only.
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <Section title="What ArchAlert does">
          <BulletList
            items={[
              "Shows historical hotspot intensity from monthly CSVs as a heat layer on the map.",
              "Shows live activity window (1h / 6h / 24h) and updates KPIs + trends + alerts.",
              "Helps users compare: “What is happening now?” vs “What is typical historically?”",
            ]}
          />
        </Section>

        <Section title="What ArchAlert does not do">
          <BulletList
            items={[
              "Not predictive policing. No future forecasting, no enforcement recommendations.",
              "No identification of individuals. No personal data enrichment.",
              "Live calls are unverified; the dashboard is for awareness and transparency only.",
            ]}
          />
        </Section>

        <Section title="Tech stack (software used)">
          <BulletList
            items={[
              "Frontend: Next.js (App Router) + React + TypeScript",
              "UI: Custom component system (glass surfaces, consistent toggles, reusable buttons)",
              "Maps: Leaflet (react-leaflet) + OpenStreetMap tiles",
              "Charts: Recharts (Trends page)",
              "Backend: FastAPI (Python) serving JSON endpoints for meta, heat, stats, trends, alerts",
              "Data: Monthly CSV historical files + live feed parsing endpoints",
            ]}
          />
        </Section>

        <Section title="Key features (current)">
          <BulletList
            items={[
              "Dashboard: KPIs + map + filters + insights side panel",
              "Trends: live vs historical charts with readable axis labels",
              "Alerts: window-based live alerts list + summary area",
              "Auto-refresh: optional 60s refresh for live endpoints",
            ]}
          />
        </Section>

        <Section title="Reproducibility (how to run locally)">
          <BulletList
            items={[
              "Backend: create venv, install requirements, run FastAPI on localhost:8000",
              "Frontend: install npm deps, run Next.js dev server on localhost:3000",
              "Open Dashboard and verify endpoints: /meta, /monthly-heat, /monthly-stats, /live-summary, /alerts, /live-hourly, /live-types",
            ]}
          />
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            Tip: keep .venv out of git using .gitignore to avoid large-file push failures.
          </div>
        </Section>

        <Section title="Next upgrades (planned)">
          <BulletList
            items={[
              "AI summary: quick risk-context text that explains what changed in the selected live window.",
              "Anomaly detection: compare live counts to historical baseline for the same time-of-day.",
              "Deployment: Docker + cloud deploy (shareable URL) with .env.example for reproducibility.",
            ]}
          />
        </Section>
      </div>
    </div>
  );
}