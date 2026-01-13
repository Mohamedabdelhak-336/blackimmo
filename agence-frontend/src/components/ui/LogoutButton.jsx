import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/*
  Animated logout button:
  - appelle POST /api/admin/logout (credentials included)
  - affiche un spinner pendant la requête
  - animation hover / focus / click (scale + ripple)
  - accessible (aria, keyboard)
*/
export default function LogoutButton({ redirectTo = "/admin/login", className = "" }) {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleLogout(e) {
    e.preventDefault();
    if (loading) return;
    // optional confirm
    const ok = window.confirm("Voulez-vous vraiment vous déconnecter ?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Accept": "application/json" },
      });
      // regardless of response, redirect to login or home
      // clear any client-side state if needed (context / localStorage)
      try { localStorage.removeItem("admin_profile"); } catch {}
      nav(redirectTo);
    } catch (err) {
      console.error("Logout error:", err);
      alert("Erreur lors de la déconnexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      className={`logout-btn ${className}`}
      aria-label="Se déconnecter"
      title="Se déconnecter"
      disabled={loading}
    >
      <span className="logout-content">
        <svg className="logout-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
        </svg>
        <span className="logout-label">{loading ? "Déconnexion..." : "Déconnexion"}</span>
      </span>

      {loading && <span className="logout-spinner" aria-hidden="true" />}
    </button>
  );
}