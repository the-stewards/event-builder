import { useState } from "react";
import { useEventStore } from "../store/useEventStore";
import { deleteEvent } from "../utils/api";
import { colors, type, spacing, radius } from "./brand/tokens";
import StatusBadge from "./StatusBadge";
import OnboardingWizard from "./OnboardingWizard";

export default function EventSelector({ onClose }) {
  const { events, activeEventId, setActiveEvent, removeEvent } = useEventStore();
  const [showWizard, setShowWizard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function handleDelete(id) {
    await deleteEvent(id);
    removeEvent(id);
    setConfirmDelete(null);
  }

  if (showWizard) {
    return <OnboardingWizard onClose={() => { setShowWizard(false); onClose(); }} />;
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 150,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", top: 56, left: 0, right: 0,
          background: colors.charcoal, maxWidth: 480,
          margin: "0 auto", borderRadius: `0 0 ${radius.lg}px ${radius.lg}px`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)", overflow: "hidden",
        }}
      >
        {events.length === 0 && (
          <p style={{ ...type.body, fontSize: 14, color: colors.muted, padding: `${spacing.lg}px ${spacing.md}px`, textAlign: "center" }}>
            No events yet.
          </p>
        )}
        {events.map((ev) => (
          <div
            key={ev.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: `${spacing.md}px ${spacing.lg}px`,
              borderBottom: `1px solid rgba(255,255,255,0.08)`,
              background: ev.id === activeEventId ? "rgba(247,103,50,0.15)" : "transparent",
              cursor: "pointer",
            }}
            onClick={() => { setActiveEvent(ev.id); onClose(); }}
          >
            <div>
              <p style={{ ...type.h3, fontSize: 16, color: colors.cream, margin: 0 }}>{ev.name}</p>
              <p style={{ ...type.label, fontSize: 11, color: colors.muted, marginTop: 2 }}>
                {ev.date ? new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "No date"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
              <StatusBadge status={ev.status} />
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(ev.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: colors.muted, fontSize: 16, padding: "4px", lineHeight: 1 }}
                title="Delete event"
              >
                🗑
              </button>
            </div>
          </div>
        ))}

        <div
          style={{
            padding: `${spacing.md}px ${spacing.lg}px`,
            borderTop: `1px solid rgba(255,255,255,0.1)`,
          }}
        >
          <button
            onClick={() => setShowWizard(true)}
            style={{
              ...type.button, background: colors.orange, color: "#fff",
              border: "none", borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.lg}px`,
              cursor: "pointer", width: "100%",
            }}
          >
            + Create New Event
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: spacing.md }}>
          <div style={{ background: colors.cream, borderRadius: radius.lg, padding: spacing.xl, maxWidth: 360, width: "100%" }}>
            <h3 style={{ ...type.h3, marginBottom: spacing.sm }}>Delete Event?</h3>
            <p style={{ ...type.body, fontSize: 14, marginBottom: spacing.lg }}>This cannot be undone. All data for this event will be permanently deleted.</p>
            <div style={{ display: "flex", gap: spacing.sm, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ background: "none", border: `1px solid ${colors.gray}`, borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.md}px`, cursor: "pointer", ...type.button, fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ background: colors.danger, border: "none", borderRadius: radius.md, padding: `${spacing.sm}px ${spacing.md}px`, cursor: "pointer", ...type.button, fontSize: 14, color: "#fff" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
