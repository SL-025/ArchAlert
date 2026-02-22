"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { useLiveWindow } from "../lib/useLiveWindow";
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

const sinceToHours = (s: "1h" | "6h" | "24h") => (s === "1h" ? 1 : s === "6h" ? 6 : 24);

function fmtHourLabel(h: number) {
  const ampm = h < 12 ? "a" : "p";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}${ampm}`;
}

function fmtTimeLabel(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function truncateLabel(s: string, max = 18) {
  const t = (s ?? "").toString().trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

/** ✅ Custom tick so X-axis labels don't collide / vanish */
function CustomTypeTick(props: any) {
  const { x, y, payload } = props;
  const full = String(payload?.value ?? "");
  const short = truncateLabel(full, 20);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="end"
        fill="#334155"
        fontSize={11}
        transform="rotate(-25)"
      >
        {short}
        <title>{full}</title>
      </text>
    </g>
  );
}

export default function TrendsPage() {
  // ✅ shared live window
  const { since, setSince } = useLiveWindow("6h");
  const liveHours = sinceToHours(since);

  const [liveHourly, setLiveHourly] = useState<any>(null);
  const [liveTypes, setLiveTypes] = useState<any>(null);

  // historical
  const [histMonth, setHistMonth] = useState("January2026");
  const [histStats, setHistStats] = useState<any>(null);

  const loadLive = async () => {
    const h = await fetch(`http://localhost:8000/live-hourly?since_hours=${liveHours}`, { cache: "no-store" }).then(
      (r) => r.json()
    );
    const t = await fetch(`http://localhost:8000/live-types?since_hours=${liveHours}`, { cache: "no-store" }).then(
      (r) => r.json()
    );
    setLiveHourly(h);
    setLiveTypes(t);
  };

  const loadHist = async () => {
    const st = await fetch(`http://localhost:8000/monthly-stats?month=${encodeURIComponent(histMonth)}`, {
      cache: "no-store",
    }).then((r) => r.json());
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

  useEffect(() => {
    const id = setInterval(loadLive, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveHours]);

  const liveHourlyData = useMemo(() => {
    const arr = (liveHourly?.hourly ?? []) as { hour: string; count: number }[];
    return arr.map((x) => ({
      hourISO: x.hour,
      hourLabel: fmtTimeLabel(x.hour),
      count: x.count,
    }));
  }, [liveHourly]);

  // ✅ Expect live-types to be either [{type,count}] OR [["TYPE",count]]
  const liveTypesData = useMemo(() => {
    const raw = liveTypes?.top_types ?? [];
    if (Array.isArray(raw) && raw.length && Array.isArray(raw[0])) {
      return raw.map((row: any) => ({ type: String(row[0]), count: Number(row[1]) || 0 }));
    }
    return (raw as any[]).map((x) => ({ type: String(x.type), count: Number(x.count) || 0 }));
  }, [liveTypes]);

  const histHourlyData = useMemo(() => {
    const raw = (histStats?.hour_series ?? []) as { hour: number; count: number }[];
    const map = new Map<number, number>();
    raw.forEach((p) => map.set(Number(p.hour), Number(p.count)));
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: map.get(h) ?? 0,
    }));
  }, [histStats]);

  const histHasHourly = Boolean(histStats?.hour_series?.length);

  const histTypesData = useMemo(() => {
    const raw = (histStats?.type_series ?? []) as any[];
    return raw.map((x) => ({
      type: String(x.type ?? x[0] ?? ""),
      count: Number(x.count ?? x[1] ?? 0) || 0,
    }));
  }, [histStats]);

  const Btn = ({ label, val }: { label: string; val: "1h" | "6h" | "24h" }) => {
    const active = since === val;
    return (
      <button
        onClick={() => setSince(val)}
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: active ? "#0f172a" : "#fff",
          color: active ? "#fff" : "#0f172a",
          cursor: "pointer",
          fontWeight: 700,
          minWidth: 70,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <NavBar />
      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Trends</h2>

      {/* LIVE */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Live Trends</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Calls for Service (unverified) • awareness only</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn label="1h" val="1h" />
            <Btn label="6h" val="6h" />
            <Btn label="24h" val="24h" />
            <button
              onClick={loadLive}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
          Window: last <b>{liveHours}h</b> • Last updated:{" "}
          <b>{liveHourly?.last_updated ? new Date(liveHourly.last_updated).toLocaleString() : "—"}</b>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h4 style={{ marginTop: 0, marginBottom: 10 }}>Live calls by time</h4>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hourLabel" interval="preserveStartEnd" tick={{ fontSize: 11 }} minTickGap={18} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <h4 style={{ marginTop: 0, marginBottom: 10 }}>Top live types</h4>

            {/* ✅ bigger bottom margin + custom tick */}
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={liveTypesData} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" interval={0} tick={<CustomTypeTick />} height={80} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: any) => [v, "Count"]}
                    labelFormatter={(label: any) => String(label)}
                  />
                  <Bar dataKey="count" fill="#0f172a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORICAL */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Historical Trends</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>From monthly CSV</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={histMonth} onChange={(e) => setHistMonth(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}>
              <option value="September2025">September2025</option>
              <option value="October2025">October2025</option>
              <option value="November2025">November2025</option>
              <option value="December2025">December2025</option>
              <option value="January2026">January2026</option>
            </select>

            <button
              onClick={loadHist}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 700 }}
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
                      <XAxis dataKey="hour" tickFormatter={(v) => fmtHourLabel(Number(v))} interval={2} tick={{ fontSize: 11 }} />
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

              {/* ✅ FIXED X-AXIS: custom ticks + bottom margin */}
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histTypesData} margin={{ top: 10, right: 10, left: 0, bottom: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" interval={0} tick={<CustomTypeTick />} height={90} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(v: any) => [v, "Count"]}
                      labelFormatter={(label: any) => String(label)}
                    />
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