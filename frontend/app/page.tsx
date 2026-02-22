"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import NavBar from "./components/NavBar";
import Filters from "./components/Filters";
import Insights from "./components/Insights";
import KpiCards from "./components/KpiCards";
import RiskAssistant from "./components/RiskAssistant";
import { apiUrl } from "./lib/api";

// ✅ IMPORTANT: Leaflet/react-leaflet components must NOT be imported during SSR
const MapPanel = dynamic(() => import("./components/MapPanel"), {
  ssr: false,
  loading: () => (
    <div className="surface2" style={{ padding: 14, minHeight: 520, display: "grid", placeItems: "center" }}>
      Loading map…
    </div>
  ),
});

// If you still use HeatMap somewhere on dashboard, keep this too.
// (Safe even if you don’t render it currently.)
const HeatMap = dynamic(() => import("./components/HeatMap"), {
  ssr: false,
  loading: () => (
    <div className="surface2" style={{ padding: 14, minHeight: 520, display: "grid", placeItems: "center" }}>
      Loading heatmap…
    </div>
  ),
});

type AnyCell = Record<string, any>;

export default function DashboardPage() {
  const [since, setSince] = useState<"1h" | "6h" | "24h">("6h");

  const [showHistorical, setShowHistorical] = useState(true);
  const [showLive, setShowLive] = useState(true);

  const [monthMode, setMonthMode] = useState<"single" | "multi">("single");
  const [selectedMonth, setSelectedMonth] = useState("January2026");
  const [monthsBack, setMonthsBack] = useState(3);
  const [lastDays, setLastDays] = useState<0 | 2 | 5>(0);
  const [yearRangeUiOnly, setYearRangeUiOnly] = useState<1 | 3>(1);

  const [availableMonths, setAvailableMonths] = useState<string[]>([
    "September2025",
    "October2025",
    "November2025",
    "December2025",
    "January2026",
  ]);

  const [monthlyCells, setMonthlyCells] = useState<AnyCell[]>([]);
  const [liveTotal, setLiveTotal] = useState<number>(0);
  const [topType, setTopType] = useState<string>("—");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const [loadingHist, setLoadingHist] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);

  const mapKey = useMemo(() => {
    // forces MapPanel remount when filters change (handy during demos)
    return `${showHistorical ? "H1" : "H0"}-${monthMode}-${selectedMonth}-${monthsBack}-${lastDays}-${yearRangeUiOnly}`;
  }, [showHistorical, monthMode, selectedMonth, monthsBack, lastDays, yearRangeUiOnly]);

  const onRefreshLive = async () => {
    if (!showLive) return;
    setLoadingLive(true);
    try {
      // These endpoints must match your backend. Keep the same ones you already implemented.
      const meta = await fetch(apiUrl(`/live-meta?since=${since}`), { cache: "no-store" }).then((r) => r.json());

      setLiveTotal(Number(meta?.total ?? meta?.live_total ?? 0) || 0);
      setTopType(String(meta?.top_type ?? meta?.topType ?? "—"));
      setLastUpdated(String(meta?.last_updated ?? meta?.lastUpdated ?? ""));
    } catch {
      // Don’t crash UI if backend is down
      setLiveTotal(0);
      setTopType("—");
      setLastUpdated("");
    } finally {
      setLoadingLive(false);
    }
  };

  const onRefreshHistorical = async () => {
    if (!showHistorical) {
      setMonthlyCells([]);
      return;
    }

    setLoadingHist(true);
    try {
      // Use the same endpoint you already used for historical cells.
      // If your backend expects different params, keep your params but keep apiUrl().
      const url =
        monthMode === "single"
          ? apiUrl(`/monthly-heat?month=${encodeURIComponent(selectedMonth)}`)
          : apiUrl(`/monthly-heat-multi?months_back=${monthsBack}&last_days=${lastDays}`);

      const res = await fetch(url, { cache: "no-store" }).then((r) => r.json());

      // Accept both: { cells: [...] } or just [...]
      const cells = Array.isArray(res) ? res : Array.isArray(res?.cells) ? res.cells : [];
      setMonthlyCells(cells);

      // Optional: if backend returns available months
      if (Array.isArray(res?.available_months) && res.available_months.length) {
        setAvailableMonths(res.available_months.map((x: any) => String(x)));
      }
    } catch {
      setMonthlyCells([]);
    } finally {
      setLoadingHist(false);
    }
  };

  // initial load
  useEffect(() => {
    onRefreshLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [since, showLive]);

  useEffect(() => {
    onRefreshHistorical();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistorical, monthMode, selectedMonth, monthsBack, lastDays]);

  return (
    <div style={{ padding: 14 }}>
      <NavBar />

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 14 }}>
          <Filters
            since={since}
            setSince={setSince}
            showHistorical={showHistorical}
            setShowHistorical={setShowHistorical}
            showLive={showLive}
            setShowLive={setShowLive}
            onRefreshLive={onRefreshLive}
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

          <RiskAssistant since={since} />

          <Insights />
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <KpiCards
            monthlyCellCount={Array.isArray(monthlyCells) ? monthlyCells.length : 0}
            liveTotal={liveTotal}
            topType={topType}
            lastUpdated={lastUpdated}
          />

          {/* ✅ Leaflet is only loaded on client now */}
          <MapPanel monthlyCells={monthlyCells} showHistorical={showHistorical} mapKey={mapKey} />

          {/* If you also render HeatMap on dashboard, render it here (optional):
              <HeatMap cells={...} />
          */}

          {(loadingHist || loadingLive) && (
            <div className="muted2" style={{ fontSize: 12, paddingLeft: 6 }}>
              {loadingHist ? "Loading historical…" : null} {loadingLive ? "Loading live…" : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}