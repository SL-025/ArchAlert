"use client";

import React from "react";
import { Button, Card, LiveWindowToggle } from "./ui";

export default function Filters(props: {
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
  return (
    <Card title="Filters" right={<Button variant="primary" onClick={props.onRefreshLive}>Refresh</Button>}>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Live time window</div>
      <LiveWindowToggle value={props.since} onChange={props.setSince} />

      <div style={{ height: 12 }} />

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Layers</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button active={props.showHistorical} onClick={() => props.setShowHistorical(!props.showHistorical)}>
          Historical {props.showHistorical ? "ON" : "OFF"}
        </Button>
        <Button active={props.showLive} onClick={() => props.setShowLive(!props.showLive)}>
          Live {props.showLive ? "ON" : "OFF"}
        </Button>
      </div>

      <div style={{ height: 14 }} />

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Historical window</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button active={props.monthMode === "single"} onClick={() => props.setMonthMode("single")}>
          Single month
        </Button>
        <Button active={props.monthMode === "multi"} onClick={() => props.setMonthMode("multi")}>
          Multi-month
        </Button>
      </div>

      <div style={{ height: 12 }} />

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Choose month</div>
      <select
        value={props.selectedMonth}
        onChange={(e) => props.setSelectedMonth(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
        disabled={props.monthMode !== "single"}
      >
        {(props.availableMonths ?? []).map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <div style={{ height: 12 }} />

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Months back</div>
      <input
        type="range"
        min={1}
        max={12}
        value={props.monthsBack}
        onChange={(e) => props.setMonthsBack(Number(e.target.value))}
        disabled={props.monthMode !== "multi"}
        style={{ width: "100%" }}
      />
      <div style={{ fontSize: 12, color: "#334155" }}>Last {props.monthsBack} months</div>

      <div style={{ height: 12 }} />

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Last days filter</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button active={props.lastDays === 0} onClick={() => props.setLastDays(0)}>
          All
        </Button>
        <Button active={props.lastDays === 2} onClick={() => props.setLastDays(2)}>
          2 days
        </Button>
        <Button active={props.lastDays === 5} onClick={() => props.setLastDays(5)}>
          5 days
        </Button>
      </div>

      <div style={{ height: 12 }} />

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Year range (UI only)</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button active={props.yearRangeUiOnly === 1} onClick={() => props.setYearRangeUiOnly(1)}>
          1 year
        </Button>
        <Button active={props.yearRangeUiOnly === 3} onClick={() => props.setYearRangeUiOnly(3)}>
          3 years
        </Button>
      </div>
    </Card>
  );
}