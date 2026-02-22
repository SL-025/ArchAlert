"use client";

import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar
} from "recharts";

export default function TrendsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/monthly-stats").then(r => r.json()).then(setStats);
  }, []);

  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <NavBar />
      <h2 style={{ marginTop: 0 }}>Trends (January 2026)</h2>

      {!stats ? (
        <p>Loading…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>Incidents by Hour</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.hour_series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>Top Incident Types</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.type_series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Using columns: time={String(stats.used_time_col)} • type={String(stats.used_type_col)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}