export function exportAttendeesCSV(attendees) {
  const headers = ["Name", "Email", "Phone", "Status", "Showed", "Converted", "Paid", "Plus One", "Source", "Notes", "Added At"];
  const rows = attendees.map((a) => [
    a.name, a.email, a.phone, a.status,
    a.showed ? "Yes" : "No",
    a.converted ? "Yes" : "No",
    a.paid ? "Yes" : "No",
    a.plusOne ? "Yes" : "No",
    a.source, a.notes,
    new Date(a.addedAt).toLocaleDateString(),
  ]);
  return toCSV(headers, rows);
}

export function exportBudgetCSV(budgetItems) {
  const headers = ["Label", "Category", "Type", "Estimated", "Actual", "Variance", "Paid", "Vendor", "Notes"];
  const rows = budgetItems.map((b) => [
    b.label, b.category, b.type,
    b.estimated, b.actual,
    b.actual - b.estimated,
    b.paid ? "Yes" : "No",
    b.vendor, b.notes,
  ]);
  return toCSV(headers, rows);
}

function toCSV(headers, rows) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
