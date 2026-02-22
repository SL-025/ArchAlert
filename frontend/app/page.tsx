"use client";

import { useEffect, useState } from "react";
import NavBar from "./components/NavBar";
import KpiCards from "./components/KpiCards";
import Filters from "./components/Filters";
import MapPanel from "./components/MapPanel";
import Insights from "./components/Insights";
import { useLiveWindow } from "./lib/useLiveWindow";

export default function Home() {
  const [meta, setMeta] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [liveSummary, setLiveSummary] = useState<any>(null);

  const [loadingAll, setLoadingAll] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const { since, setSince } = useLiveWindow("6h");
  const sinceToHours = (s: "1h" | "6h" | "24h") => (s === "1h" ? 1 : s === "6h" ? 6 : 24);

  const [showHistorical, setShowHistorical] = useState(true);
  const [showLive, setShowLive] = useState(true);

  const [monthMode, setMonthMode] = useState<"single" | "multi">("single");
  const [selectedMonth, setSelectedMonth] = useState("January2026");
  const [monthsBack, setMonthsBack] = useState(5);
  const [lastDays, setLastDays] = useState<0 | 2 | 5>(0);
  const [yearRangeUiOnly, setYearRangeUiOnly] = useState<1 | 3>(1);

  const loadAll = async () => {
    setLoadingAll(true);
    try {
      const m = await fetch("http://localhost:8000/meta", { cache: "no-store" }).then((r) => r.json());

      const daysParam = lastDays ? `&last_days=${lastDays}` : "";
      const heatUrl =
        monthMode === "single"
          ? `http://localhost:8000/monthly-heat?month=${encodeURIComponent(selectedMonth)}${daysParam}`
          : `http://localhost:8000/historical-heat?months=${monthsBack}${daysParam}`;

      const statsUrl = `http://localhost:8000/monthly-stats?month=${encodeURIComponent(selectedMonth)}${daysParam}`;
      const hours = sinceToHours(since);

      const mh = await fetch(heatUrl, { cache: "no-store" }).then((r) => r.json());
      const st = await fetch(statsUrl, { cache: "no-store" }).then((r) => r.json());
      const ls = await fetch(`http://localhost:8000/live-summary?since_hours=${hours}`, { cache: "no-store" }).then((r) =>
        r.json()
      );

      setMeta(m);
      setMonthly(mh);
      setMonthlyStats(st);
      setLiveSummary(ls);
      setLastRefresh(new Date().toLocaleString());
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthMode, selectedMonth, monthsBack, lastDays, since]);

  useEffect(() => {
    const id = setInterval(() => loadAll(), 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthMode, selectedMonth, monthsBack, lastDays, since]);

  const monthlyCells = monthly?.cells ?? [];
  const liveTotal = liveSummary?.total ?? 0;
  const topTypes = liveSummary?.top_types ?? [];
  const topType = topTypes?.[0]?.[0] ?? "—";
  const lastUpdated = meta?.live_last_updated ?? "";
  const availableMonths: string[] = meta?.available_month_names ?? ["January2026"];

  return (
    <div>
      <NavBar />

      <div className="surface" style={{ padding: 18, marginBottom: 12 }}>
        <div style={{ textAlign: "center" }}>
          <h1 className="heroTitle">ArchAlert</h1>
          <div className="heroSub">
            AI‑Powered Urban Safety Awareness • Calls for Service are unverified • Not predictive policing
          </div>
        </div>

        <div className="hr" />

        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="badge" title="Auto refresh interval is 60 seconds">
            <span className="dot" />
            <span>
              {loadingAll ? "Refreshing..." : "Ready"} • Last refresh:{" "}
              <b style={{ color: "rgba(255,255,255,0.92)" }}>{lastRefresh || "—"}</b>
            </span>
          </div>

          <div className="badge" title="Backend live data timestamp">
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--primary2)", display: "inline-block" }} />
            <span>
              Live updated: <b style={{ color: "rgba(255,255,255,0.92)" }}>{lastUpdated ? String(lastUpdated) : "—"}</b>
            </span>
          </div>
        </div>
      </div>

      <KpiCards monthlyCellCount={monthlyCells.length} liveTotal={liveTotal} topType={topType} lastUpdated={lastUpdated} />

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
          availableMonths={availableMonths}
        />

        <MapPanel
          monthlyCells={monthlyCells}
          showHistorical={showHistorical}
          mapKey={`${monthMode}-${selectedMonth}-${monthsBack}-${lastDays}-${showHistorical}`}
        />

        {showLive ? (
          <Insights liveTotal={liveTotal} topTypes={topTypes} lastUpdated={lastUpdated} />
        ) : (
          <div className="surface2" style={{ padding: 14 }}>
            <div style={{ fontWeight: 950, marginBottom: 8 }}>Insights</div>
            <div className="muted">Turn on “Live Layer” to view insights.</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 12 }} className="muted2">
        Loaded: {monthly?.loaded_file ? String(monthly.loaded_file) : "—"} • Stats rows: {monthlyStats?.total_rows ?? "—"}
      </div>
    </div>
  );
}