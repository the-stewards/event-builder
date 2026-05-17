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

const btnPrimary = {
  ...type.button,
  background: colors.orange,
  color: "#fff",
  border: "none",
  borderRadius: radius.md,
  padding: `${spacing.sm}px ${spacing.lg}px`,
  cursor: "pointer",
  fontSize: 14,
};

const btnSecondary = {
  ...type.button,
  background: "none",
  color: colors.charcoal,
  border: `1px solid ${colors.gray}`,
  borderRadius: radius.md,
  padding: `${spacing.sm}px ${spacing.md}px`,
  cursor: "pointer",
  fontSize: 13,
};

function PaidBadge({ paid }) {
  return (
    <span style={{
      ...type.label, fontSize: 11,
      border: `1px solid ${paid ? colors.success : colors.danger}`,
      color: paid ? colors.success : colors.danger,
      background: paid ? "rgba(74,124,89,0.1)" : "rgba(185,64,64,0.1)",
      padding: "2px 7px",
      borderRadius: 2,
      display: "inline-block",
    }}>
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: `${spacing.xxl}px ${spacing.lg}px`, color: colors.muted }}>
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

  const [form, setForm] = useState({ name: "", email: "", phone: "", status: "confirmed", paid: false, plusOne: false, source: "manual", notes: "" });

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
  const paid = attendees.filter((a) => a.paid);
  const capacity = activeEvent.capacity || 100;
  const fillPct = Math.min((confirmed.length / capacity) * 100, 100);
  const atCapacity = confirmed.length >= capacity;

  const sorted = [...attendees].sort((a, b) => {
    const order = { confirmed: 0, waitlist: 1, declined: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return new Date(a.addedAt) - new Date(b.addedAt);
  });

  const isLocked = ["closed"].includes(activeEvent.status);

  function resetForm() {
    setForm({ name: "", email: "", phone: "", status: "confirmed", paid: false, plusOne: false, source: "manual", notes: "" });
    setEditId(null);
  }

  function submit() {
    if (!form.name) return;
    const now = new Date().toISOString();
    let status = form.status;
    if (status === "confirmed" && atCapacity && !editId) status = "waitlist";

    if (editId) {
      updateEvent({ attendees: attendees.map((a) => a.id === editId ? { ...a, ...form, status } : a) });
    } else {
      const newAttendee = { ...form, status, id: uuidv4(), addedAt: now };
      updateEvent({ attendees: [...attendees, newAttendee] });
    }
    resetForm();
    if (!editId) setShowForm(true);
  }

  function startEdit(a) {
    setForm({ name: a.name, email: a.email || "", phone: a.phone || "", status: a.status, paid: a.paid, plusOne: a.plusOne, source: a.source || "manual", notes: a.notes || "" });
    setEditId(a.id);
    setShowForm(true);
    setShowFull(true);
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
        return { id: uuidv4(), name, email, phone: "", status: "confirmed", paid: false, plusOne: false, source: "stripe", notes: "", addedAt: new Date().toISOString() };
      })
      .filter(Boolean);
    updateEvent({ attendees: [...attendees, ...newAttendees] });
    setCsvText("");
    setShowCSVImport(false);
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: `${spacing.lg}px ${spacing.md}px`, paddingBottom: 100 }}>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginBottom: spacing.md }}>
        {[
          { label: "Confirmed", val: confirmed.length },
          { label: "Waitlist", val: waitlist.length },
          { label: "Declined", val: declined.length },
          { label: "Paid", val: paid.length },
          { label: "Seats", val: `${confirmed.length}/${capacity}` },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.md, padding: `${spacing.xs}px ${spacing.md}px` }}>
            <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>{s.label} </span>
            <span style={{ ...type.h3, fontSize: 18, color: colors.charcoal }}>{s.val}</span>
          </div>
        ))}
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
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Phone *</label>
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing.md, marginBottom: spacing.sm }}>
                    <div>
                      <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Source</label>
                      <select style={inputStyle} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                        <option value="manual">Manual</option>
                        <option value="stripe">Stripe</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 2 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: spacing.xs, cursor: "pointer" }}>
                        <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} />
                        <span style={{ ...type.label, fontSize: 12 }}>Paid</span>
                      </label>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 2 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: spacing.xs, cursor: "pointer" }}>
                        <input type="checkbox" checked={form.plusOne} onChange={(e) => setForm({ ...form, plusOne: e.target.checked })} />
                        <span style={{ ...type.label, fontSize: 12 }}>+1</span>
                      </label>
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
                  {editId && (
                    <button onClick={() => { resetForm(); }} style={btnSecondary}>Cancel</button>
                  )}
                  <button onClick={submit} style={btnPrimary}>
                    {editId ? "Save Changes" : "Add Attendee"}
                  </button>
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
            <textarea
              style={{ ...inputStyle, height: 160, resize: "vertical" }}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"Name,Email\nJohn Smith,john@example.com"}
            />
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end", marginTop: spacing.md }}>
              <button onClick={() => setShowCSVImport(false)} style={btnSecondary}>Cancel</button>
              <button onClick={importCSV} style={btnPrimary}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Attendee list */}
      {sorted.length === 0 ? <EmptyState /> : (
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.charcoal}` }}>
                {["Name", "Status", "Paid", "Source", "Added", ""].map((h) => (
                  <th key={h} style={{ ...type.label, fontSize: 11, textAlign: "left", padding: `${spacing.sm}px ${spacing.md}px`, color: colors.charcoal }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${colors.gray}` }}>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14, fontWeight: 400 }}>
                    {a.name}{a.plusOne ? " +1" : ""}
                    {a.notes && <div style={{ ...type.body, fontSize: 12, color: colors.muted }}>{a.notes}</div>}
                  </td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px` }}><StatusBadge status={a.status} /></td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px` }}><PaidBadge paid={a.paid} /></td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.label, fontSize: 11, color: colors.muted }}>{a.source}</td>
                  <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.label, fontSize: 11, color: colors.muted }}>{a.addedAt ? new Date(a.addedAt).toLocaleDateString() : "—"}</td>
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

      {/* Footer actions */}
      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.lg }}>
        <button onClick={() => { const csv = exportAttendeesCSV(attendees); downloadCSV(csv, `${activeEvent.name}-attendees.csv`); }} style={btnSecondary}>
          Export Attendee List CSV
        </button>
        <button onClick={() => exportDoorListPDF(attendees, activeEvent)} style={btnSecondary}>
          Export Door List PDF
        </button>
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
