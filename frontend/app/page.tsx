"use client";

import { useEffect, useState } from "react";
import NavBar from "./components/NavBar";
import KpiCards from "./components/KpiCards";
import Filters from "./components/Filters";
import MapPanel from "./components/MapPanel";
import Insights from "./components/Insights";

export default function Home() {
  const [meta, setMeta] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [liveSummary, setLiveSummary] = useState<any>(null);

  const [since, setSince] = useState<"1h" | "6h" | "24h">("6h");

  const [showHistorical, setShowHistorical] = useState(true);
  const [showLive, setShowLive] = useState(true);

  const [monthMode, setMonthMode] = useState<"single" | "multi">("single");
  const [selectedMonth, setSelectedMonth] = useState("January2026"); // matches your current filenames
  const [monthsBack, setMonthsBack] = useState(5);

  const [lastDays, setLastDays] = useState<0 | 2 | 5>(0); // 0 = all month
  const [yearRangeUiOnly, setYearRangeUiOnly] = useState<1 | 3>(1); // UI only for now

  const loadAll = async () => {
    const m = await fetch("http://localhost:8000/meta").then((r) => r.json());

    const daysParam = lastDays ? `&last_days=${lastDays}` : "";

    const heatUrl =
      monthMode === "single"
        ? `http://localhost:8000/monthly-heat?month=${encodeURIComponent(selectedMonth)}${daysParam}`
        : `http://localhost:8000/historical-heat?months=${monthsBack}${daysParam}`;

    const statsUrl = `http://localhost:8000/monthly-stats?month=${encodeURIComponent(
      selectedMonth
    )}${daysParam}`;

    const mh = await fetch(heatUrl).then((r) => r.json());
    const st = await fetch(statsUrl).then((r) => r.json());
    const ls = await fetch("http://localhost:8000/live-summary").then((r) => r.json());

    setMeta(m);
    setMonthly(mh);
    setMonthlyStats(st);
    setLiveSummary(ls);
  };

  useEffect(() => {
    loadAll();
  }, [monthMode, selectedMonth, monthsBack, lastDays]);

  useEffect(() => {
    loadAll();
  }, []);

  const monthlyCells = monthly?.cells ?? [];
  const liveTotal = liveSummary?.total ?? 0;
  const topTypes = liveSummary?.top_types ?? [];
  const topType = topTypes?.[0]?.[0] ?? "—";
  const lastUpdated = meta?.live_last_updated ?? "";

  const availableMonths: string[] = meta?.available_month_names ?? ["January2026"];

  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <NavBar />

      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>ArchAlert</h1>
        <div style={{ color: "#64748b", marginTop: 6 }}>
          AI‑Powered Urban Safety Awareness (St. Louis) • Calls for Service are unverified • Not predictive policing
        </div>
      </div>

      <KpiCards
        monthlyCellCount={monthlyCells.length}
        liveTotal={liveTotal}
        topType={topType}
        lastUpdated={lastUpdated}
      />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 380px", gap: 12, marginTop: 12 }}>
        <Filters
          since={since}
          setSince={setSince}
          showHistorical={showHistorical}
          setShowHistorical={setShowHistorical}
          showLive={showLive}
          setShowLive={setShowLive}
          onRefreshLive={loadAll}
          monthMode={monthMode}
          setMonthMode={setMonthMode}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          monthsBack={monthsBack}
          setMonthsBack={setMonthsBack}
          lastDays={lastDays}
          setLastDays={setLastDays}
          yearRangeUiOnly={yearRangeUiOnly}
          setYearRangeUiOnly={setYearRangeUiOnly}
          availableMonths={meta?.available_month_names ?? ["January2026"]}
        />
        <MapPanel
          monthlyCells={monthlyCells}
          showHistorical={showHistorical}
          mapKey={`${monthMode}-${selectedMonth}-${monthsBack}-${lastDays}`}
          />

        {showLive ? (
          <Insights liveTotal={liveTotal} topTypes={topTypes} lastUpdated={lastUpdated} />
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Insights</h3>
            <div style={{ color: "#64748b" }}>Turn on “Live Layer” to view insights.</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
        Loaded: {monthly?.loaded_file ? String(monthly.loaded_file) : "—"} • Stats rows:{" "}
        {monthlyStats?.total_rows ?? "—"}
      </div>
    </div>
  );
}