"use client";

import { useMemo } from "react";
import { Card, Pill } from "./ui";

function fmtMaybeDate(s: string) {
  if (!s) return "—";
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toLocaleString();
  return String(s);
}

const sinceToHours = (s: "1h" | "6h" | "24h") => (s === "1h" ? 1 : s === "6h" ? 6 : 24);

export default function Insights(props: {
  liveTotal: number;
  topTypes: any[];
  lastUpdated: string;
  since: "1h" | "6h" | "24h";
}) {
  const hours = sinceToHours(props.since);

  const top = useMemo(() => {
    const raw = Array.isArray(props.topTypes) ? props.topTypes : [];
    return raw.slice(0, 8);
  }, [props.topTypes]);

  return (
    <Card
      title="Insights"
      right={
        <Pill title="Backend timestamp">
          Live updated: <b style={{ color: "rgba(255,255,255,0.92)" }}>{fmtMaybeDate(props.lastUpdated)}</b>
        </Pill>
      }
    >
      <div className="surface" style={{ padding: 14, borderRadius: 16, border: "1px solid rgba(34,211,238,0.32)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>Top Live Types</div>
          <div className="badge">
            Window: <b style={{ color: "rgba(255,255,255,0.92)" }}>{hours}h</b> · Total:{" "}
            <b style={{ color: "rgba(255,255,255,0.92)" }}>{props.liveTotal ?? 0}</b>
          </div>
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: "grid", gap: 8 }}>
          {top.map((t: any, i: number) => (
            <div
              key={i}
              className="surface2"
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{String(t?.[0] ?? "—")}</div>
              <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>{Number(t?.[1] ?? 0)}</div>
            </div>
          ))}

          {top.length === 0 && <div style={{ color: "rgba(255,255,255,0.70)" }}>No live type data for this window.</div>}
        </div>
      </div>
    </Card>
  );
}