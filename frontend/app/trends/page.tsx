"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

function fmtHourLabel(h: number) {
  // 0..23 -> "12a", "1a", ... "12p", "1p"
  const ampm = h < 12 ? "a" : "p";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}${ampm}`;
}

function fmtTimeLabel(iso: string) {
  // ISO -> "7:00 PM"
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function TrendsPage() {
  // --- LIVE ---
  const [liveHours, setLiveHours] = useState<1 | 6 | 24>(24);
  const [liveHourly, setLiveHourly] = useState<any>(null);
  const [liveTypes, setLiveTypes] = useState<any>(null);

  // --- HISTORICAL ---
  const [histMonth, setHistMonth] = useState("January2026");
  const [histStats, setHistStats] = useState<any>(null);

  const loadLive = async () => {
    const h = await fetch(
      `http://localhost:8000/live-hourly?since_hours=${liveHours}`
    ).then((r) => r.json());

    const t = await fetch(
      `http://localhost:8000/live-types?since_hours=${liveHours}`
    ).then((r) => r.json());

    setLiveHourly(h);
    setLiveTypes(t);
  };

  const loadHist = async () => {
    const st = await fetch(
      `http://localhost:8000/monthly-stats?month=${encodeURIComponent(histMonth)}`
    ).then((r) => r.json());
    setHistStats(st);
  };

  useEffect(() => {
    loadLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveHours]);

  useEffect(() => {
    loadHist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histMonth]);

  // auto-refresh live every 60s
  useEffect(() => {
    const id = setInterval(() => loadLive(), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveHours]);

  // -------------------------
  // LIVE DATA SHAPING
  // -------------------------
  const liveHourlyData = useMemo(() => {
    const arr = (liveHourly?.hourly ?? []) as { hour: string; count: number }[];
    return arr.map((x) => ({
      hourISO: x.hour,
      hourLabel: fmtTimeLabel(x.hour),
      count: x.count,
    }));
  }, [liveHourly]);

  const liveTopTypesData = useMemo(() => {
    return (liveTypes?.top_types ?? []) as { type: string; count: number }[];
  }, [liveTypes]);

  // -------------------------
  // HISTORICAL DATA SHAPING (always render 0..23)
  // -------------------------
  const histHourlyData = useMemo(() => {
    const raw = (histStats?.hour_series ?? []) as { hour: number; count: number }[];
    const map = new Map<number, number>();
    raw.forEach((p) => map.set(Number(p.hour), Number(p.count)));

    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      hourLabel: fmtHourLabel(h),
      count: map.get(h) ?? 0,
    }));
  }, [histStats]);

  const histTopTypesData = useMemo(() => {
    return (histStats?.type_series ?? []) as { type: string; count: number }[];
  }, [histStats]);

  // If CSV time column is date-only, backend should ideally return hour_series=[]
  const histHasHourly = Boolean(histStats?.hour_series?.length);

  return (
    <div
      style={{
        padding: 18,
        fontFamily: "sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <NavBar />
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Trends</h2>

      {/* ---------------- LIVE ---------------- */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>Live Trends</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              Calls for Service (unverified) • awareness only
            </div>
          </div>

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
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
          Last updated:{" "}
          {liveHourly?.last_updated ? new Date(liveHourly.last_updated).toLocaleString() : "—"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h4 style={{ marginTop: 0, marginBottom: 10 }}>Live calls by time</h4>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hourLabel"
                    interval="preserveStartEnd"
                    tick={{ fontSize: 11 }}
                    minTickGap={18}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!liveHourlyData.length && (
              <div style={{ color: "#64748b", fontSize: 12 }}>
                No live hourly data (live feed parse/time parse may need adjustment).
              </div>
            )}
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h4 style={{ marginTop: 0, marginBottom: 10 }}>Top live types</h4>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={liveTopTypesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="type"
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={90}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- HISTORICAL ---------------- */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>Historical Trends</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              From monthly CSV (incidents by hour + top types)
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={histMonth}
              onChange={(e) => setHistMonth(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            >
              <option value="September2025">September2025</option>
              <option value="October2025">October2025</option>
              <option value="November2025">November2025</option>
              <option value="December2025">December2025</option>
              <option value="January2026">January2026</option>
            </select>

            <button
              onClick={loadHist}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {!histStats ? (
          <div style={{ marginTop: 12, color: "#64748b" }}>Loading historical…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <h4 style={{ marginTop: 0, marginBottom: 10 }}>Incidents by hour (0–23)</h4>

              {histHasHourly ? (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={histHourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(v) => fmtHourLabel(Number(v))}
                        interval={2} // cleaner labels: every 2 hours
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: any) => [value, "Incidents"]}
                        labelFormatter={(label) => `Hour: ${fmtHourLabel(Number(label))}`}
                      />
                      <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: 280, display: "grid", placeItems: "center", color: "#64748b" }}>
                  Hour-of-day isn’t available for this CSV (date-only timestamps).
                </div>
              )}

              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                Using columns: time={String(histStats.used_time_col)} • type={String(histStats.used_type_col)}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
              <h4 style={{ marginTop: 0, marginBottom: 10 }}>Top types (historical)</h4>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histTopTypesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="type"
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={90}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0f172a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}