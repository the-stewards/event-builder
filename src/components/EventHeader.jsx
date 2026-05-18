import { useState } from "react";
import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing } from "./brand/tokens";
import StatusBadge from "./StatusBadge";
import EventSelector from "./EventSelector";
import OnboardingWizard from "./OnboardingWizard";

function daysOut(dateStr) {
  if (!dateStr) return null;
  const eventDate = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((eventDate - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff > 0) return `${diff} day${diff === 1 ? "" : "s"} out`;
  return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago`;
}

export default function EventHeader() {
  const event = useEventStore((s) => s.activeEvent);
  const events = useEventStore((s) => s.events);
  const [open, setOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <div style={{
        background: colors.charcoal,
        padding: `0 ${spacing.lg}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        minHeight: 48,
      }}>
        {/* Left — event info or prompt */}
        <div
          onClick={() => events.length > 0 && setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: spacing.md,
            flexWrap: "wrap", flex: 1,
            cursor: events.length > 0 ? "pointer" : "default",
            padding: `${spacing.sm}px 0`,
          }}
        >
          {event ? (
            <>
              <span style={{ ...type.h3, fontSize: 15, color: colors.cream, margin: 0 }}>
                {event.name}
              </span>
              <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>
                {event.date ? new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
              </span>
              <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>
                {(event.attendees || []).filter((a) => a.status === "confirmed").length} / {event.capacity || 100} seats
              </span>
              {event.date && (
                <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>{daysOut(event.date)}</span>
              )}
              <StatusBadge status={event.status} pulse={event.status === "day-of"} />
              {events.length > 1 && (
                <span style={{ ...type.label, fontSize: 11, color: colors.orange }}>Switch ▾</span>
              )}
            </>
          ) : (
            <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>
              No event selected
            </span>
          )}
        </div>

        {/* Right — always-visible create button */}
        <button
          onClick={() => setShowWizard(true)}
          style={{
            ...type.button, fontSize: 13,
            background: colors.orange, color: "#fff",
            border: "none", borderRadius: 2,
            padding: `6px 16px`,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          + New Event
        </button>
      </div>

      {open && <EventSelector onClose={() => setOpen(false)} />}
      {showWizard && <OnboardingWizard onClose={() => setShowWizard(false)} />}
    </>
  );
}
