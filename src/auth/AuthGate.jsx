import { useEffect, useState } from "react";
import { colors, type, spacing } from "../components/brand/tokens";

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.charcoal,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <p style={{ ...type.label, color: colors.cream, letterSpacing: "0.3em" }}>Loading…</p>
    </div>
  );
}

function LoginScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.charcoal,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    }}>
      <p style={{ ...type.sectionLabel, color: colors.orange, marginBottom: spacing.sm }}>
        The Stewards
      </p>
      <h1 style={{ ...type.h1, color: colors.cream, marginBottom: spacing.sm, textAlign: "center" }}>
        Event Tool
      </h1>
      <p style={{
        fontFamily: "'Frank Ruhl Libre', serif",
        fontWeight: 300,
        fontSize: 13,
        color: colors.muted,
        marginBottom: spacing.xl,
        letterSpacing: "0.05em",
        textAlign: "center",
      }}>
        Matthew 25:21
      </p>
      <button
        onClick={() => window.netlifyIdentity?.open()}
        style={{
          ...type.button,
          background: colors.orange,
          color: "#fff",
          border: "none",
          padding: `${spacing.md}px ${spacing.xl}px`,
          borderRadius: 2,
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        Sign In
      </button>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const identity = window.netlifyIdentity;
    if (!identity) {
      setLoading(false);
      return;
    }

    // Fallback: if init doesn't fire within 3s (no Netlify site configured), show login
    const timeout = setTimeout(() => setLoading(false), 3000);

    identity.on("init", (u) => { clearTimeout(timeout); setUser(u); setLoading(false); });
    identity.on("login", (u) => { setUser(u); identity.close(); });
    identity.on("logout", () => setUser(null));
    identity.init();

    return () => clearTimeout(timeout);
  }, []);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;
  return children;
}
