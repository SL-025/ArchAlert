"use client";

import React from "react";

export function Card(props: { title?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
      {(props.title || props.right) && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 800, color: "#0f172a" }}>{props.title}</div>
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
  variant?: "primary" | "secondary" | "ghost";
  active?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const variant = props.variant ?? "secondary";
  const active = Boolean(props.active);

  let bg = "#fff";
  let color = "#0f172a";
  let border = "1px solid #e5e7eb";

  if (variant === "primary") {
    bg = "#2563eb";
    color = "#fff";
    border = "1px solid #2563eb";
  } else if (active) {
    bg = "#0f172a";
    color = "#fff";
    border = "1px solid #0f172a";
  } else if (variant === "ghost") {
    bg = "transparent";
    color = "#0f172a";
    border = "1px solid transparent";
  }

  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border,
        background: bg,
        color,
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 800,
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
    <div
      title={props.title}
      style={{
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
        color: "#0f172a",
        maxWidth: 360,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
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
      <Button active={props.value === "1h"} onClick={() => props.onChange("1h")} style={{ minWidth: 70 }}>
        1h
      </Button>
      <Button active={props.value === "6h"} onClick={() => props.onChange("6h")} style={{ minWidth: 70 }}>
        6h
      </Button>
      <Button active={props.value === "24h"} onClick={() => props.onChange("24h")} style={{ minWidth: 70 }}>
        24h
      </Button>
      {props.right}
    </div>
  );
}