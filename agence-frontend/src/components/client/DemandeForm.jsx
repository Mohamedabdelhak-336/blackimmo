import React, { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function DemandeForm() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    numTel: "",
    localisation: "",
    typeService: "location", // "location", "achat" ou "vendre"
    maxBudget: "",
    typeLogement: "S+1",
    marie: "",
    nombreFamille: "",
    description: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!formData.nom || !formData.prenom || ! formData.numTel) {
        throw new Error("Nom, prénom et téléphone sont obligatoires");
      }

      // Validation du budget selon le type
      if (formData.typeService === "vendre" && ! formData.maxBudget) {
        throw new Error("Le prix de vente est obligatoire");
      }

      const response = await fetch(`${API}/api/demandes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          numTel: formData.numTel,
          localisation: formData.localisation,
          typeService: formData.typeService,
          maxBudget: formData.maxBudget ?  Number(formData.maxBudget) : null,
          typeLogement: formData.typeLogement,
          marie: formData. marie,
          nombreFamille: formData.nombreFamille ?  Number(formData.nombreFamille) : null,
          description: formData.description
        })
      });

      const result = await response.json();

      if (! response.ok) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      setSuccess("✅ Votre demande a été envoyée avec succès !");
      
      // Réinitialise le formulaire
      setFormData({
        nom: "",
        prenom: "",
        numTel: "",
        localisation: "",
        typeService: "location",
        maxBudget: "",
        typeLogement: "S+1",
        marie: "",
        nombreFamille: "",
        description: ""
      });

      // Cache le message après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`❌ Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      maxWidth: "600px",
      margin: "40px auto",
      padding: "30px",
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
      border: "1px solid #e5e7eb"
    }}>
      <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "24px", color: "#111827" }}>
        📋 Remplissez votre demande
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Nom et Prénom */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
              Nom *
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Votre nom"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
              Prénom *
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              placeholder="Votre prénom"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
              required
            />
          </div>
        </div>

        {/* Téléphone */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
            Téléphone *
          </label>
          <input
            type="tel"
            name="numTel"
            value={formData. numTel}
            onChange={handleChange}
            placeholder="+216 XX XXX XXX"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
            required
          />
        </div>

        {/* Localisation */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
            Localisation
          </label>
          <input
            type="text"
            name="localisation"
            value={formData.localisation}
            onChange={handleChange}
            placeholder="Ex: Tunis, Lac 1"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Type Service - MODIFIÉ AVEC 3 OPTIONS */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
            Que cherchez-vous ?  *
          </label>
          <select
            name="typeService"
            value={formData. typeService}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
              fontWeight: "600"
            }}
          >
            <option value="location">🏠 Louer un logement</option>
            <option value="achat">🛒 Acheter un logement</option>
            <option value="vendre">💰 Vendre ma propriété</option>
          </select>
        </div>

        {/* Budget Max - Label dynamique */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
            {formData.typeService === "vendre" ? "Prix de vente (TND) *" : "Budget maximum (TND)"}
          </label>
          <input
            type="number"
            name="maxBudget"
            value={formData. maxBudget}
            onChange={handleChange}
            placeholder={formData.typeService === "vendre" ? "Ex: 150000" : "Ex: 2500"}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: formData.typeService === "vendre" && !formData.maxBudget ? "2px solid #dc2626" : "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
              background: formData.typeService === "vendre" ? "#fef3c7" : "white"
            }}
            required={formData.typeService === "vendre"}
          />
          {formData.typeService === "vendre" && (
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              💡 Entrez le montant auquel vous souhaitez vendre votre propriété
            </p>
          )}
        </div>

        {/* Type Logement - Masqué si "vendre" */}
        {formData.typeService !== "vendre" && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
              Type de logement
            </label>
            <select
              name="typeLogement"
              value={formData.typeLogement}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box"
              }}
            >
              <option value="S+1">S+1</option>
              <option value="S+2">S+2</option>
              <option value="S+3">S+3</option>
              <option value="villa">Villa</option>
              <option value="appartement">Appartement</option>
            </select>
          </div>
        )}

        {/* Marié */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
            Êtes-vous marié(e) ?
          </label>
          <select
            name="marie"
            value={formData. marie}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          >
            <option value="">-- Sélectionnez --</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
        </div>

        {/* Nombre Famille */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
            Nombre de membres de la famille
          </label>
          <input
            type="number"
            name="nombreFamille"
            value={formData.nombreFamille}
            onChange={handleChange}
            placeholder="Ex: 4"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
            {formData.typeService === "vendre" ? "Description de votre propriété" : "Description / Remarques"}
          </label>
          <textarea
            name="description"
            value={formData. description}
            onChange={handleChange}
            placeholder={formData.typeService === "vendre" ? "Décrivez votre propriété (nombre de pièces, état, équipements... )" : "Décrivez vos besoins ou remarques... "}
            rows="4"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
              fontFamily: "inherit"
            }}
          />
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            padding: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "14px",
            fontWeight: "600"
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: "12px",
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "14px",
            fontWeight: "600"
          }}>
            {success}
          </div>
        )}

        {/* Bouton Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 18px",
            background: loading ? "#9ca3af" : "linear-gradient(135deg, #4f46e5, #6150f3)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "700",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)"
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e. currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(79, 70, 229, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style. boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
          }}
        >
          {loading ? "⏳ Envoi en cours..." : "✅ Envoyer ma demande"}
        </button>
      </form>
    </div>
  );
}