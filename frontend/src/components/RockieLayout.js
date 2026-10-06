import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RockieHeader from "@/components/RockieHeader";
import "@/pages/LandingPage.css";

/**
 * RockieLayout — Wrapper for all user-facing inside pages.
 * Always dark mode for inner pages (wallet, profile, transactions, etc.)
 * Admin pages do NOT use this wrapper.
 */
const RockieLayout = ({ children }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    document.body.classList.add("is_dark");
    return () => document.body.classList.remove("is_dark");
  }, []);

  return (
    <div className="body-rockie is_dark">
      <RockieHeader
        isLoggedIn={!!user}
        user={user}
        onLogout={logout}
        darkMode={true}
        onToggleDarkMode={() => {}} /* no-op: inner pages are always dark */
      />
      <main className="rockie-main">
        {children}
      </main>
    </div>
  );
};

export default RockieLayout;
