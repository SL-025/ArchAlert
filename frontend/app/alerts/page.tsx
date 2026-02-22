"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "../components/NavBar";
import { useLiveWindow } from "../lib/useLiveWindow";

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

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Live Alerts</h2>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
            Calls for Service (unverified) • Awareness only
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Btn label="1h" val="1h" />
          <Btn label="6h" val="6h" />
          <Btn label="24h" val="24h" />
          <button
            onClick={load}
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
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
        Window: last <b>{hours}h</b> • Last updated: <b>{lastUpdated}</b> • Total: <b>{data?.total ?? "—"}</b>
      </div>

      <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff" }}>
        <b>Summary:</b> {data?.summary ?? "Loading…"}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
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

            <div
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                color: "#0f172a",
                background: "#f8fafc",
                whiteSpace: "nowrap",
              }}
            >
              Live
            </div>
          </div>
        ))}

        {!loading && (data?.items?.length ?? 0) === 0 && <div style={{ color: "#64748b", padding: 12 }}>No items.</div>}
      </div>
    </div>
  );
}