import React from "react";
import * as XLSX from "xlsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ExportExcel({ offres }) {
  function handleExport() {
    if (!offres || offres.length === 0) {
      alert("⚠️ Aucune annonce à exporter");
      return;
    }

    // Prépare les données pour Excel
    const dataToExport = offres.map((o) => ({
      "Reference": o.id,
      "Adresse": o.adresse || "-",
      "Prix (TND)": o.price || "-",
      "Type": o.type || "-",
      "Description": o. descript || "-",
      "Vidéo": o.videoId ?  "Oui" : "Non",
      "Statut": o.published ? "Publié" : "Brouillon",
      "Date": o.createdAt ? new Date(o.createdAt). toLocaleDateString("fr-FR") : "-"
    }));

    // Crée le workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Annonces");

    // Configure les largeurs de colonnes
    worksheet["! cols"] = [
      { wch: 6 },   // ID
      { wch: 25 },  // Adresse
      { wch: 12 },  // Prix
      { wch: 12 },  // Type
      { wch: 30 },  // Description
      { wch: 10 },  // Vidéo
      { wch: 12 },  // Statut
      { wch: 15 }   // Date
    ];

    // Télécharge le fichier
    const fileName = `annonces-mr-black-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX. writeFile(workbook, fileName);
  }

  return (
    <button
      onClick={handleExport}
      style={{
        background: "linear-gradient(135deg, #10b981, #059669)",
        color: "white",
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "700",
        transition: "all 0.2s ease",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e. currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)";
      }}
      title="Exporter les annonces en Excel"
      aria-label="Exporter en Excel"
    >
      📥 Exporter Excel
    </button>
  );
}