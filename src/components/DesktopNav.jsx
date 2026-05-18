import { NavLink } from "react-router-dom";
import { colors, type, spacing } from "./brand/tokens";

const TABS = [
  { to: "/",          label: "RSVPs"    },
  { to: "/budget",    label: "Budget"   },
  { to: "/runofshow", label: "Schedule" },
  { to: "/debrief",   label: "Debrief"  },
];

export default function DesktopNav() {
  return (
    <>
      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } }
        .desktop-nav-link { text-decoration: none; padding: 12px 24px; display: inline-block; border-bottom: 3px solid transparent; }
        .desktop-nav-link.active { border-bottom-color: #f76732; }
        .desktop-nav-link.active .desktop-nav-label { color: #f76732; }
        .desktop-nav-link .desktop-nav-label { color: #888; }
        .desktop-nav-link:hover .desktop-nav-label { color: #403d3d; }
      `}</style>
      <nav className="desktop-nav" style={{
        background: "#fff",
        borderBottom: `1px solid ${colors.gray}`,
        display: "flex",
        paddingLeft: spacing.lg,
      }}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) => `desktop-nav-link${isActive ? " active" : ""}`}
          >
            <span className="desktop-nav-label" style={{ ...type.button, fontSize: 14 }}>
              {tab.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
