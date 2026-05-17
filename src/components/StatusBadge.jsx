import { colors, type } from "./brand/tokens";

const STATUS_STYLES = {
  draft:    { background: colors.gray,    color: colors.charcoal },
  active:   { background: colors.success, color: "#fff" },
  "day-of": { background: colors.orange,  color: "#fff" },
  closed:   { background: colors.charcoal, color: colors.cream },
  confirmed: { background: colors.success, color: "#fff" },
  waitlist:  { background: colors.warning, color: "#fff" },
  declined:  { background: colors.gray,    color: colors.charcoal },
};

export default function StatusBadge({ status, pulse = false }) {
  const style = STATUS_STYLES[status] || { background: colors.gray, color: colors.charcoal };
  return (
    <span style={{
      ...type.label,
      fontSize: 11,
      letterSpacing: "0.1em",
      background: style.background,
      color: style.color,
      padding: "2px 8px",
      borderRadius: 2,
      display: "inline-block",
      animation: pulse ? "pulse 1.5s ease-in-out infinite" : "none",
    }}>
      {status}
      {pulse && (
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>
      )}
    </span>
  );
}
