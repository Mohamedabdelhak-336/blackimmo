import React from "react";

/*
  Layout simple pour les pages admin :
  - pas de Header client
  - contenu centré pour la page de login
  - pour le dashboard on peut ajouter une sidebar plus tard
*/
export default function AdminLayout({ children }) {
  return (
    <div className="admin-root min-h-screen bg-gray-50">
      <div className="admin-topbar py-4 px-6 border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded flex items-center justify-center">A</div>
            <div className="text-lg font-semibold">Admin — Mr Black Immobilier</div>
          </div>
        </div>
      </div>

      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}