"use client";

export default function Insights({
  liveTotal,
  topTypes,
  lastUpdated,
}: {
  liveTotal: number;
  topTypes: [string, number][];
  lastUpdated: string;
}) {
  const top = topTypes?.[0]?.[0] ?? "—";
  const insight =
    liveTotal > 0
      ? `Live calls are currently dominated by “${top}”. Use this as awareness (calls are unverified).`
      : `Live calls list is empty right now (or the page parse needs tuning). Historical heatmap still works.`;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      <h3 style={{ marginTop: 0 }}>Insights</h3>

      <div style={{ fontSize: 12, color: "#64748b" }}>Live last updated</div>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>
        {lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"}
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>AI Summary (template)</div>
      <div style={{ marginTop: 6, lineHeight: 1.4 }}>{insight}</div>

      <hr style={{ margin: "14px 0", borderColor: "#e5e7eb" }} />

      <div style={{ fontSize: 12, color: "#64748b" }}>Top Live Types</div>
      <ol style={{ marginTop: 8 }}>
        {(topTypes || []).slice(0, 8).map((x, i) => (
          <li key={i}>
            {x[0]} — <b>{x[1]}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}