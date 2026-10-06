import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RockieHeader from "@/components/RockieHeader";
import "@/pages/LandingPage.css";

/**
 * RockieLayout — Wrapper for all user-facing inside pages.
 * Supports dark/light toggle. Default: dark mode.
 * Admin pages do NOT use this wrapper.
 */
const RockieLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved === 'light' ? false : true;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("is_dark");
    } else {
      document.body.classList.remove("is_dark");
    }
    return () => document.body.classList.remove("is_dark");
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme_mode', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <div className={`body-rockie ${darkMode ? "is_dark" : ""}`}>
      <RockieHeader
        isLoggedIn={!!user}
        user={user}
        onLogout={logout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      <main className="rockie-main">
        {children}
      </main>
    </div>
  );
};

export default RockieLayout;
