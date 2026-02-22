"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

function fmtMaybeDate(s: string) {
  if (!s) return "—";
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toLocaleString();
  return String(s);
}

const sinceToHours = (s: "1h" | "6h" | "24h") => (s === "1h" ? 1 : s === "6h" ? 6 : 24);

export default function Insights(props: {
  liveTotal: number;
  topTypes: any[];
  lastUpdated: string;
  since: "1h" | "6h" | "24h";
}) {
  const router = useRouter();
  const hours = sinceToHours(props.since);

  const top = Array.isArray(props.topTypes) ? props.topTypes.slice(0, 8) : [];

  const [q, setQ] = useState("In the south, where should I avoid right now?");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [tiles, setTiles] = useState<any[]>([]);
  const [err, setErr] = useState<string>("");
  const [askedOnce, setAskedOnce] = useState(false);

  const placeholder = useMemo(() => {
    return "Try: 'In the east where not to go?' or 'Downtown hotspots last 24 hours'";
  }, []);

  const ask = async () => {
    setLoading(true);
    setErr("");
    setAskedOnce(true);
    try {
      const url = `http://localhost:8000/ask-risk?q=${encodeURIComponent(q)}&since_hours=${hours}`;
      const res = await fetch(url, { cache: "no-store" }).then((r) => r.json());

      setAnswer(String(res?.answer ?? ""));
      setTiles(Array.isArray(res?.tiles) ? res.tiles : []);
    } catch {
      setErr("Failed to reach backend /ask-risk. Confirm backend is running on localhost:8000.");
      setTiles([]);
    } finally {
      setLoading(false);
    }
  };

  const openRiskMap = () => {
    // Always allow opening; the risk-map page will show “no tiles” if none exist.
    router.push(`/risk-map?q=${encodeURIComponent(q)}&since_hours=${hours}`);
  };

  return (
    <div className="surface2" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 950 }}>Insights</div>
        <div className="badge">
          Live updated: <b style={{ color: "rgba(255,255,255,0.92)" }}>{fmtMaybeDate(props.lastUpdated)}</b>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div style={{ display: "grid", gap: 12 }}>
        {/* AI Summary (no LLM badge) */}
        <div
          className="surface"
          style={{
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(124,58,237,0.35)",
            background: "linear-gradient(135deg, rgba(124,58,237,0.20), rgba(34,211,238,0.10))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>AI Summary</div>
            <div className="badge">
              Window: <b style={{ color: "rgba(255,255,255,0.92)" }}>{hours}h</b>
            </div>
          </div>

          <div style={{ height: 10 }} />

          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />

          <div style={{ height: 10 }} />

          <div style={{ display: "grid", gap: 10 }}>
            <Button variant="primary" onClick={ask} disabled={loading} style={{ width: "100%" }}>
              {loading ? "Asking..." : "Ask"}
            </Button>

            <Button onClick={openRiskMap} disabled={!askedOnce} style={{ width: "100%" }}>
              Show Risk Map
            </Button>
          </div>

          <div style={{ height: 12 }} />

          {err ? (
            <div style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.55 }}>{err}</div>
          ) : (
            <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.92)", lineHeight: 1.55 }}>
              {answer || "Ask a question to get a narrative built from live activity tiles."}
            </div>
          )}

          {askedOnce && (tiles?.length ?? 0) === 0 ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              No tiles returned for this region/window. Try city-wide or 24h.
            </div>
          ) : null}
        </div>

        {/* Top Live Types */}
        <div
          className="surface"
          style={{
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(34,211,238,0.32)",
            background: "linear-gradient(135deg, rgba(34,211,238,0.16), rgba(52,211,153,0.08))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>Top Live Types</div>
            <div className="badge">
              Total: <b style={{ color: "rgba(255,255,255,0.92)" }}>{props.liveTotal ?? 0}</b>
            </div>
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "grid", gap: 8 }}>
            {top.map((t: any, i: number) => (
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
                <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{String(t?.[0] ?? "—")}</div>
                <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 900 }}>{Number(t?.[1] ?? 0)}</div>
              </div>
            ))}

            {top.length === 0 && <div style={{ color: "rgba(255,255,255,0.70)" }}>No live type data for this window.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}