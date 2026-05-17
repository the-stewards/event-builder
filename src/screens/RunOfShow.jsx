import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing, radius } from "../components/brand/tokens";
import { exportRunOfShowPDF } from "../utils/exportPDF";

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

function timeToMin(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function DayOfMode({ items, updateEvent }) {
  const [now, setNow] = useState(nowTime());

  useEffect(() => {
    const interval = setInterval(() => setNow(nowTime()), 30000);
    return () => clearInterval(interval);
  }, []);

  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  const nowMin = timeToMin(now);

  const currentIdx = sorted.findIndex((item, i) => {
    const start = timeToMin(item.time);
    const end = start + (item.duration || 0);
    const next = sorted[i + 1];
    const nextStart = next ? timeToMin(next.time) : Infinity;
    return nowMin >= start && nowMin < (end > start ? end : nextStart);
  });

  const current = sorted[currentIdx >= 0 ? currentIdx : sorted.findIndex((i) => timeToMin(i.time) > nowMin) - 1];
  const next = currentIdx >= 0 ? sorted[currentIdx + 1] : sorted.find((i) => timeToMin(i.time) > nowMin);

  function markDone(id) {
    updateEvent({ runItems: items.map((r) => r.id === id ? { ...r, status: "done" } : r) });
  }

  const done = sorted.filter((r) => r.status === "done");
  const upcoming = sorted.filter((r) => r.status !== "done");

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: spacing.md, paddingBottom: 100 }}>
      {/* Current time */}
      <div style={{ textAlign: "center", marginBottom: spacing.xl }}>
        <p style={{ ...type.label, color: colors.muted, marginBottom: 4 }}>Current Time</p>
        <p style={{ ...type.h1, fontSize: 64, color: colors.charcoal }}>{formatTime(now)}</p>
      </div>

      {/* Current item */}
      {current && (
        <div style={{ background: colors.orange, borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg, textAlign: "center" }}>
          <p style={{ ...type.label, color: "rgba(255,255,255,0.8)", marginBottom: spacing.sm }}>Now</p>
          <p style={{ ...type.h2, color: "#fff", fontSize: 32, marginBottom: spacing.xs }}>{current.item}</p>
          {current.owner && <p style={{ ...type.label, color: "rgba(255,255,255,0.7)", marginBottom: spacing.lg }}>{current.owner}</p>}
          {current.status !== "done" && (
            <button
              onClick={() => markDone(current.id)}
              style={{ ...type.button, background: "#fff", color: colors.orange, border: "none", borderRadius: radius.md, padding: `${spacing.md}px ${spacing.xl}px`, cursor: "pointer", fontSize: 18 }}
            >
              ✓ Done
            </button>
          )}
        </div>
      )}

      {/* Next item */}
      {next && (
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg }}>
          <p style={{ ...type.label, color: colors.muted, marginBottom: spacing.xs }}>Up Next — {formatTime(next.time)}</p>
          <p style={{ ...type.h3, color: colors.charcoal }}>{next.item}</p>
          {next.owner && <p style={{ ...type.label, fontSize: 11, color: colors.muted }}>{next.owner}</p>}
        </div>
      )}

      {/* Upcoming list */}
      <div>
        {done.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: spacing.sm, padding: `${spacing.xs}px 0`, opacity: 0.4 }}>
            <span style={{ color: colors.success, fontSize: 16 }}>✓</span>
            <span style={{ ...type.label, fontSize: 12, color: colors.muted }}>{formatTime(r.time)} {r.item}</span>
          </div>
        ))}
        {upcoming.filter((r) => r !== current && r !== next).map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${spacing.sm}px 0`, borderBottom: `1px solid ${colors.gray}` }}>
            <div>
              <span style={{ ...type.label, fontSize: 12, color: colors.muted }}>{formatTime(r.time)} · {r.duration}m · </span>
              <span style={{ ...type.body, fontSize: 14 }}>{r.item}</span>
            </div>
            <button onClick={() => markDone(r.id)} style={{ ...btnSecondary, fontSize: 12, padding: "4px 12px" }}>Done</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: `${spacing.xxl}px ${spacing.lg}px` }}>
      <p style={{ ...type.h3, color: colors.gray, marginBottom: spacing.sm }}>No agenda items yet.</p>
      <p style={{ ...type.body, fontSize: 14, color: colors.muted }}>Start with "Doors Open" — everything else follows from there.</p>
    </div>
  );
}

export default function RunOfShow() {
  const { activeEvent, updateEvent } = useEventStore();
  const [mode, setMode] = useState("plan");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const emptyForm = { time: "", duration: 15, item: "", owner: "", notes: "" };
  const [form, setForm] = useState(emptyForm);

  if (!activeEvent) {
    return <div style={{ padding: spacing.xl, textAlign: "center" }}><p style={{ ...type.body, color: colors.muted }}>Select or create an event to get started.</p></div>;
  }

  const items = activeEvent.runItems || [];
  const isLocked = activeEvent.status === "closed";
  const isDayOf = activeEvent.status === "day-of";

  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  const totalDuration = items.reduce((s, r) => s + (r.duration || 0), 0);

  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const end = timeToMin(sorted[i].time) + (sorted[i].duration || 0);
    const next = timeToMin(sorted[i + 1].time);
    if (next - end > 15) gaps.push(i);
  }

  function resetForm() { setForm(emptyForm); setEditId(null); }

  function submit() {
    if (!form.item || !form.time) return;
    const item = { ...form, duration: Number(form.duration) || 0, status: "pending" };
    if (editId) {
      updateEvent({ runItems: items.map((r) => r.id === editId ? { ...r, ...item } : r) });
    } else {
      updateEvent({ runItems: [...items, { ...item, id: uuidv4() }] });
    }
    resetForm();
    setShowForm(false);
  }

  function startEdit(r) {
    setForm({ time: r.time, duration: r.duration, item: r.item, owner: r.owner || "", notes: r.notes || "" });
    setEditId(r.id);
    setShowForm(true);
  }

  function confirmDelete() {
    updateEvent({ runItems: items.filter((r) => r.id !== deleteId) });
    setDeleteId(null);
  }

  const activeMode = isDayOf ? "day-of" : mode;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: `${spacing.lg}px ${spacing.md}px`, paddingBottom: 100 }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing.lg }}>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${colors.gray}`, borderRadius: radius.md, overflow: "hidden" }}>
          {[{ val: "plan", label: "Plan" }, { val: "day-of", label: "Day-Of" }].map((m) => (
            <button
              key={m.val}
              onClick={() => setMode(m.val)}
              style={{
                ...type.button, fontSize: 13, border: "none", cursor: "pointer",
                padding: `${spacing.xs}px ${spacing.md}px`,
                background: activeMode === m.val ? colors.charcoal : "#fff",
                color: activeMode === m.val ? colors.cream : colors.muted,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {activeMode === "day-of" ? (
        <DayOfMode items={items} updateEvent={updateEvent} />
      ) : (
        <>
          {/* Overflow warning */}
          {totalDuration > 0 && activeEvent.runItems?.length > 1 && (() => {
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const span = timeToMin(last.time) + (last.duration || 0) - timeToMin(first.time);
            if (totalDuration > span + 30) {
              return (
                <div style={{ background: "#fdecea", border: `1px solid ${colors.danger}`, borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.md}px`, marginBottom: spacing.md }}>
                  <p style={{ ...type.body, fontSize: 13, color: colors.danger, margin: 0 }}>⚠ Total duration exceeds your event window.</p>
                </div>
              );
            }
          })()}

          {/* Add form */}
          {!isLocked && (
            <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, marginBottom: spacing.lg, overflow: "hidden" }}>
              <button
                onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
                style={{ ...type.button, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", padding: `${spacing.md}px ${spacing.lg}px`, color: colors.charcoal, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                {editId ? "Edit Agenda Item" : "+ Add Agenda Item"}
                <span style={{ color: colors.muted }}>{showForm ? "▲" : "▼"}</span>
              </button>
              {showForm && (
                <div style={{ padding: `0 ${spacing.lg}px ${spacing.lg}px` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing.md, marginBottom: spacing.sm }}>
                    <div>
                      <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Time *</label>
                      <input style={inputStyle} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Duration (min)</label>
                      <input style={inputStyle} type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Owner</label>
                      <input style={inputStyle} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Ryan" />
                    </div>
                  </div>
                  <div style={{ marginBottom: spacing.sm }}>
                    <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Agenda Item *</label>
                    <input style={inputStyle} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} placeholder="e.g. Welcome & Introductions" />
                  </div>
                  <div style={{ marginBottom: spacing.sm }}>
                    <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Notes</label>
                    <input style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" />
                  </div>
                  <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
                    {editId && <button onClick={resetForm} style={btnSecondary}>Cancel</button>}
                    <button onClick={submit} style={btnPrimary}>{editId ? "Save Changes" : "Add Item"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agenda list */}
          {sorted.length === 0 ? <EmptyState /> : (
            <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.lg }}>
              {sorted.map((r, i) => (
                <div key={r.id}>
                  {gaps.includes(i) && (
                    <div style={{ background: "#fffbe6", padding: `${spacing.xs}px ${spacing.lg}px`, borderBottom: `1px solid ${colors.gray}` }}>
                      <p style={{ ...type.label, fontSize: 11, color: colors.warning, margin: 0 }}>⚠ Gap over 15 minutes</p>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", padding: `${spacing.md}px ${spacing.lg}px`, borderBottom: `1px solid ${colors.gray}`, gap: spacing.md }}>
                    <div style={{ minWidth: 80 }}>
                      <p style={{ ...type.label, fontSize: 13, color: colors.charcoal, margin: 0 }}>{formatTime(r.time)}</p>
                      <p style={{ ...type.label, fontSize: 11, color: colors.muted, margin: 0 }}>{r.duration}m</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ ...type.body, fontSize: 15, fontWeight: 400, color: r.status === "done" ? colors.muted : colors.charcoal, textDecoration: r.status === "done" ? "line-through" : "none", margin: 0 }}>{r.item}</p>
                      {r.owner && <p style={{ ...type.label, fontSize: 11, color: colors.muted, margin: 0 }}>{r.owner}</p>}
                      {r.notes && <p style={{ ...type.body, fontSize: 13, color: colors.muted, margin: 0 }}>{r.notes}</p>}
                    </div>
                    <div style={{ display: "flex", gap: spacing.xs }}>
                      {!isLocked && (
                        <>
                          <button onClick={() => startEdit(r)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.charcoal, fontSize: 13 }}>Edit</button>
                          <button onClick={() => setDeleteId(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, fontSize: 13 }}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", gap: spacing.sm }}>
            <button onClick={() => exportRunOfShowPDF(items, activeEvent)} style={btnSecondary}>Export Run of Show PDF</button>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: spacing.md }}>
          <div style={{ background: colors.cream, borderRadius: radius.lg, padding: spacing.xl, maxWidth: 360, width: "100%" }}>
            <h3 style={{ ...type.h3, marginBottom: spacing.sm }}>Delete Agenda Item?</h3>
            <p style={{ ...type.body, fontSize: 14, marginBottom: spacing.lg }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteId(null)} style={btnSecondary}>Cancel</button>
              <button onClick={confirmDelete} style={{ ...btnPrimary, background: colors.danger }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
