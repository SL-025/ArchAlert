"use client";

export default function Filters({
  since,
  setSince,
  showHistorical,
  setShowHistorical,
  showLive,
  setShowLive,
  onRefreshLive,
}: {
  since: "1h" | "6h" | "24h";
  setSince: (v: "1h" | "6h" | "24h") => void;
  showHistorical: boolean;
  setShowHistorical: (v: boolean) => void;
  showLive: boolean;
  setShowLive: (v: boolean) => void;
  onRefreshLive: () => void;
}) {
  const Btn = ({ label, val }: { label: string; val: "1h" | "6h" | "24h" }) => (
    <button
      onClick={() => setSince(val)}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: since === val ? "#0f172a" : "#fff",
        color: since === val ? "#fff" : "#0f172a",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      <h3 style={{ marginTop: 0 }}>Filters</h3>

      <div style={{ marginBottom: 10, fontSize: 12, color: "#64748b" }}>Live time window</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Btn label="1h" val="1h" />
        <Btn label="6h" val="6h" />
        <Btn label="24h" val="24h" />
      </div>

      <label style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <input type="checkbox" checked={showHistorical} onChange={(e) => setShowHistorical(e.target.checked)} />
        Historical Heatmap
      </label>

      <label style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
        <input type="checkbox" checked={showLive} onChange={(e) => setShowLive(e.target.checked)} />
        Live Layer (list + stats)
      </label>

      <button
        onClick={onRefreshLive}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "#2563eb",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Refresh Live
      </button>

      <div style={{ marginTop: 12, fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
        Live layer reflects <b>Calls for Service (unverified)</b>. For awareness only.
      </div>
    </div>
  );
}