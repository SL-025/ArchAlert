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
      const r = await fetch(`http://localhost:8000/alerts?since_hours=${hours}`, { cache: "no-store" }).then((x) => x.json());
      setData(r);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const lastUpdated = useMemo(() => {
    if (!data?.last_updated) return "—";
    try { return new Date(data.last_updated).toLocaleString(); } catch { return String(data.last_updated); }
  }, [data]);

  return (
    <div>
      <NavBar />

      <div className="surface" style={{ padding: 16, marginBottom: 12 }}>
        <div className="row space" style={{ flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 950 }}>Alerts</div>
            <div className="muted">Live calls are unverified. Use as awareness.</div>
          </div>
          <Pill>Window: {hours}h</Pill>
        </div>
      </div>

      <Card
        title="Live Alerts"
        right={
          <LiveWindowToggle
            value={since}
            onChange={setSince}
            right={
              <Button variant="primary" onClick={load} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            }
          />
        }
      >
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          Last updated: <b style={{ color: "rgba(255,255,255,0.92)" }}>{lastUpdated}</b>
        </div>

        <div className="surface" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Summary</div>
          <div className="muted">{data?.summary ?? "Loading..."}</div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {(data?.items ?? []).map((c: any, i: number) => (
            <div key={i} className="surface" style={{ padding: 12, borderRadius: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 950 }}>{c.type}</div>
                <div className="muted" style={{ marginTop: 4 }}>{c.location}</div>
                <div className="muted2" style={{ marginTop: 6, fontSize: 12 }}>{c.time}</div>
              </div>
              <Pill>Live</Pill>
            </div>
          ))}

          {!loading && (data?.items?.length ?? 0) === 0 && <div className="muted">No items for this window.</div>}
        </div>
      </Card>
    </div>
  );
}