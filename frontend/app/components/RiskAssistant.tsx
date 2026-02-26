"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";
import { apiUrl } from "../lib/api";

const sinceToHours = (s: "1h" | "6h" | "24h") => (s === "1h" ? 1 : s === "6h" ? 6 : 24);

export default function RiskAssistant(props: { since: "1h" | "6h" | "24h" }) {
  const router = useRouter();
  const hours = sinceToHours(props.since);

  const [q, setQ] = useState("In the north, where should I avoid right now?");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [tiles, setTiles] = useState<any[]>([]);
  const [err, setErr] = useState<string>("");

  const placeholder = useMemo(() => {
    return "Try: 'In the east where not to go?' or 'Downtown hotspots last 24 hours'";
  }, []);

  const ask = async () => {
    setLoading(true);
    setErr("");
    try {
      const url = apiUrl(`/ask-risk?q=${encodeURIComponent(q)}&since_hours=${hours}`);
      const res = await fetch(url, { cache: "no-store" }).then((r) => r.json());

      setAnswer(String(res?.answer ?? ""));
      setTiles(Array.isArray(res?.tiles) ? res.tiles : []);
    } catch {
      setErr("Failed to reach backend /ask-risk. Check backend URL env var and deployment.");
      setTiles([]);
    } finally {
      setLoading(false);
    }
  };

  const openRiskMap = () => {
    router.push(`/risk-map?q=${encodeURIComponent(q)}&since_hours=${hours}`);
  };

  const hasTiles = (tiles?.length ?? 0) > 0;

  return (
    <div className="surface2" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 950 }}>Ask the map</div>
        <div className="badge">
          Window: <b style={{ color: "rgba(255,255,255,0.92)" }}>{hours}h</b>
        </div>
      </div>

      <div style={{ height: 10 }} />

      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />

      <div style={{ height: 10 }} />

      <Button variant="primary" onClick={ask} disabled={loading} style={{ width: "100%" }}>
        {loading ? "Asking..." : "Ask"}
      </Button>

      <div style={{ height: 10 }} />

      <Button onClick={openRiskMap} disabled={!hasTiles} style={{ width: "100%" }}>
        Show Risk Map
      </Button>

      <div style={{ height: 12 }} />

      <div
        className="surface"
        style={{
          padding: 14,
          borderRadius: 16,
          border: "1px solid rgba(124,58,237,0.35)",
          background: "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(34,211,238,0.10))",
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900, marginBottom: 8 }}>
          AI Response (LLM narrative over deterministic tiles)
        </div>

        {err ? (
          <div style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.55 }}>{err}</div>
        ) : (
          <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.92)", lineHeight: 1.55 }}>
            {answer || "Ask a question to get an awareness summary based on current live activity tiles."}
          </div>
        )}
      </div>

      <div style={{ height: 12 }} />

      <div
        className="surface"
        style={{
          padding: 14,
          borderRadius: 16,
          border: "1px solid rgba(34,211,238,0.32)",
          background: "linear-gradient(135deg, rgba(34,211,238,0.16), rgba(52,211,153,0.08))",
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900, marginBottom: 8 }}>
          Highlighted zones
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {(tiles ?? []).slice(0, 5).map((t: any, i: number) => (
            <div
              key={i}
              className="surface2"
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{t?.top_type ?? "—"}</div>
              <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>{Number(t?.score ?? 0).toFixed(1)}</div>
            </div>
          ))}

          {!hasTiles && <div style={{ color: "rgba(255,255,255,0.70)" }}>Ask first to get zones.</div>}
        </div>
      </div>
    </div>
  );
}