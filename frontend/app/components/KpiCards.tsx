"use client";

function fmtMaybeDate(s: string) {
  if (!s) return "—";
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toLocaleString();
  return String(s);
}

export default function KpiCards(props: {
  monthlyCellCount: number;
  liveTotal: number;
  topType: string;
  lastUpdated: string;
}) {
  const Item = (p: { title: string; value: any; sub?: string }) => (
    <div className="surface2" style={{ padding: 14, minHeight: 82 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", fontWeight: 800 }}>{p.title}</div>
      <div style={{ fontSize: 26, fontWeight: 950, marginTop: 8, color: "rgba(255,255,255,0.95)" }}>
        {p.value}
      </div>
      {p.sub ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{p.sub}</div>
      ) : null}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
      <Item title="Historical Heat Cells" value={props.monthlyCellCount ?? 0} />
      <Item title="Live Calls (Unverified)" value={props.liveTotal ?? 0} />
      <Item title="Top Live Type" value={props.topType || "—"} />
      <Item title="Live Last Updated" value=" " sub={fmtMaybeDate(props.lastUpdated)} />
    </div>
  );
}