import { useState } from "react";
import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing } from "./brand/tokens";
import StatusBadge from "./StatusBadge";
import EventSelector from "./EventSelector";

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
  const [open, setOpen] = useState(false);

  return (
    <>
      <div style={{
        background: colors.charcoal,
        padding: `${spacing.sm}px ${spacing.lg}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        flexWrap: "wrap",
        minHeight: 48,
        cursor: event ? "pointer" : "default",
      }} onClick={() => event && setOpen(true)}>
        {event ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.md, flexWrap: "wrap" }}>
              <span style={{ ...type.h3, fontSize: 15, color: colors.cream, margin: 0 }}>{event.name}</span>
              <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>
                {event.date ? new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
              </span>
              <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>
                {(event.attendees || []).filter((a) => a.status === "confirmed").length} / {event.capacity || 100} seats
              </span>
              {event.date && (
                <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>{daysOut(event.date)}</span>
              )}
            </div>
            <StatusBadge status={event.status} pulse={event.status === "day-of"} />
          </>
        ) : (
          <span style={{ ...type.label, fontSize: 11, color: colors.muted }}>No event selected — tap to create one</span>
        )}
      </div>
      {open && <EventSelector onClose={() => setOpen(false)} />}
    </>
  );
}
