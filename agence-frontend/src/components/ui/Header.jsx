import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";
// Ajuste le chemin si ton AgencyInfo est ailleurs
import AgencyInfo from "../AgencyInfo";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setShowAbout(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ← AJOUT: toggle a body class so we can blur/disable background content
  useEffect(() => {
    if (showAbout) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [showAbout]);

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <header
      className="app-header fixed w-full z-40"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link
          to="/"
          className="flex items-center gap-2 group transition-opacity hover:opacity-80"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f3f4f6",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <img
              src={logo}
              alt="Mr Black Immobilier Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: "6px",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#111827",
                letterSpacing: "-0.3px",
              }}
            >
              Mr Black
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#6b7280",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Immobilier
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          className="nav-desktop"
          role="navigation"
          aria-label="Navigation principale"
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <Link
            to="/annonces"
            className={`nav-link ${isActive("/annonces") ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: isActive("/annonces") ? "#4f46e5" : "#6b7280",
              transition: "all 0.3s ease",
              borderBottom: isActive("/annonces")
                ? "2px solid #4f46e5"
                : "2px solid transparent",
            }}
          >
            Annonces
          </Link>

          <Link
            to="/contact"
            className={`nav-link ${isActive("/contact") ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: isActive("/contact") ? "#4f46e5" : "#6b7280",
              transition: "all 0.3s ease",
              borderBottom: isActive("/contact")
                ? "2px solid #4f46e5"
                : "2px solid transparent",
            }}
          >
            Contact
          </Link>

          {/* Remplacé : Déposer une demande -> À propos (ouvre une modal) */}
          <button
            onClick={() => setShowAbout(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#6b7280",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            aria-haspopup="dialog"
            aria-expanded={showAbout}
            title="À propos de l'agence"
          >
            À propos
          </button>
        </nav>

        {/* Mobile toggle */}
        <div className="nav-mobile-toggle">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "rgba(255,255,255,0.9)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="#111827"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`mobile-nav-dropdown ${open ? "open" : ""}`}
        role="menu"
        aria-hidden={!open}
        style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3"
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          <Link
            to="/annonces"
            onClick={() => setOpen(false)}
            className={`block nav-link ${isActive("/annonces") ? "active" : ""}`}
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: isActive("/annonces") ? "#4f46e5" : "#374151",
              transition: "all 0.2s ease",
              background: isActive("/annonces") ? "#eef2ff" : "transparent",
            }}
          >
            Annonces
          </Link>

          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className={`block nav-link ${isActive("/contact") ? "active" : ""}`}
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: isActive("/contact") ? "#4f46e5" : "#374151",
              transition: "all 0.2s ease",
              background: isActive("/contact") ? "#eef2ff" : "transparent",
            }}
          >
            Contact
          </Link>

          {/* Mobile: À propos */}
          <button
            onClick={() => {
              setOpen(false);
              setShowAbout(true);
            }}
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              background: "transparent",
              textAlign: "left",
              border: "none",
              cursor: "pointer",
            }}
          >
            À propos
          </button>
        </div>
      </div>

      {/* About Modal (overlay) - remplace ton ancien bloc {showAbout && (...) } */}
      {showAbout && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="À propos de l'agence"
          onClick={() => setShowAbout(false)}
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999, // TRÈS ÉLEVÉ pour recouvrir tout
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-dialog"
            style={{
              width: "min(900px, 96%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
              position: "relative",
              zIndex: 10000, // au-dessus de l'overlay et de tout le contenu
            }}
          >
            {/* header + close */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                À propos — Mr Black Immobilier
              </h2>
              <button
                onClick={() => setShowAbout(false)}
                aria-label="Fermer"
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: 8,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {/* Insère le composant AgencyInfo que tu as créé */}
              <AgencyInfo />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}