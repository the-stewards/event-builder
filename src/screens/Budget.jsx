import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing, radius } from "../components/brand/tokens";
import { usd } from "../utils/formatCurrency";
import { exportBudgetCSV, downloadCSV } from "../utils/exportCSV";
import { exportPLSummaryPDF } from "../utils/exportPDF";

const CATEGORIES = ["venue", "food", "marketing", "speaker", "AV", "other"];

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

function varianceColor(variance) {
  if (variance > 0 && variance / Math.abs(variance + 1) > 0.1) return colors.danger;
  if (variance > 0) return colors.warning;
  return colors.success;
}

function EmptyState({ tab }) {
  return (
    <div style={{ textAlign: "center", padding: `${spacing.xxl}px ${spacing.lg}px`, color: colors.muted }}>
      <p style={{ ...type.h3, color: colors.gray, marginBottom: spacing.sm }}>No {tab} items yet.</p>
      <p style={{ ...type.body, fontSize: 14, color: colors.muted }}>Start with your biggest cost — usually venue or food.</p>
    </div>
  );
}

export default function Budget() {
  const { activeEvent, updateEvent } = useEventStore();
  const [tab, setTab] = useState("expense");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const emptyForm = { category: "venue", label: "", type: tab, estimated: "", actual: "", paid: false, vendor: "", notes: "" };
  const [form, setForm] = useState(emptyForm);

  if (!activeEvent) {
    return <div style={{ padding: spacing.xl, textAlign: "center" }}><p style={{ ...type.body, color: colors.muted }}>Select or create an event to get started.</p></div>;
  }

  const items = activeEvent.budgetItems || [];
  const isLocked = activeEvent.status === "closed";

  const income = items.filter((b) => b.type === "income");
  const expenses = items.filter((b) => b.type === "expense");
  const incomeEst = income.reduce((s, b) => s + (b.estimated || 0), 0);
  const incomeAct = income.reduce((s, b) => s + (b.actual || 0), 0);
  const expEst = expenses.reduce((s, b) => s + (b.estimated || 0), 0);
  const expAct = expenses.reduce((s, b) => s + (b.actual || 0), 0);
  const net = incomeAct - expAct;

  const tabItems = tab === "income" ? income : expenses;

  function resetForm() {
    setForm({ ...emptyForm, type: tab });
    setEditId(null);
  }

  function submit() {
    if (!form.label) return;
    const item = {
      ...form,
      type: tab,
      estimated: Number(form.estimated) || 0,
      actual: Number(form.actual) || 0,
    };
    if (editId) {
      updateEvent({ budgetItems: items.map((b) => b.id === editId ? { ...b, ...item } : b) });
    } else {
      updateEvent({ budgetItems: [...items, { ...item, id: uuidv4() }] });
    }
    resetForm();
    setShowForm(false);
  }

  function startEdit(b) {
    setForm({ category: b.category, label: b.label, type: b.type, estimated: b.estimated, actual: b.actual, paid: b.paid, vendor: b.vendor || "", notes: b.notes || "" });
    setEditId(b.id);
    setTab(b.type);
    setShowForm(true);
  }

  function confirmDelete() {
    updateEvent({ budgetItems: items.filter((b) => b.id !== deleteId) });
    setDeleteId(null);
  }

  const categoryTotals = CATEGORIES.map((cat) => {
    const catItems = items.filter((b) => b.category === cat);
    return {
      cat,
      est: catItems.reduce((s, b) => s + (b.estimated || 0), 0),
      act: catItems.reduce((s, b) => s + (b.actual || 0), 0),
    };
  }).filter((c) => c.est > 0 || c.act > 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: `${spacing.lg}px ${spacing.md}px`, paddingBottom: 100 }}>
      {/* P&L Summary */}
      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap", marginBottom: spacing.lg }}>
        {[
          { label: "Income Est", val: usd(incomeEst) },
          { label: "Income Actual", val: usd(incomeAct) },
          { label: "Expenses Est", val: usd(expEst) },
          { label: "Expenses Actual", val: usd(expAct) },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.md, padding: `${spacing.xs}px ${spacing.md}px` }}>
            <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>{s.label} </span>
            <span style={{ ...type.h3, fontSize: 18, color: colors.charcoal }}>{s.val}</span>
          </div>
        ))}
        <div style={{ background: "#fff", border: `1px solid ${net >= 0 ? colors.success : colors.danger}`, borderRadius: radius.md, padding: `${spacing.xs}px ${spacing.md}px` }}>
          <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>Net </span>
          <span style={{ ...type.h3, fontSize: 18, color: net >= 0 ? colors.success : colors.danger }}>{net >= 0 ? "+" : ""}{usd(net)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: spacing.lg, borderBottom: `2px solid ${colors.gray}` }}>
        {["income", "expense"].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); resetForm(); setShowForm(false); }}
            style={{
              ...type.button, fontSize: 14, border: "none", background: "none", cursor: "pointer",
              padding: `${spacing.sm}px ${spacing.lg}px`,
              color: tab === t ? colors.orange : colors.muted,
              borderBottom: tab === t ? `2px solid ${colors.orange}` : "2px solid transparent",
              marginBottom: -2,
            }}
          >
            {t === "income" ? "Income" : "Expenses"}
          </button>
        ))}
      </div>

      {/* Add form */}
      {!isLocked && (
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, marginBottom: spacing.lg, overflow: "hidden" }}>
          <button
            onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
            style={{ ...type.button, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", padding: `${spacing.md}px ${spacing.lg}px`, color: colors.charcoal, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            {editId ? "Edit Line Item" : `+ Add ${tab === "income" ? "Income" : "Expense"}`}
            <span style={{ color: colors.muted }}>{showForm ? "▲" : "▼"}</span>
          </button>
          {showForm && (
            <div style={{ padding: `0 ${spacing.lg}px ${spacing.lg}px` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md, marginBottom: spacing.sm }}>
                <div>
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Label *</label>
                  <input style={inputStyle} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Venue Deposit" />
                </div>
                <div>
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Category</label>
                  <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: spacing.md, marginBottom: spacing.sm }}>
                <div>
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Estimated ($)</label>
                  <input style={inputStyle} type="number" value={form.estimated} onChange={(e) => setForm({ ...form, estimated: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Actual ($)</label>
                  <input style={inputStyle} type="number" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Vendor</label>
                  <input style={inputStyle} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Vendor name" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: spacing.md, alignItems: "end", marginBottom: spacing.sm }}>
                <div>
                  <label style={{ ...type.label, display: "block", marginBottom: spacing.xs }}>Notes</label>
                  <input style={inputStyle} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes…" />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: spacing.xs, cursor: "pointer", paddingBottom: 10 }}>
                  <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} />
                  <span style={{ ...type.label, fontSize: 12 }}>Paid</span>
                </label>
              </div>
              <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
                {editId && <button onClick={resetForm} style={btnSecondary}>Cancel</button>}
                <button onClick={submit} style={btnPrimary}>{editId ? "Save Changes" : "Add Item"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Line items */}
      {tabItems.length === 0 ? <EmptyState tab={tab} /> : (
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.lg }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.charcoal}` }}>
                {["Label", "Category", "Estimated", "Actual", "Variance", "Paid", "Vendor", ""].map((h) => (
                  <th key={h} style={{ ...type.label, fontSize: 11, textAlign: "left", padding: `${spacing.sm}px ${spacing.md}px`, color: colors.charcoal }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabItems.map((b) => {
                const variance = (b.actual || 0) - (b.estimated || 0);
                return (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${colors.gray}` }}>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14, fontWeight: 400 }}>
                      {b.label}
                      {b.notes && <div style={{ fontSize: 12, color: colors.muted }}>{b.notes}</div>}
                    </td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px` }}>
                      <span style={{ ...type.label, fontSize: 10, background: colors.gray, color: colors.charcoal, padding: "2px 7px", borderRadius: 2 }}>{b.category}</span>
                    </td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14 }}>{usd(b.estimated)}</td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14 }}>{usd(b.actual)}</td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14, color: varianceColor(variance), fontWeight: 700 }}>
                      {variance >= 0 ? "+" : ""}{usd(variance)}
                    </td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px` }}>
                      <span style={{ ...type.label, fontSize: 10, color: b.paid ? colors.success : colors.muted }}>{b.paid ? "✓ Paid" : "Unpaid"}</span>
                    </td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.label, fontSize: 11, color: colors.muted }}>{b.vendor || "—"}</td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, whiteSpace: "nowrap" }}>
                      {!isLocked && (
                        <>
                          <button onClick={() => startEdit(b)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.charcoal, fontSize: 13, padding: "0 6px" }}>Edit</button>
                          <button onClick={() => setDeleteId(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.danger, fontSize: 13, padding: "0 6px" }}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Category breakdown */}
      {categoryTotals.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${colors.gray}`, borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.lg }}>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            style={{ ...type.button, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", padding: `${spacing.md}px ${spacing.lg}px`, color: colors.charcoal, fontSize: 14, display: "flex", justifyContent: "space-between" }}
          >
            Category Breakdown
            <span style={{ color: colors.muted }}>{showBreakdown ? "▲" : "▼"}</span>
          </button>
          {showBreakdown && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderTop: `1px solid ${colors.gray}`, borderBottom: `1px solid ${colors.charcoal}` }}>
                  {["Category", "Est Total", "Actual Total", "Variance"].map((h) => (
                    <th key={h} style={{ ...type.label, fontSize: 11, textAlign: "left", padding: `${spacing.sm}px ${spacing.md}px`, color: colors.charcoal }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryTotals.map((c) => (
                  <tr key={c.cat} style={{ borderBottom: `1px solid ${colors.gray}` }}>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.label, fontSize: 12 }}>{c.cat}</td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14 }}>{usd(c.est)}</td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14 }}>{usd(c.act)}</td>
                    <td style={{ padding: `${spacing.sm}px ${spacing.md}px`, ...type.body, fontSize: 14, color: varianceColor(c.act - c.est) }}>
                      {c.act - c.est >= 0 ? "+" : ""}{usd(c.act - c.est)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
        <button onClick={() => { const csv = exportBudgetCSV(items); downloadCSV(csv, `${activeEvent.name}-budget.csv`); }} style={btnSecondary}>Export Budget CSV</button>
        <button onClick={() => exportPLSummaryPDF(items, activeEvent)} style={btnSecondary}>Export P&L PDF</button>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: spacing.md }}>
          <div style={{ background: colors.cream, borderRadius: radius.lg, padding: spacing.xl, maxWidth: 360, width: "100%" }}>
            <h3 style={{ ...type.h3, marginBottom: spacing.sm }}>Delete Line Item?</h3>
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
