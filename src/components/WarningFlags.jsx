import { useState } from "react";
import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing } from "./brand/tokens";

function flag(key, icon, message) {
  return { key, icon, message };
}

export default function WarningFlags() {
  const event = useEventStore((s) => s.activeEvent);
  const [dismissed, setDismissed] = useState([]);

  if (!event) return null;

  const flags = [];

  const expenses = (event.budgetItems || []).filter((b) => b.type === "expense");
  const expEst = expenses.reduce((s, b) => s + (b.estimated || 0), 0);
  const expAct = expenses.reduce((s, b) => s + (b.actual || 0), 0);
  if (expEst > 0 && expAct > expEst * 1.1) {
    flags.push(flag("budget", "⚠", "You're over budget on expenses"));
  }

  const confirmed = (event.attendees || []).filter((a) => a.status === "confirmed").length;
  if (confirmed >= (event.capacity || 100)) {
    flags.push(flag("capacity", "🚨", "Venue is at capacity — new attendees go to waitlist automatically"));
  }

  const sorted = [...(event.runItems || [])].sort((a, b) => a.time.localeCompare(b.time));
  for (let i = 0; i < sorted.length - 1; i++) {
    const endMin = timeToMin(sorted[i].time) + (sorted[i].duration || 0);
    const nextMin = timeToMin(sorted[i + 1].time);
    if (nextMin - endMin > 15) {
      flags.push(flag("gap", "⚠", "Schedule has a gap over 15 minutes"));
      break;
    }
  }

  if (event.status === "closed" && !event.debrief?.completedAt) {
    const closedAt = event.updatedAt ? new Date(event.updatedAt) : null;
    const daysSince = closedAt ? (Date.now() - closedAt.getTime()) / 86400000 : 0;
    if (daysSince > 7) {
      flags.push(flag("debrief", "📋", "Debrief is overdue"));
    }
  }

  const visible = flags.filter((f) => !dismissed.includes(f.key));
  if (!visible.length) return null;

  return (
    <div style={{ background: "#fffbe6", borderBottom: `1px solid ${colors.gray}` }}>
      {visible.map((f) => (
        <div key={f.key} style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${spacing.xs}px ${spacing.md}px`,
          borderBottom: `1px solid ${colors.gray}`,
        }}>
          <span style={{ ...type.body, fontSize: 13, color: colors.warning }}>
            {f.icon} {f.message}
          </span>
          <button
            onClick={() => setDismissed((d) => [...d, f.key])}
            style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, fontSize: 16, lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function timeToMin(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
