import { useLocation } from "react-router-dom";
import { useEventStore } from "../store/useEventStore";
import { colors, type, spacing } from "./brand/tokens";

const ROUTE_TITLES = {
  "/": "RSVPs",
  "/budget": "Budget",
  "/runofshow": "Schedule",
  "/debrief": "Debrief",
};

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
      <span style={{ animation: saveStatus === "saving" ? "spin 1s linear infinite" : "none" }}>{ind.dot}</span>
      {ind.label}
      {saveStatus === "saving" && <style>{`@keyframes spin{from{opacity:1}50%{opacity:0.3}to{opacity:1}}`}</style>}
    </button>
  );
}

export default function NavBar() {
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] || "";

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
      <span style={{ ...type.label, fontSize: 13, color: colors.charcoal, letterSpacing: "0.2em" }}>
        {title}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        <AutosaveIndicator />
        <button
          onClick={() => window.netlifyIdentity?.logout()}
          style={{
            background: "none", border: "none", cursor: "pointer",
            ...type.label, fontSize: 11, color: colors.muted,
            padding: "4px 8px",
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
