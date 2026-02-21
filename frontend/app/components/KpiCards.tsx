"use client";

export default function KpiCards({
  monthlyCellCount,
  liveTotal,
  topType,
  lastUpdated,
}: {
  monthlyCellCount: number;
  liveTotal: number;
  topType: string;
  lastUpdated: string;
}) {
  const Card = ({ title, value }: { title: string; value: any }) => (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      <div style={{ fontSize: 12, color: "#64748b" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
      <Card title="Historical Heat Cells (Jan 2026)" value={monthlyCellCount || 0} />
      <Card title="Live Calls (Unverified)" value={liveTotal || 0} />
      <Card title="Top Live Type" value={topType || "—"} />
      <Card title="Live Last Updated" value={lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"} />
    </div>
  );
}