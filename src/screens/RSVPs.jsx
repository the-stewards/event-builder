import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing, radius } from "../components/brand/tokens";
import StatusBadge from "../components/StatusBadge";
import { exportAttendeesCSV, downloadCSV } from "../utils/exportCSV";
import { exportDoorListPDF } from "../utils/exportPDF";

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

function ToggleBadge({ active, activeLabel, inactiveLabel, activeColor, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        ...type.label, fontSize: 11,
        border: `1px solid ${active ? activeColor : colors.gray}`,
        color: active ? activeColor : colors.muted,
        background: active ? `${activeColor}18` : "transparent",
        padding: "2px 8px", borderRadius: 2,
        cursor: disabled ? "default" : "pointer",
        display: "inline-block", whiteSpace: "nowrap",
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}

function StatCard({ label, val, sub, color }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.md, padding: `${spacing.xs}px ${spacing.md}px`, minWidth: 80 }}>
      <div style={{ ...type.label, fontSize: 11, color: colors.muted }}>{label}</div>
      <div style={{ ...type.h3, fontSize: 22, color: color || colors.charcoal, lineHeight: 1.2 }}>{val}</div>
      {sub && <div style={{ ...type.label, fontSize: 10, color: colors.muted }}>{sub}</div>}
    </div>
  );
}

function FunnelArrow() {
  return <div style={{ ...type.label, fontSize: 18, color: colors.gray, alignSelf: "center", paddingTop: 8 }}>›</div>;
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: `${spacing.xxl}px ${spacing.lg}px` }}>
      <p style={{ ...type.h3, color: colors.gray, marginBottom: spacing.sm }}>No attendees yet.</p>
      <p style={{ ...type.body, fontSize: 14, color: colors.muted }}>Add your first guest above, or paste from your Stripe export.</p>
    </div>
  );
}

export default function RSVPs() {
  const { activeEvent, updateEvent } = useEventStore();
  const [showForm, setShowForm] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvText, setCsvText] = useState("");

  const emptyForm = { name: "", email: "", phone: "", status: "confirmed", paid: false, plusOne: false, source: "manual", notes: "", showed: false, converted: false };
  const [form, setForm] = useState(emptyForm);

  if (!activeEvent) {
    return (
      <div style={{ padding: spacing.xl, textAlign: "center" }}>
        <p style={{ ...type.body, color: colors.muted }}>Select or create an event to get started.</p>
      </div>
    );
  }

  const attendees = activeEvent.attendees || [];
  const confirmed = attendees.filter((a) => a.status === "confirmed");
  const waitlist = attendees.filter((a) => a.status === "waitlist");
  const declined = attendees.filter((a) => a.status === "declined");
  const showed = attendees.filter((a) => a.showed);
  const converted = attendees.filter((a) => a.converted);
  const capacity = activeEvent.capacity || 100;
  const fillPct = Math.min((confirmed.length / capacity) * 100, 100);
  const atCapacity = confirmed.length >= capacity;

  const showRate = confirmed.length > 0 ? Math.round((showed.length / confirmed.length) * 100) : null;
  const conversionRate = showed.length > 0 ? Math.round((converted.length / showed.length) * 100) : null;

  const isClosed = activeEvent.status === "closed";
  const isLocked = isClosed;

  const sorted = [...attendees].sort((a, b) => {
    const order = { confirmed: 0, waitlist: 1, declined: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return new Date(a.addedAt) - new Date(b.addedAt);
  });

  function resetForm() { setForm(emptyForm); setEditId(null); }

  function submit() {
    if (!form.name) return;
    const now = new Date().toISOString();
    let status = form.status;
    if (status === "confirmed" && atCapacity && !editId) status = "waitlist";

    if (editId) {
      updateEvent({ attendees: attendees.map((a) => a.id === editId ? { ...a, ...form, status } : a) });
    } else {
      updateEvent({ attendees: [...attendees, { ...form, status, id: uuidv4(), addedAt: now }] });
    }
    resetForm();
    if (!editId) setShowForm(true);
  }

  function startEdit(a) {
    setForm({ name: a.name, email: a.email || "", phone: a.phone || "", status: a.status, paid: !!a.paid, plusOne: !!a.plusOne, source: a.source || "manual", notes: a.notes || "", showed: !!a.showed, converted: !!a.converted });
    setEditId(a.id);
    setShowForm(true);
    setShowFull(true);
  }

  function toggleField(id, field) {
    updateEvent({ attendees: attendees.map((a) => a.id === id ? { ...a, [field]: !a[field] } : a) });
  }

  function confirmDelete() {
    updateEvent({ attendees: attendees.filter((a) => a.id !== deleteId) });
    setDeleteId(null);
  }

  function importCSV() {
    const lines = csvText.trim().split("\n").slice(1);
    const newAttendees = lines
      .map((line) => {
        const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        const name = cols[0];
        const email = cols[1] || "";
        if (!name) return null;
        return { id: uuidv4(), name, email, phone: "", status: "confirmed", paid: false, plusOne: false, source: "stripe", notes: "", showed: false, converted: false, addedAt: new Date().toISOString() };
      })
      .filter(Boolean);
    updateEvent({ attendees: [...attendees, ...newAttendees] });
    setCsvText("");
    setShowCSVImport(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: `${spacing.lg}px ${spacing.md}px`, paddingBottom: 100 }}>

      {/* Conversion funnel */}
      <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap", marginBottom: spacing.md, alignItems: "flex-start" }}>
        <StatCard label="Confirmed" val={confirmed.length} sub={`${capacity - confirmed.length} seats left`} />
        <FunnelArrow />
        <StatCard label="Showed Up" val={showed.length} sub={showRate !== null ? `${showRate}% show rate` : "mark below"} color={showed.length > 0 ? colors.charcoal : colors.muted} />
        <FunnelArrow />
        <StatCard label="Converted" val={converted.length} sub={conversionRate !== null ? `${conversionRate}% of showed` : "mark below"} color={converted.length > 0 ? colors.success : colors.muted} />
        <div style={{ flex: 1 }} />
        <StatCard label="Waitlist" val={waitlist.length} />
        <StatCard label="Declined" val={declined.length} />
        <StatCard label="Seats" val={`${confirmed.length}/${capacity}`} />
      </div>

      {/* Capacity bar */}
      <div style={{ background: colors.gray, borderRadius: radius.sm, height: 6, marginBottom: spacing.md, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${fillPct}%`, background: colors.orange, borderRadius: radius.sm, transition: "width 0.3s" }} />
      </div>

      {atCapacity && (
        <div style={{ background: "#fff3e0", border: `1px solid ${colors.warning}`, borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.md}px`, marginBottom: spacing.md }}>
          <p style={{ ...type.body, fontSize: 13, color: colors.warning, margin: 0 }}>
            Venue is at capacity — new confirmed attendees will be added to the waitlist automatically.
          </p>
        </div>
      )}

      {/* Add form */}
      {!isLocked && (
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, marginBottom: spacing.lg, overflow: "hidden" }}>
          <button
            onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
            style={{ ...type.button, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", padding: `${spacing.md}px ${spacing.lg}px`, color: colors.charcoal, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            {editId ? "Edit Attendee" : "+ Add Attendee"}
            <span style={{ color: colors.muted }}>{showForm ? "▲" : "▼"}</span>
          </button>

          {showForm && (
            <div style={{ padding: `0 ${spacing.lg}px ${spacing.lg}px` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md, marginBottom: spacing.sm }}>
                <div>
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Name *</label>
                  <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Phone</label>
                  <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="614-555-0100" />
                </div>
              </div>

              {showFull && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md, marginBottom: spacing.sm }}>
                    <div>
                      <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Email</label>
                      <input style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div>
                      <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Status</label>
                      <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option value="confirmed">Confirmed</option>
                        <option value="waitlist">Waitlist</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: spacing.lg, flexWrap: "wrap", marginBottom: spacing.sm }}>
                    {[
                      { field: "paid", label: "Paid" },
                      { field: "plusOne", label: "+1" },
                      { field: "showed", label: "Showed Up" },
                      { field: "converted", label: "Converted" },
                    ].map(({ field, label }) => (
                      <label key={field} style={{ display: "flex", alignItems: "center", gap: spacing.xs, cursor: "pointer" }}>
                        <input type="checkbox" checked={!!form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.checked })} />
                        <span style={{ ...type.label, fontSize: 12 }}>{label}</span>
                      </label>
                    ))}
                    <div style={{ flex: 1 }}>
                      <select style={{ ...inputStyle, width: "auto" }} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                        <option value="manual">Manual</option>
                        <option value="stripe">Stripe</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: spacing.sm }}>
                    <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Notes</label>
                    <input style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: spacing.sm, alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm }}>
                <button onClick={() => setShowFull(!showFull)} style={{ background: "none", border: "none", cursor: "pointer", ...type.label, color: colors.muted, fontSize: 11 }}>
                  {showFull ? "Less fields" : "More fields"}
                </button>
                <div style={{ display: "flex", gap: spacing.sm }}>
                  {editId && <button onClick={resetForm} style={btnSecondary}>Cancel</button>}
                  <button onClick={submit} style={btnPrimary}>{editId ? "Save Changes" : "Add Attendee"}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stripe helper */}
      {!isLocked && (
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.md, padding: `${spacing.md}px ${spacing.lg}px`, marginBottom: spacing.lg }}>
          <p style={{ ...type.body, fontSize: 13, color: colors.muted, margin: 0 }}>
            Importing from Stripe? Export your payment list as CSV, then use the{" "}
            <button onClick={() => setShowCSVImport(true)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.orange, ...type.button, fontSize: 13, padding: 0, textDecoration: "underline" }}>
              Import CSV
            </button>{" "}
            button to paste names and emails directly.
          </p>
        </div>
      )}

      {/* CSV Import modal */}
      {showCSVImport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: spacing.md }}>
          <div style={{ background: colors.cream, borderRadius: radius.lg, padding: spacing.xl, width: "100%", maxWidth: 480 }}>
            <h3 style={{ ...type.h3, marginBottom: spacing.sm }}>Import from CSV</h3>
            <p style={{ ...type.body, fontSize: 13, color: colors.muted, marginBottom: spacing.md }}>Paste your CSV with Name in column 1 and Email in column 2. First row is skipped (header).</p>
            <textarea style={{ ...inputStyle, height: 160, resize: "vertical" }} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={"Name,Email\nJohn Smith,john@example.com"} />
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end", marginTop: spacing.md }}>
              <button onClick={() => setShowCSVImport(false)} style={btnSecondary}>Cancel</button>
              <button onClick={importCSV} style={btnPrimary}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Attendee list */}
      {sorted.length === 0 ? <EmptyState /> : (
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, overflow: "hidden", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.charcoal}` }}>
                {["Name", "Status", "Showed", "Converted", "Paid", "Added", ""].map((h) => (
                  <th key={h} style={{ ...type.label, fontSize: 11, textAlign: "left", padding: `${spacing.sm}px ${spacing.md}px`, color: colors.charcoal, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${colors.gray}` }}>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14, fontWeight: 400, minWidth: 140 }}>
                    {a.name}{a.plusOne ? " +1" : ""}
                    {a.notes && <div style={{ fontSize: 12, color: colors.muted }}>{a.notes}</div>}
                  </td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px` }}><StatusBadge status={a.status} /></td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px` }}>
                    <ToggleBadge active={!!a.showed} activeLabel="✓ Showed" inactiveLabel="No show" activeColor={colors.charcoal} onClick={() => toggleField(a.id, "showed")} disabled={isLocked} />
                  </td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px` }}>
                    <ToggleBadge active={!!a.converted} activeLabel="✓ Converted" inactiveLabel="Not yet" activeColor={colors.success} onClick={() => toggleField(a.id, "converted")} disabled={isLocked} />
                  </td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px` }}>
                    <ToggleBadge active={!!a.paid} activeLabel="✓ Paid" inactiveLabel="Unpaid" activeColor={colors.success} onClick={() => toggleField(a.id, "paid")} disabled={isLocked} />
                  </td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.label, fontSize: 11, color: colors.muted, whiteSpace: "nowrap" }}>{a.addedAt ? new Date(a.addedAt).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, whiteSpace: "nowrap" }}>
                    {!isLocked && (
                      <>
                        <button onClick={() => startEdit(a)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.charcoal, fontSize: 13, padding: "0 6px" }}>Edit</button>
                        <button onClick={() => setDeleteId(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, fontSize: 13, padding: "0 6px" }}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.lg }}>
        <button onClick={() => downloadCSV(exportAttendeesCSV(attendees), `${activeEvent.name}-attendees.csv`)} style={btnSecondary}>Export Attendee List CSV</button>
        <button onClick={() => exportDoorListPDF(attendees, activeEvent)} style={btnSecondary}>Export Door List PDF</button>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: spacing.md }}>
          <div style={{ background: colors.cream, borderRadius: radius.lg, padding: spacing.xl, maxWidth: 360, width: "100%" }}>
            <h3 style={{ ...type.h3, marginBottom: spacing.sm }}>Remove Attendee?</h3>
            <p style={{ ...type.body, fontSize: 14, marginBottom: spacing.lg }}>This will permanently remove them from the event.</p>
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteId(null)} style={btnSecondary}>Cancel</button>
              <button onClick={confirmDelete} style={{ ...btnPrimary, background: colors.danger }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
