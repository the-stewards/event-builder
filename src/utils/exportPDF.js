function openPrintWindow(html, title) {
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700&family=Frank+Ruhl+Libre:wght@300;400&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Frank Ruhl Libre', serif; font-weight: 300; color: #333; padding: 40px; font-size: 14px; line-height: 1.6; }
      h1, h2, h3, .label { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; text-transform: uppercase; }
      h1 { font-size: 32px; color: #403d3d; margin-bottom: 4px; }
      h2 { font-size: 20px; color: #403d3d; margin: 24px 0 8px; }
      .label { font-size: 11px; letter-spacing: 0.15em; color: #888; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; text-align: left; padding: 6px 8px; border-bottom: 2px solid #403d3d; color: #403d3d; }
      td { padding: 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
      .meta { color: #888; font-size: 13px; margin-bottom: 24px; }
      .summary { display: flex; gap: 32px; margin-bottom: 24px; flex-wrap: wrap; }
      .stat { }
      .stat .val { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 24px; color: #403d3d; }
      @media print { body { padding: 20px; } }
    </style>
  </head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
}

export function exportDoorListPDF(attendees, event) {
  const confirmed = attendees.filter((a) => a.status === "confirmed");
  const rows = confirmed
    .map((a) => `<tr><td style="width:40px"><input type="checkbox" /></td><td>${a.name}${a.plusOne ? " +1" : ""}</td></tr>`)
    .join("");

  const html = `
    <h1>${event.name}</h1>
    <p class="meta">${event.date} · ${event.venue || ""} · Door List</p>
    <table>
      <thead><tr><th style="width:40px"></th><th>Name</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;color:#888;font-size:12px;">Total confirmed: ${confirmed.length}</p>
  `;
  openPrintWindow(html, `Door List — ${event.name}`);
}

export function exportRunOfShowPDF(runItems, event) {
  const sorted = [...runItems].sort((a, b) => a.time.localeCompare(b.time));
  const rows = sorted
    .map((r) => `<tr>
      <td style="white-space:nowrap;width:80px">${formatTime(r.time)}</td>
      <td style="width:60px">${r.duration}m</td>
      <td><strong>${r.item}</strong>${r.notes ? `<br><span style="color:#888;font-size:12px">${r.notes}</span>` : ""}</td>
      <td style="color:#888;width:120px">${r.owner || ""}</td>
    </tr>`)
    .join("");

  const html = `
    <h1>${event.name}</h1>
    <p class="meta">${event.date} · ${event.venue || ""} · Run of Show</p>
    <table>
      <thead><tr><th>Time</th><th>Duration</th><th>Item</th><th>Owner</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  openPrintWindow(html, `Run of Show — ${event.name}`);
}

export function exportPLSummaryPDF(budgetItems, event) {
  const income = budgetItems.filter((b) => b.type === "income");
  const expenses = budgetItems.filter((b) => b.type === "expense");
  const incomeEst = income.reduce((s, b) => s + (b.estimated || 0), 0);
  const incomeAct = income.reduce((s, b) => s + (b.actual || 0), 0);
  const expEst = expenses.reduce((s, b) => s + (b.estimated || 0), 0);
  const expAct = expenses.reduce((s, b) => s + (b.actual || 0), 0);
  const net = incomeAct - expAct;

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
  const color = net >= 0 ? "#4a7c59" : "#b94040";

  const itemRows = (items) =>
    items.map((b) => `<tr>
      <td>${b.label}</td>
      <td style="color:#888">${b.category}</td>
      <td>${fmt(b.estimated)}</td>
      <td>${fmt(b.actual)}</td>
      <td style="color:${b.actual - b.estimated > 0 ? "#b94040" : "#4a7c59"}">${fmt(b.actual - b.estimated)}</td>
    </tr>`).join("");

  const html = `
    <h1>${event.name}</h1>
    <p class="meta">${event.date} · P&L Summary</p>
    <div class="summary">
      <div class="stat"><div class="label">Income Est</div><div class="val">${fmt(incomeEst)}</div></div>
      <div class="stat"><div class="label">Income Actual</div><div class="val">${fmt(incomeAct)}</div></div>
      <div class="stat"><div class="label">Expenses Est</div><div class="val">${fmt(expEst)}</div></div>
      <div class="stat"><div class="label">Expenses Actual</div><div class="val">${fmt(expAct)}</div></div>
      <div class="stat"><div class="label">Net</div><div class="val" style="color:${color}">${fmt(net)}</div></div>
    </div>
    <h2>Income</h2>
    <table><thead><tr><th>Label</th><th>Category</th><th>Estimated</th><th>Actual</th><th>Variance</th></tr></thead>
    <tbody>${itemRows(income)}</tbody></table>
    <h2>Expenses</h2>
    <table><thead><tr><th>Label</th><th>Category</th><th>Estimated</th><th>Actual</th><th>Variance</th></tr></thead>
    <tbody>${itemRows(expenses)}</tbody></table>
  `;
  openPrintWindow(html, `P&L Summary — ${event.name}`);
}

export function exportDebriefPDF(debrief, event) {
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n ?? 0);
  const net = (debrief.revenueActual ?? 0) - (debrief.expenseActual ?? 0);
  const netColor = net >= 0 ? "#4a7c59" : "#b94040";

  const listItems = (arr) => (arr || []).filter(Boolean).map((s) => `<li>${s}</li>`).join("") || "<li>—</li>";

  const html = `
    <h1>${event.name} — Debrief</h1>
    <p class="meta">${event.date} · ${event.venue || ""}</p>
    <div class="summary">
      <div class="stat"><div class="label">RSVPs</div><div class="val">${debrief.rsvpCount ?? "—"}</div></div>
      <div class="stat"><div class="label">Attended</div><div class="val">${debrief.attendedCount ?? "—"}</div></div>
      <div class="stat"><div class="label">Revenue</div><div class="val">${fmt(debrief.revenueActual)}</div></div>
      <div class="stat"><div class="label">Expenses</div><div class="val">${fmt(debrief.expenseActual)}</div></div>
      <div class="stat"><div class="label">Net</div><div class="val" style="color:${netColor}">${fmt(net)}</div></div>
      <div class="stat"><div class="label">NPS Score</div><div class="val">${debrief.npsScore ?? "—"}/10</div></div>
    </div>
    <h2>Wins</h2><ul>${listItems(debrief.wins)}</ul>
    <h2>Misses</h2><ul>${listItems(debrief.misses)}</ul>
    <h2>Do Differently Next Time</h2><ul>${listItems(debrief.nextTime)}</ul>
    ${debrief.aiSummary ? `<h2>Summary</h2><p style="line-height:1.8;margin-top:8px">${debrief.aiSummary}</p>` : ""}
  `;
  openPrintWindow(html, `Debrief — ${event.name}`);
}

function formatTime(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
