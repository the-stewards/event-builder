import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing } from "./brand/tokens";

function AutosaveIndicator() {
  const { saveStatus, forceSave } = useEventStore();

  const indicators = {
    saved:  { dot: "●", color: colors.success, label: "Saved" },
    saving: { dot: "◌", color: colors.muted,   label: "Saving…" },
    error:  { dot: "⚠", color: colors.orange,  label: "Retry", clickable: true },
  };

  const ind = indicators[saveStatus] || indicators.saved;

  return (
    <button
      onClick={ind.clickable ? forceSave : undefined}
      style={{
        background: "none", border: "none", cursor: ind.clickable ? "pointer" : "default",
        display: "flex", alignItems: "center", gap: 4,
        ...type.label, fontSize: 11, color: ind.color,
        padding: 0,
      }}
    >
      <span>{ind.dot}</span>
      {ind.label}
    </button>
  );
}

export default function NavBar() {
  return (
    <nav style={{
      background: "#fff",
      borderBottom: `1px solid ${colors.gray}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: `0 ${spacing.lg}px`,
      height: 56, position: "sticky", top: 0, zIndex: 100,
    }}>
      <span style={{ ...type.h3, fontSize: 18, letterSpacing: "0.02em", color: colors.charcoal }}>
        The Stewards
      </span>
      <AutosaveIndicator />
    </nav>
  );
}
