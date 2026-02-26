"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { useLiveWindow } from "../lib/useLiveWindow";
import { apiUrl } from "../lib/api";
import { Button, Card, LiveWindowToggle, Pill } from "../components/ui";
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
        fill="rgba(255,255,255,0.70)"
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
  const { since, setSince } = useLiveWindow("6h");
  const liveHours = sinceToHours(since);

  const [liveHourly, setLiveHourly] = useState<any>(null);
  const [liveTypes, setLiveTypes] = useState<any>(null);

  const [histMonth, setHistMonth] = useState("January2026");
  const [histStats, setHistStats] = useState<any>(null);

  const loadLive = async () => {
    const h = await fetch(apiUrl(`/live-hourly?since_hours=${liveHours}`), { cache: "no-store" }).then((r) => r.json());
    const t = await fetch(apiUrl(`/live-types?since_hours=${liveHours}`), { cache: "no-store" }).then((r) => r.json());
    setLiveHourly(h);
    setLiveTypes(t);
  };

  const loadHist = async () => {
    const st = await fetch(apiUrl(`/monthly-stats?month=${encodeURIComponent(histMonth)}`), { cache: "no-store" }).then((r) =>
      r.json()
    );
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
    return arr.map((x) => ({ hourLabel: fmtTimeLabel(x.hour), count: x.count }));
  }, [liveHourly]);

  const liveTypesData = useMemo(() => {
    const raw = liveTypes?.top_types ?? [];
    if (Array.isArray(raw) && raw.length && Array.isArray(raw[0])) {
      return raw.map((row: any) => ({ type: String(row[0]), count: Number(row[1]) || 0 }));
    }
    return (raw as any[]).map((x) => ({ type: String((x as any).type), count: Number((x as any).count) || 0 }));
  }, [liveTypes]);

  const histTypesData = useMemo(() => {
    const raw = (histStats?.type_series ?? []) as any[];
    return raw.map((x) => ({
      type: String((x as any).type ?? (x as any)[0] ?? ""),
      count: Number((x as any).count ?? (x as any)[1] ?? 0) || 0,
    }));
  }, [histStats]);

  return (
    <div>
      <NavBar />

      <div className="surface" style={{ padding: 16, marginBottom: 12 }}>
        <div className="row space" style={{ flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 950 }}>Trends</div>
            <div className="muted">Live window affects charts. Historical uses monthly CSV.</div>
          </div>
          <Pill>Window: {liveHours}h</Pill>
        </div>
      </div>

      <Card
        title="Live Trends"
        right={
          <LiveWindowToggle
            value={since}
            onChange={setSince}
            right={
              <Button variant="primary" onClick={loadLive}>
                Refresh
              </Button>
            }
          />
        }
      >
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Calls for Service (unverified)
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="surface" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Live calls by time</div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveHourlyData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hourLabel"
                    tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a1020",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Top live types</div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={liveTypesData} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="type"
                    interval={0}
                    tick={<CustomTypeTick />}
                    height={80}
                    axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a1020",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  />
                  <Bar dataKey="count" fill="rgba(255,255,255,0.82)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ height: 12 }} />

      <Card
        title="Historical Types"
        right={
          <div className="row" style={{ gap: 8 }}>
            <select value={histMonth} onChange={(e) => setHistMonth(e.target.value)} className="input" style={{ width: 220 }}>
              <option value="September2025">September2025</option>
              <option value="October2025">October2025</option>
              <option value="November2025">November2025</option>
              <option value="December2025">December2025</option>
              <option value="January2026">January2026</option>
            </select>
            <Button variant="primary" onClick={loadHist}>
              Refresh
            </Button>
          </div>
        }
      >
        {!histStats ? (
          <div className="muted">Loading historical...</div>
        ) : (
          <div className="surface" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Top types (historical)</div>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histTypesData} margin={{ top: 10, right: 10, left: 0, bottom: 90 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="type"
                    interval={0}
                    tick={<CustomTypeTick />}
                    height={90}
                    axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0a1020",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  />
                  <Bar dataKey="count" fill="rgba(255,255,255,0.82)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}