"use client";

import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar
} from "recharts";

function labelHour(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function TrendsPage() {
  const [stats, setStats] = useState<any>(null);

  const [liveHours, setLiveHours] = useState<1 | 6 | 24>(24);
  const [liveHourly, setLiveHourly] = useState<any>(null);
  const [liveTypes, setLiveTypes] = useState<any>(null);

  // historical (still uses one selected month on backend default)
  useEffect(() => {
    fetch("http://localhost:8000/monthly-stats?month=January2026")
      .then(r => r.json())
      .then(setStats);
  }, []);

  const loadLive = async () => {
    const h = await fetch(`http://localhost:8000/live-hourly?since_hours=${liveHours}`).then(r => r.json());
    const t = await fetch(`http://localhost:8000/live-types?since_hours=${liveHours}`).then(r => r.json());
    setLiveHourly(h);
    setLiveTypes(t);
  };

  useEffect(() => {
    loadLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveHours]);

  // optional: auto-refresh live every 60s
  useEffect(() => {
    const id = setInterval(() => loadLive(), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveHours]);

  const liveHourlyData = (liveHourly?.hourly ?? []).map((x: any) => ({
    hour: x.hour,
    hourLabel: labelHour(x.hour),
    count: x.count,
  }));

  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <NavBar />
      <h2 style={{ marginTop: 0 }}>Trends</h2>

      {/* LIVE SECTION */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Live Trends (Calls for Service — unverified)</h3>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={liveHours}
              onChange={(e) => setLiveHours(parseInt(e.target.value, 10) as any)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            >
              <option value={1}>Last 1 hour</option>
              <option value={6}>Last 6 hours</option>
              <option value={24}>Last 24 hours</option>
            </select>

            <button
              onClick={loadLive}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", cursor: "pointer" }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
          Last updated: {liveHourly?.last_updated ? new Date(liveHourly.last_updated).toLocaleString() : "—"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h4 style={{ marginTop: 0 }}>Live calls by hour</h4>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hourLabel" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!liveHourlyData.length && (
              <div style={{ color: "#64748b", fontSize: 12 }}>
                No live hourly data (parser/time parse may need adjustment).
              </div>
            )}
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h4 style={{ marginTop: 0 }}>Top live types</h4>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={liveTypes?.top_types ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
          For awareness only. Live feed is unverified calls for service.
        </div>
      </div>

      {/* HISTORICAL SECTION (existing) */}
      {!stats ? (
        <p>Loading historical…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>Historical Incidents by Hour</h3>
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
            {!stats.hour_series?.length && (
              <div style={{ color: "#64748b", fontSize: 12 }}>
                Hour chart empty (date parse issue in CSV). Check backend `/monthly-stats`.
              </div>
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <h3 style={{ marginTop: 0 }}>Historical Top Types</h3>
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