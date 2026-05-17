import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEventStore } from "../store/useEventStore";
import { saveEvent } from "../utils/api";
import { colors, type, spacing, radius } from "./brand/tokens";

const STEPS = ["Basics", "Budget", "Schedule"];

const inputStyle = {
  width: "100%",
  padding: `${spacing.sm}px ${spacing.md}px`,
  border: `1px solid ${colors.gray}`,
  borderRadius: radius.md,
  fontFamily: "'Frank Ruhl Libre', serif",
  fontWeight: 300,
  fontSize: 16,
  color: colors.charcoal,
  background: "#fff",
  outline: "none",
};

const labelStyle = { ...type.label, display: "block", marginBottom: spacing.xs };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: spacing.md }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function OnboardingWizard({ onClose }) {
  const addEvent = useEventStore((s) => s.addEvent);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [basics, setBasics] = useState({ name: "", date: "", venue: "", capacity: 100, ticketPrice: 0 });
  const [budget, setBudget] = useState({ venue: "", food: "", marketing: "" });
  const [schedule, setSchedule] = useState({ doorsOpen: "", eventEnd: "" });

  async function finish() {
    setSaving(true);
    const id = uuidv4();
    const now = new Date().toISOString();

    const budgetItems = [];
    if (budget.venue) budgetItems.push({ id: uuidv4(), category: "venue", label: "Venue", type: "expense", estimated: Number(budget.venue), actual: 0, paid: false, vendor: "", notes: "" });
    if (budget.food) budgetItems.push({ id: uuidv4(), category: "food", label: "Food & Catering", type: "expense", estimated: Number(budget.food), actual: 0, paid: false, vendor: "", notes: "" });
    if (budget.marketing) budgetItems.push({ id: uuidv4(), category: "marketing", label: "Marketing", type: "expense", estimated: Number(budget.marketing), actual: 0, paid: false, vendor: "", notes: "" });

    const runItems = [];
    if (schedule.doorsOpen) runItems.push({ id: uuidv4(), time: schedule.doorsOpen, duration: 0, item: "Doors Open", owner: "", notes: "", status: "pending" });
    if (schedule.eventEnd) runItems.push({ id: uuidv4(), time: schedule.eventEnd, duration: 0, item: "Event End", owner: "", notes: "", status: "pending" });

    const event = {
      id,
      name: basics.name,
      date: basics.date,
      venue: basics.venue,
      capacity: Number(basics.capacity) || 100,
      ticketPrice: Number(basics.ticketPrice) || 0,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      attendees: [],
      budgetItems,
      runItems,
      debrief: { attendedCount: null, rsvpCount: null, revenueActual: null, expenseActual: null, npsScore: null, wins: ["", "", ""], misses: ["", "", ""], nextTime: ["", "", ""], aiSummary: "", completedAt: null },
    };

    try {
      await saveEvent(event);
      addEvent(event);
      onClose();
    } catch {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(64,61,61,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: spacing.md,
    }}>
      <div style={{ background: colors.cream, borderRadius: radius.lg, width: "100%", maxWidth: 480, padding: spacing.xl, boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.xl }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i <= step ? colors.orange : colors.gray, transition: "background 0.2s" }} />
              <p style={{ ...type.label, fontSize: 10, marginTop: 4, color: i <= step ? colors.orange : colors.muted }}>{s}</p>
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 style={{ ...type.h2, marginBottom: spacing.lg }}>New Event</h2>
            <Field label="Event Name *">
              <input style={inputStyle} value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })} placeholder="The Steward Gathering — May 2026" />
            </Field>
            <Field label="Date *">
              <input style={inputStyle} type="date" value={basics.date} onChange={(e) => setBasics({ ...basics, date: e.target.value })} />
            </Field>
            <Field label="Venue">
              <input style={inputStyle} value={basics.venue} onChange={(e) => setBasics({ ...basics, venue: e.target.value })} placeholder="The Rambler, Columbus OH" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
              <Field label="Capacity">
                <input style={inputStyle} type="number" value={basics.capacity} onChange={(e) => setBasics({ ...basics, capacity: e.target.value })} />
              </Field>
              <Field label="Ticket Price ($)">
                <input style={inputStyle} type="number" value={basics.ticketPrice} onChange={(e) => setBasics({ ...basics, ticketPrice: e.target.value })} />
              </Field>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ ...type.h2, marginBottom: spacing.xs }}>First Budget Items</h2>
            <p style={{ ...type.body, fontSize: 14, color: colors.muted, marginBottom: spacing.lg }}>Estimated costs — fill in actuals later.</p>
            <Field label="Venue Cost ($)">
              <input style={inputStyle} type="number" value={budget.venue} onChange={(e) => setBudget({ ...budget, venue: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Food & Catering ($)">
              <input style={inputStyle} type="number" value={budget.food} onChange={(e) => setBudget({ ...budget, food: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Marketing ($)">
              <input style={inputStyle} type="number" value={budget.marketing} onChange={(e) => setBudget({ ...budget, marketing: e.target.value })} placeholder="0" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ ...type.h2, marginBottom: spacing.xs }}>Run of Show Anchor</h2>
            <p style={{ ...type.body, fontSize: 14, color: colors.muted, marginBottom: spacing.lg }}>Everything builds from these two times.</p>
            <Field label="Doors Open">
              <input style={inputStyle} type="time" value={schedule.doorsOpen} onChange={(e) => setSchedule({ ...schedule, doorsOpen: e.target.value })} />
            </Field>
            <Field label="Event End">
              <input style={inputStyle} type="time" value={schedule.eventEnd} onChange={(e) => setSchedule({ ...schedule, eventEnd: e.target.value })} />
            </Field>
          </>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xl }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", ...type.label, color: colors.muted }}>
            Cancel
          </button>
          <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} style={{ background: "none", border: `1px solid ${colors.gray}`, borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.md}px`, cursor: "pointer", ...type.button, fontSize: 14, color: colors.charcoal }}>
                Back
              </button>
            )}
            {step < 2 && (
              <>
                {step > 0 && (
                  <button onClick={() => step === 1 ? setStep(2) : finish()} style={{ background: "none", border: "none", cursor: "pointer", ...type.label, color: colors.muted }}>
                    Skip
                  </button>
                )}
                <button
                  onClick={() => {
                    if (step === 0 && !basics.name) return;
                    setStep(step + 1);
                  }}
                  style={{ background: colors.orange, border: "none", borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.lg}px`, cursor: "pointer", ...type.button, color: "#fff" }}
                >
                  Next
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <button onClick={finish} style={{ background: "none", border: "none", cursor: "pointer", ...type.label, color: colors.muted }}>
                  Skip
                </button>
                <button
                  onClick={finish}
                  disabled={saving}
                  style={{ background: colors.orange, border: "none", borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.lg}px`, cursor: "pointer", ...type.button, color: "#fff", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Creating…" : "Create Event"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
