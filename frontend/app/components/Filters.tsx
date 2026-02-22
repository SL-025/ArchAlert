"use client";

export default function Filters({
  since,
  setSince,
  showHistorical,
  setShowHistorical,
  showLive,
  setShowLive,
  onRefreshLive,

  monthMode,
  setMonthMode,
  selectedMonth,
  setSelectedMonth,
  monthsBack,
  setMonthsBack,
  lastDays,
  setLastDays,
  yearRangeUiOnly,
  setYearRangeUiOnly,
  availableMonths,
}: {
  since: "1h" | "6h" | "24h";
  setSince: (v: "1h" | "6h" | "24h") => void;
  showHistorical: boolean;
  setShowHistorical: (v: boolean) => void;
  showLive: boolean;
  setShowLive: (v: boolean) => void;
  onRefreshLive: () => void;

  monthMode: "single" | "multi";
  setMonthMode: (v: "single" | "multi") => void;
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  monthsBack: number;
  setMonthsBack: (v: number) => void;

  lastDays: 0 | 2 | 5;
  setLastDays: (v: 0 | 2 | 5) => void;

  yearRangeUiOnly: 1 | 3;
  setYearRangeUiOnly: (v: 1 | 3) => void;

  availableMonths: string[];
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

  const SmallBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#0f172a",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      <h3 style={{ marginTop: 0 }}>Filters</h3>

      {/* LIVE time window */}
      <div style={{ marginBottom: 10, fontSize: 12, color: "#64748b" }}>Live time window</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Btn label="1h" val="1h" />
        <Btn label="6h" val="6h" />
        <Btn label="24h" val="24h" />
      </div>

      {/* Historical window */}
      <div style={{ marginBottom: 10, fontSize: 12, color: "#64748b" }}>Historical window</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <SmallBtn label="All month" active={lastDays === 0} onClick={() => setLastDays(0)} />
        <SmallBtn label="Last 2 days" active={lastDays === 2} onClick={() => setLastDays(2)} />
        <SmallBtn label="Last 5 days" active={lastDays === 5} onClick={() => setLastDays(5)} />
      </div>

      {/* Month mode */}
      <div style={{ marginBottom: 10, fontSize: 12, color: "#64748b" }}>Month selection</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <SmallBtn label="Single month" active={monthMode === "single"} onClick={() => setMonthMode("single")} />
        <SmallBtn label="Last N months" active={monthMode === "multi"} onClick={() => setMonthMode("multi")} />
      </div>

      {monthMode === "single" ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Choose month</div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Months back</div>
          <select
            value={monthsBack}
            onChange={(e) => setMonthsBack(parseInt(e.target.value, 10))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Last {n} month{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/*range UI only */}
      <div style={{ marginBottom: 10, fontSize: 12, color: "#64748b" }}>Year range (UI only)</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <SmallBtn label="1 year" active={yearRangeUiOnly === 1} onClick={() => setYearRangeUiOnly(1)} />
        <SmallBtn label="3 years" active={yearRangeUiOnly === 3} onClick={() => setYearRangeUiOnly(3)} />
      </div>

      {/* Layers */}
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