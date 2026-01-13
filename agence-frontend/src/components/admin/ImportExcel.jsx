import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ImportExcel({ onSuccess }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Gère la sélection du fichier
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name. toLowerCase();
    if (! fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setError("⚠️ Veuillez sélectionner un fichier Excel (. xlsx ou .xls)");
      return;
    }

    processFile(file);
  }

  // Traite le fichier Excel
  async function processFile(file) {
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("Le fichier Excel est vide");
      }

      // Valide et prépare les données
      const validatedData = jsonData.map((row, idx) => {
        const adresse = String(row. adresse || row. Adresse || ""). trim();
        const prix = Number(row.prix || row.Prix || row.price || 0);
        const type = String(row.type || row.Type || "À vendre").trim();
        const descript = String(row.description || row.Description || row. descript || "").trim();
        const createdAt = row.date || row.Date || new Date(). toISOString();

        if (!adresse || prix <= 0 || ! type) {
          throw new Error(`Ligne ${idx + 2} invalide : adresse, prix et type sont obligatoires`);
        }

        return {
          adresse,
          price: prix,
          type,
          descript: descript || `Annonce importée le ${new Date().toLocaleDateString("fr-FR")}`,
          createdAt,
          published: false
        };
      });

      // Envoie les données au backend
      await importToBackend(validatedData);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(`❌ Erreur : ${errorMsg}`);
      console.error("Import error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Envoie les données au backend
  async function importToBackend(data) {
    try {
      const response = await fetch(`${API}/api/admin/offres/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offres: data })
      });

      const result = await response.json();

      if (! response.ok) {
        throw new Error(result.error || "Erreur lors de l'import");
      }

      setSuccessMessage(`✅ ${result.imported || data.length} annonce(s) importée(s) avec succès ! `);
      
      // Réinitialise le formulaire
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notifie le parent pour rafraîchir
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur serveur";
      setError(`❌ Erreur serveur : ${errorMsg}`);
    }
  }

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "24px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      border: "2px dashed #4f46e5"
    }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        📊 Importer des annonces (Excel)
      </h3>

      {/* Zone de dépôt */}
      <div
        onClick={() => fileInputRef.current?. click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.background = "#f0f4ff";
            e.currentTarget.style.borderColor = "#6150f3";
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.background = "#f9fafb";
            e. currentTarget.style.borderColor = "#4f46e5";
          }
        }}
        onDrop={(e) => {
          e. preventDefault();
          if (e. currentTarget instanceof HTMLElement) {
            e.currentTarget.style. background = "#f9fafb";
            e.currentTarget.style.borderColor = "#4f46e5";
          }
          const file = e.dataTransfer?. files?.[0];
          if (file) {
            processFile(file);
          }
        }}
        style={{
          padding: "30px",
          border: "2px dashed #4f46e5",
          borderRadius: "8px",
          background: "#f9fafb",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        <div style={{ fontSize: "32px", marginBottom: "12px" }}>📁</div>
        <p style={{ fontSize: "16px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>
          Glissez votre fichier Excel ici
        </p>
        <p style={{ fontSize: "13px", color: "#6b7280" }}>
          ou cliquez pour sélectionner un fichier (. xlsx, .xls)
        </p>
      </div>

      {/* Informations sur le format */}
      <div style={{ marginTop: "16px", padding: "12px", background: "#f3f4f6", borderRadius: "6px", fontSize: "12px", color: "#4b5563" }}>
        <p style={{ fontWeight: "700", marginBottom: "8px" }}>📋 Format requis :</p>
        <ul style={{ marginLeft: "20px", lineHeight: "1.6" }}>
          <li><strong>adresse</strong> : Adresse du bien (obligatoire)</li>
          <li><strong>prix</strong> : Prix en TND (obligatoire)</li>
          <li><strong>type</strong> : "À vendre" ou "À louer" (obligatoire)</li>
          <li><strong>description</strong> : Description du bien (optionnel)</li>
          <li><strong>date</strong> : Date de création (optionnel, défaut : aujourd'hui)</li>
        </ul>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div style={{
          marginTop: "12px",
          padding: "12px",
          background: "#fee2e2",
          color: "#991b1b",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: "600"
        }}>
          {error}
        </div>
      )}

      {/* Message de succès */}
      {successMessage && (
        <div style={{
          marginTop: "12px",
          padding: "12px",
          background: "#d1fae5",
          color: "#065f46",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: "600"
        }}>
          {successMessage}
        </div>
      )}

      {/* État de chargement */}
      {loading && (
        <div style={{
          marginTop: "12px",
          padding: "12px",
          background: "#dbeafe",
          color: "#1e40af",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: "600",
          textAlign: "center"
        }}>
          ⏳ Traitement du fichier...
        </div>
      )}
    </div>
  );
}