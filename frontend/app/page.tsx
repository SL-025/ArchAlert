"use client";

import { useEffect, useState } from "react";
import KpiCards from "./components/KpiCards";
import Filters from "./components/Filters";
import MapPanel from "./components/MapPanel";
import Insights from "./components/Insights";
import NavBar from "./components/NavBar";


export default function Home() {
  const [meta, setMeta] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [liveSummary, setLiveSummary] = useState<any>(null);

  const [since, setSince] = useState<"1h" | "6h" | "24h">("6h");
  const [showHistorical, setShowHistorical] = useState(true);
  const [showLive, setShowLive] = useState(true);

  const loadAll = async () => {
    const m = await fetch("http://localhost:8000/meta").then((r) => r.json());
    const mh = await fetch("http://localhost:8000/monthly-heat").then((r) => r.json());
    const ls = await fetch("http://localhost:8000/live-summary").then((r) => r.json());

    setMeta(m);
    setMonthly(mh);
    setLiveSummary(ls);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const monthlyCells = monthly?.cells ?? [];
  const liveTotal = liveSummary?.total ?? 0;
  const topTypes = liveSummary?.top_types ?? [];
  const topType = topTypes?.[0]?.[0] ?? "—";
  const lastUpdated = meta?.live_last_updated ?? "";

  return (
    <div style={{ padding: 18, fontFamily: "sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>ArchAlert</h1>
        <div style={{ color: "#64748b", marginTop: 6 }}>
          AI‑Powered Urban Safety Awareness (St. Louis) • Calls for Service are unverified • Not predictive policing
        </div>
      </div>
      <NavBar />
      <KpiCards
        monthlyCellCount={monthlyCells.length}
        liveTotal={liveTotal}
        topType={topType}
        lastUpdated={lastUpdated}
      />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 360px", gap: 12, marginTop: 12 }}>
        <Filters
          since={since}
          setSince={setSince}
          showHistorical={showHistorical}
          setShowHistorical={setShowHistorical}
          showLive={showLive}
          setShowLive={setShowLive}
          onRefreshLive={loadAll}
        />
        
        <MapPanel monthlyCells={monthlyCells} showHistorical={showHistorical} />

        {showLive ? (
          <Insights liveTotal={liveTotal} topTypes={topTypes} lastUpdated={lastUpdated} />
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Insights</h3>
            <div style={{ color: "#64748b" }}>Turn on “Live Layer” to view insights.</div>
          </div>
        )}
      </div>
    </div>
  );
}