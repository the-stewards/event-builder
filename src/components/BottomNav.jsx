import { NavLink } from "react-router-dom";
import { colors, type } from "./brand/tokens";

const TABS = [
  { to: "/",          label: "RSVPs",    icon: "👥" },
  { to: "/budget",    label: "Budget",   icon: "💰" },
  { to: "/runofshow", label: "Schedule", icon: "📋" },
  { to: "/debrief",   label: "Debrief",  icon: "📊" },
];

export default function BottomNav() {
  return (
    <>
      <style>{`
        @media (min-width: 769px) { .bottom-nav { display: none !important; } }
        .bottom-nav-link { text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; padding: 8px 0; }
        .bottom-nav-link.active .bottom-nav-label { color: #f76732; }
        .bottom-nav-link .bottom-nav-label { color: #888; }
      `}</style>
      <nav className="bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff",
        borderTop: `1px solid ${colors.gray}`,
        display: "flex",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) => `bottom-nav-link${isActive ? " active" : ""}`}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span className="bottom-nav-label" style={{ ...type.label, fontSize: 10 }}>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
