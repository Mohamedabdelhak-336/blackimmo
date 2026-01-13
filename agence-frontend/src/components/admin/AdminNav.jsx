import React from "react";

/*
  AdminNav sans select (plus simple) :
  - Desktop + mobile : boutons segmentés
  - Pour mobile, les boutons sont scrollables horizontalement
*/
export default function AdminNav({ active, onChange }) {
  return (
    <nav className="admin-nav max-w-7xl mx-auto px-4 py-4 overflow-x-auto" aria-label="Navigation admin">
      <div className="admin-nav-inner flex gap-3 items-center">
        <button
          className={`nav-btn ${active === "demandes" ? "active" : ""}`}
          onClick={() => onChange("demandes")}
        >
          Demandes
        </button>

        <button
          className={`nav-btn ${active === "offres" ? "active" : ""}`}
          onClick={() => onChange("offres")}
        >
          Offres
        </button>

        <div style={{ flex: 1 }} />
      </div>
    </nav>
  );
}