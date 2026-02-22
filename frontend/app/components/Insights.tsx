"use client";

function fmtMaybeDate(s: string) {
  if (!s) return "—";
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toLocaleString();
  return String(s);
}

export default function Insights(props: { liveTotal: number; topTypes: any[]; lastUpdated: string }) {
  const top = Array.isArray(props.topTypes) ? props.topTypes.slice(0, 8) : [];

  const aiText =
    props.liveTotal > 0
      ? `Live calls are present in this window (total: ${props.liveTotal}). Use for awareness only (unverified feed).`
      : "No live calls in this window (or the feed parser needs tuning).";

  return (
    <div className="surface2" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 950 }}>Insights</div>
        <div className="badge">
          Live updated: <b style={{ color: "rgba(255,255,255,0.92)" }}>{fmtMaybeDate(props.lastUpdated)}</b>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div style={{ display: "grid", gap: 12 }}>
        <div
          className="surface"
          style={{
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(124,58,237,0.35)",
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(34,211,238,0.10))",
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900, marginBottom: 8 }}>
            AI Summary
          </div>
          <div style={{ color: "rgba(255,255,255,0.90)", lineHeight: 1.55 }}>{aiText}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            Note: This is a template summary. We’ll replace with AI/anomaly logic in the next phase.
          </div>
        </div>

        <div
          className="surface"
          style={{
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(34,211,238,0.32)",
            background:
              "linear-gradient(135deg, rgba(34,211,238,0.16), rgba(52,211,153,0.08))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>Top Live Types</div>
            <div className="badge">Total: <b style={{ color: "rgba(255,255,255,0.92)" }}>{props.liveTotal ?? 0}</b></div>
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

            {top.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.70)" }}>No live type data for this window.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}