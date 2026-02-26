"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import NavBar from "./components/NavBar";
import Filters from "./components/Filters";
import KpiCards from "./components/KpiCards";
import Insights from "./components/Insights";
import { apiUrl } from "./lib/api";

// ✅ Leaflet must never SSR
const MapPanel = dynamic(() => import("./components/MapPanel"), {
  ssr: false,
  loading: () => <div style={{ minHeight: 520 }} />,
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
  const [topTypes, setTopTypes] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // forces map remount when filters change (also helps Leaflet dev quirks)
  const mapKey = useMemo(() => {
    return `${monthMode}-${selectedMonth}-${monthsBack}-${lastDays}-${showHistorical}-${showLive}-${since}`;
  }, [monthMode, selectedMonth, monthsBack, lastDays, showHistorical, showLive, since]);

  const refreshLive = async () => {
    if (!showLive) return;

    try {
      // keep your endpoints (adjust only if your backend names differ)
      const meta = await fetch(apiUrl(`/meta?since=${since}`), { cache: "no-store" }).then((r) => r.json());
      const typesRes = await fetch(apiUrl(`/live-types?since=${since}`), { cache: "no-store" }).then((r) => r.json());

      setLiveTotal(Number(meta?.live_total ?? meta?.total ?? 0) || 0);
      setLastUpdated(String(meta?.last_updated ?? meta?.lastUpdated ?? ""));

      // Accept both formats: [[type,count],...] OR [{type,count},...]
      const raw = typesRes?.top_types ?? typesRes?.types ?? [];
      if (Array.isArray(raw) && raw.length && Array.isArray(raw[0])) {
        setTopTypes(raw);
      } else {
        setTopTypes((raw ?? []).map((x: any) => [String(x.type ?? x[0] ?? "—"), Number(x.count ?? x[1] ?? 0)]));
      }
    } catch {
      setLiveTotal(0);
      setTopTypes([]);
      setLastUpdated("");
    }
  };

  const refreshHistorical = async () => {
    if (!showHistorical) {
      setMonthlyCells([]);
      return;
    }

    try {
      const url =
        monthMode === "single"
          ? apiUrl(`/monthly-heat?month=${encodeURIComponent(selectedMonth)}`)
          : apiUrl(`/monthly-heat-multi?months_back=${monthsBack}&last_days=${lastDays}`);

      const res = await fetch(url, { cache: "no-store" }).then((r) => r.json());

      const cells = Array.isArray(res) ? res : Array.isArray(res?.cells) ? res.cells : [];
      setMonthlyCells(cells);

      if (Array.isArray(res?.available_months) && res.available_months.length) {
        setAvailableMonths(res.available_months.map((x: any) => String(x)));
      }
    } catch {
      setMonthlyCells([]);
    }
  };

  useEffect(() => {
    refreshLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [since, showLive]);

  useEffect(() => {
    refreshHistorical();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistorical, monthMode, selectedMonth, monthsBack, lastDays]);

  return (
    <div style={{ padding: 14 }}>
      <NavBar />

      {/* KPI row (full width) */}
      <KpiCards
        monthlyCellCount={Array.isArray(monthlyCells) ? monthlyCells.length : 0}
        liveTotal={liveTotal}
        topType={String(topTypes?.[0]?.[0] ?? "—")}
        lastUpdated={lastUpdated}
      />

      <div style={{ height: 14 }} />

      {/* ✅ EXACT UI: Filters | Map | Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr 420px", gap: 14, alignItems: "start" }}>
        {/* LEFT */}
        <div style={{ display: "grid", gap: 14 }}>
          <Filters
            since={since}
            setSince={setSince}
            showHistorical={showHistorical}
            setShowHistorical={setShowHistorical}
            showLive={showLive}
            setShowLive={setShowLive}
            onRefreshLive={refreshLive}
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
        </div>

        {/* CENTER */}
        <div style={{ display: "grid", gap: 14 }}>
          <MapPanel monthlyCells={monthlyCells} showHistorical={showHistorical} mapKey={mapKey} />
        </div>

        {/* RIGHT */}
        <div style={{ display: "grid", gap: 14 }}>
          <Insights liveTotal={liveTotal} topTypes={topTypes} lastUpdated={lastUpdated} since={since} />
        </div>
      </div>
    </div>
  );
}