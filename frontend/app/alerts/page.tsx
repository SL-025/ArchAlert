"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { useLiveWindow } from "../lib/useLiveWindow";
import { Button, Card, LiveWindowToggle, Pill } from "../components/ui";

const sinceToHours = (s: "1h" | "6h" | "24h") => (s === "1h" ? 1 : s === "6h" ? 6 : 24);

export default function AlertsPage() {
  const { since, setSince } = useLiveWindow("6h");
  const hours = sinceToHours(since);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`http://localhost:8000/alerts?since_hours=${hours}`, { cache: "no-store" }).then((x) =>
        x.json()
      );
      setData(r);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const lastUpdated = useMemo(() => {
    if (!data?.last_updated) return "—";
    try {
      return new Date(data.last_updated).toLocaleString();
    } catch {
      return String(data.last_updated);
    }
  }, [data]);

  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <NavBar />

      <Card
        title="Live Alerts"
        right={<Pill>Window: {hours}h</Pill>}
      >
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
          Calls for Service (unverified). Last updated: <b>{lastUpdated}</b>
        </div>

        <LiveWindowToggle
          value={since}
          onChange={setSince}
          right={
            <Button variant="primary" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          }
        />

        <div style={{ height: 12 }} />

        <div style={{ padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
          <b>Summary:</b> {data?.summary ?? "Loading..."}
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gap: 10 }}>
          {(data?.items ?? []).map((c: any, i: number) => (
            <div
              key={i}
              style={{
                border: "1px solid #e5e7eb",
                padding: 12,
                borderRadius: 14,
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: "#0f172a" }}>{c.type}</div>
                <div style={{ marginTop: 4, color: "#334155" }}>{c.location}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{c.time}</div>
              </div>

              <Pill>Live</Pill>
            </div>
          ))}

          {!loading && (data?.items?.length ?? 0) === 0 && <div style={{ color: "#64748b" }}>No items for this window.</div>}
        </div>
      </Card>
    </div>
  );
}