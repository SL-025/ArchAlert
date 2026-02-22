"use client";

import React from "react";

export function Card(props: { title?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="surface2" style={{ padding: 14 }}>
      {(props.title || props.right) && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950, color: "rgba(255,255,255,0.92)" }}>{props.title}</div>
          <div>{props.right}</div>
        </div>
      )}
      {props.children}
    </div>
  );
}

export function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  active?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const variant = props.variant ?? "secondary";
  const active = Boolean(props.active);

  let background = "rgba(255,255,255,0.05)";
  let border = "1px solid rgba(255,255,255,0.16)";
  let color = "rgba(255,255,255,0.88)";

  if (variant === "primary") {
    background = "linear-gradient(135deg, var(--primary), var(--primary2))";
    border = "1px solid rgba(255,255,255,0.20)";
    color = "#06101a";
  } else if (active) {
    background = "rgba(255,255,255,0.14)";
    border = "1px solid rgba(255,255,255,0.22)";
    color = "rgba(255,255,255,0.92)";
  }

  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border,
        background,
        color,
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 900,
        opacity: props.disabled ? 0.6 : 1,
        ...props.style,
      }}
    >
      {props.children}
    </button>
  );
}

export function Pill(props: { children: React.ReactNode; title?: string }) {
  return (
    <div className="badge" title={props.title}>
      {props.children}
    </div>
  );
}

export function LiveWindowToggle(props: {
  value: "1h" | "6h" | "24h";
  onChange: (v: "1h" | "6h" | "24h") => void;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <Button active={props.value === "1h"} onClick={() => props.onChange("1h")} style={{ minWidth: 72 }}>
        1h
      </Button>
      <Button active={props.value === "6h"} onClick={() => props.onChange("6h")} style={{ minWidth: 72 }}>
        6h
      </Button>
      <Button active={props.value === "24h"} onClick={() => props.onChange("24h")} style={{ minWidth: 72 }}>
        24h
      </Button>
      {props.right}
    </div>
  );
}