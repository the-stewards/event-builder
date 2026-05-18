import { useState } from "react";
import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing, radius } from "../components/brand/tokens";
import { usd } from "../utils/formatCurrency";
import { exportDebriefPDF } from "../utils/exportPDF";

const inputStyle = {
  width: "100%",
  padding: `${spacing.sm}px ${spacing.md}px`,
  border: `1px solid ${colors.gray}`,
  borderRadius: radius.md,
  fontFamily: "'Frank Ruhl Libre', serif",
  fontWeight: 300,
  fontSize: 15,
  color: colors.charcoal,
  background: "#fff",
  outline: "none",
};

const btnPrimary = { ...type.button, background: colors.orange, color: "#fff", border: "none", borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.lg}px`, cursor: "pointer", fontSize: 14 };
const btnSecondary = { ...type.button, background: "none", color: colors.charcoal, border: `1px solid ${colors.gray}`, borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.md}px`, cursor: "pointer", fontSize: 13 };

async function generateDebriefSummary(debrief, event) {
  const response = await fetch("/.netlify/functions/generateDebrief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ debrief, event }),
  });
  if (!response.ok) throw new Error("AI call failed");
  const data = await response.json();
  return data.summary;
}

function ReadOnlyStat({ label, value }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.md}px` }}>
      <p style={{ ...type.label, fontSize: 11, color: colors.muted, margin: 0 }}>{label}</p>
      <p style={{ ...type.h3, fontSize: 20, color: colors.charcoal, margin: 0 }}>{value}</p>
    </div>
  );
}

export default function Debrief() {
  const { activeEvent, updateEvent, updateEventStatus } = useEventStore();
  const [confirmClose, setConfirmClose] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  if (!activeEvent) {
    return <div style={{ padding: spacing.xl, textAlign: "center" }}><p style={{ ...type.body, color: colors.muted }}>Select or create an event to get started.</p></div>;
  }

  const isClosed = activeEvent.status === "closed";
  const debrief = activeEvent.debrief || {};

  const attendees = activeEvent.attendees || [];
  const confirmed = attendees.filter((a) => a.status === "confirmed").length;
  const showedCount = attendees.filter((a) => a.showed).length;
  const convertedCount = attendees.filter((a) => a.converted).length;
  const revenueActual = (activeEvent.budgetItems || []).filter((b) => b.type === "income").reduce((s, b) => s + (b.actual || 0), 0);
  const expenseActual = (activeEvent.budgetItems || []).filter((b) => b.type === "expense").reduce((s, b) => s + (b.actual || 0), 0);
  const net = revenueActual - expenseActual;

  function updateDebrief(patch) {
    updateEvent({ debrief: { ...debrief, ...patch } });
  }

  async function handleGenerateSummary() {
    setGenerating(true);
    setAiError("");
    try {
      const d = {
        ...debrief,
        rsvpCount: confirmed,
        attendedCount: showedCount,
        convertedCount,
        revenueActual,
        expenseActual,
      };
      const summary = await generateDebriefSummary(d, activeEvent);
      updateDebrief({ aiSummary: summary });
    } catch (e) {
      setAiError("Failed to generate summary. Check your API key.");
    }
    setGenerating(false);
  }

  function markComplete() {
    updateDebrief({ completedAt: new Date().toISOString(), rsvpCount: confirmed, attendedCount: showedCount, convertedCount, revenueActual, expenseActual });
  }

  if (!isClosed) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: spacing.xl, textAlign: "center" }}>
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, padding: spacing.xl }}>
          <p style={{ ...type.sectionLabel, marginBottom: spacing.sm }}>Debrief</p>
          <h2 style={{ ...type.h2, marginBottom: spacing.md }}>Locked Until Event Closes</h2>
          <p style={{ ...type.body, fontSize: 14, color: colors.muted, marginBottom: spacing.xl }}>
            Debrief unlocks when the event is marked Closed. All planning fields will lock at that point.
          </p>
          <button onClick={() => setConfirmClose(true)} style={btnPrimary}>Mark Event Closed</button>
        </div>

        {confirmClose && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: spacing.md }}>
            <div style={{ background: colors.cream, borderRadius: radius.lg, padding: spacing.xl, maxWidth: 400, width: "100%", textAlign: "left" }}>
              <h3 style={{ ...type.h3, marginBottom: spacing.sm }}>Mark Event as Closed?</h3>
              <p style={{ ...type.body, fontSize: 14, marginBottom: spacing.xl }}>All planning fields will be locked. Only the debrief will remain editable. This cannot be undone.</p>
              <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
                <button onClick={() => setConfirmClose(false)} style={btnSecondary}>Cancel</button>
                <button onClick={() => { updateEventStatus("closed"); setConfirmClose(false); }} style={btnPrimary}>Close Event</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: `${spacing.lg}px ${spacing.md}px`, paddingBottom: 100 }}>
      <p style={{ ...type.sectionLabel, marginBottom: spacing.sm }}>Post-Event Debrief</p>
      <h1 style={{ ...type.h1, fontSize: "clamp(24px, 4vw, 40px)", marginBottom: spacing.xl }}>{activeEvent.name}</h1>

      {/* Auto-populated stats */}
      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginBottom: spacing.lg }}>
        <ReadOnlyStat label="Confirmed RSVPs" value={confirmed} />
        <ReadOnlyStat label="Showed Up" value={showedCount} />
        <ReadOnlyStat label="Converted" value={convertedCount} />
        <ReadOnlyStat label="Revenue Actual" value={usd(revenueActual)} />
        <ReadOnlyStat label="Expenses Actual" value={usd(expenseActual)} />
        <div style={{ background: "#fff", border: `1px solid ${net >= 0 ? colors.success : colors.danger}`, borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.md}px` }}>
          <p style={{ ...type.label, fontSize: 11, color: colors.muted, margin: 0 }}>Net P&L</p>
          <p style={{ ...type.h3, fontSize: 20, color: net >= 0 ? colors.success : colors.danger, margin: 0 }}>{net >= 0 ? "+" : ""}{usd(net)}</p>
        </div>
      </div>

      {/* Conversion rates */}
      {confirmed > 0 && (
        <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginBottom: spacing.xl }}>
          <ReadOnlyStat label="Show Rate" value={confirmed > 0 ? `${Math.round((showedCount / confirmed) * 100)}%` : "—"} />
          <ReadOnlyStat label="Conversion Rate" value={showedCount > 0 ? `${Math.round((convertedCount / showedCount) * 100)}%` : "—"} />
          <ReadOnlyStat label="Overall Conversion" value={confirmed > 0 ? `${Math.round((convertedCount / confirmed) * 100)}%` : "—"} />
        </div>
      )}

      {/* NPS */}
      <div style={{ marginBottom: spacing.xl }}>
        <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>NPS Score (1–10)</label>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
          <input
            type="range" min={1} max={10} step={1}
            value={debrief.npsScore ?? 5}
            onChange={(e) => updateDebrief({ npsScore: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ ...type.h3, fontSize: 24, minWidth: 32, textAlign: "center" }}>{debrief.npsScore ?? "—"}</span>
        </div>
      </div>

      {/* Wins / Misses / Next Time */}
      {[
        { key: "wins", label: "Wins" },
        { key: "misses", label: "Misses" },
        { key: "nextTime", label: "Do Differently Next Time" },
      ].map(({ key, label }) => (
        <div key={key} style={{ marginBottom: spacing.xl }}>
          <p style={{ ...type.sectionLabel, marginBottom: spacing.sm }}>{label}</p>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ marginBottom: spacing.sm }}>
              <input
                style={inputStyle}
                value={(debrief[key] || ["", "", ""])[i] || ""}
                onChange={(e) => {
                  const arr = [...(debrief[key] || ["", "", ""])];
                  arr[i] = e.target.value;
                  updateDebrief({ [key]: arr });
                }}
                placeholder={`${label.replace("Do Differently ", "")} ${i + 1}`}
              />
            </div>
          ))}
        </div>
      ))}

      {/* AI Summary */}
      <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.xl }}>
        <p style={{ ...type.sectionLabel, marginBottom: spacing.sm }}>AI Summary</p>
        <button
          onClick={handleGenerateSummary}
          disabled={generating}
          style={{ ...btnPrimary, opacity: generating ? 0.7 : 1, marginBottom: debrief.aiSummary ? spacing.lg : 0 }}
        >
          {generating ? "Generating…" : debrief.aiSummary ? "Regenerate Summary" : "Generate Debrief Summary"}
        </button>
        {aiError && <p style={{ ...type.body, fontSize: 13, color: colors.danger, marginTop: spacing.sm }}>{aiError}</p>}
        {debrief.aiSummary && (
          <div style={{ background: colors.cream, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.md }}>
            <p style={{ ...type.body, fontSize: 15, lineHeight: 1.8, margin: 0 }}>{debrief.aiSummary}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
        <button onClick={() => exportDebriefPDF(debrief, activeEvent)} style={btnSecondary}>Export Debrief PDF</button>
        {!debrief.completedAt && (
          <button onClick={markComplete} style={btnSecondary}>Mark Debrief Complete</button>
        )}
      </div>

      {debrief.completedAt && (
        <p style={{ ...type.label, fontSize: 11, color: colors.muted, marginTop: spacing.md }}>
          Completed {new Date(debrief.completedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
