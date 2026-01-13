import React, { useState } from "react";
import { FaPhoneAlt, FaEnvelope, FaWhatsapp, FaMapMarkerAlt, FaFacebook, FaTiktok } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Contact() {
  const phonePrimary = "57230824";
  const phoneSecondary = "50323788";
  const whatsappNumber = "+21657230824";
  const email = "mrblackimmobilier@gmail.com";
  const address = "Tunis, Tunisie";
  const facebookUrl = "https://www.facebook. com/profile.php?id=61567196025352";
  const tiktokUrl = "https://www.tiktok.com/@mr.black.immobili";

  // State du formulaire demande
  const [formData, setFormData] = useState({
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Gère les changements du formulaire
  function handleChange(e) {
    const { name, value } = e. target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  // Soumet le formulaire
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

      // Validation du type logement si "vendre"
      if (formData.typeService === "vendre" && !formData.typeLogement) {
        throw new Error("Le type de logement est obligatoire");
      }

      const response = await fetch(`${API}/api/demandes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          numTel: formData. numTel,
          localisation: formData.localisation,
          typeService: formData.typeService,
          maxBudget: formData.maxBudget ?  Number(formData.maxBudget) : null,
          typeLogement: formData.typeLogement,
          marie: formData.marie,
          nombreFamille: formData.nombreFamille ?  Number(formData.nombreFamille) : null,
          description: formData.description
        })
      });

      const result = await response.json();

      if (! response.ok) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      setSuccess("✅ Votre demande a été envoyée avec succès !  Nous vous contacterons bientôt.");
      
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

      // Cache le message après 5 secondes
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(`❌ Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulaire GAUCHE */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">💬 Soumettre une demande</h2>
          <p className="text-gray-600 mb-6">Remplissez le formulaire ci-dessous et nous vous contacterons rapidement avec les meilleures offres.</p>

          <form onSubmit={handleSubmit}>
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-600 text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-sm font-600 text-gray-700 mb-2">Prénom *</label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Votre prénom"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-gray-700 mb-2">Téléphone *</label>
              <input
                type="tel"
                name="numTel"
                value={formData.numTel}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+216 XX XXX XXX"
              />
            </div>

            {/* Localisation */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-gray-700 mb-2">Localisation</label>
              <input
                type="text"
                name="localisation"
                value={formData.localisation}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Tunis, Lac 1"
              />
            </div>

            {/* Type Service - MODIFIÉ AVEC 3 OPTIONS */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-gray-700 mb-2">Que cherchez-vous ?  *</label>
              <select
                name="typeService"
                value={formData.typeService}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="location">🏠 Louer un logement</option>
                <option value="achat">🛒 Acheter un logement</option>
                <option value="vendre">💰 Vendre ma propriété</option>
              </select>
            </div>

            {/* Budget Max - Label dynamique */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-gray-700 mb-2">
                {formData.typeService === "vendre" ?  "Prix de vente (TND) *" : "Budget maximum (TND)"}
              </label>
              <input
                type="number"
                name="maxBudget"
                value={formData. maxBudget}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  formData.typeService === "vendre" && !formData.maxBudget
                    ? "border-red-500 bg-yellow-50"
                    : "border-gray-300"
                }`}
                placeholder={formData.typeService === "vendre" ? "Ex: 150000" : "Ex: 2500"}
                required={formData.typeService === "vendre"}
              />
              {formData.typeService === "vendre" && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Entrez le montant auquel vous souhaitez vendre votre propriété
                </p>
              )}
            </div>

            {/* Type Logement - AFFICHE SI "VENDRE" */}
            {formData.typeService === "vendre" && (
              <div className="mb-4">
                <label className="block text-sm font-600 text-gray-700 mb-2">Type de logement *</label>
                <select
                  name="typeLogement"
                  value={formData.typeLogement}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Sélectionnez --</option>
                  <option value="S+1">S+1</option>
                  <option value="S+2">S+2</option>
                  <option value="S+3">S+3</option>
                  <option value="villa">Villa</option>
                  <option value="appartement">Appartement</option>
                </select>
              </div>
            )}

            {/* Type Logement - AFFICHE SI PAS "VENDRE" */}
            {formData.typeService !== "vendre" && (
              <div className="mb-4">
                <label className="block text-sm font-600 text-gray-700 mb-2">Type de logement</label>
                <select
                  name="typeLogement"
                  value={formData.typeLogement}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="S+1">S+1</option>
                  <option value="S+2">S+2</option>
                  <option value="S+3">S+3</option>
                  <option value="villa">Villa</option>
                  <option value="appartement">Appartement</option>
                </select>
              </div>
            )}

            {/* Marié et Nombre Famille - MASQUÉ SI "VENDRE" */}
            {formData.typeService !== "vendre" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-600 text-gray-700 mb-2">Êtes-vous marié(e) ?</label>
                    <select
                      name="marie"
                      value={formData.marie}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Sélectionnez --</option>
                      <option value="oui">✅ Oui</option>
                      <option value="non">❌ Non</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-600 text-gray-700 mb-2">Nombre de famille</label>
                    <input
                      type="number"
                      name="nombreFamille"
                      value={formData.nombreFamille}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ex: 4"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-gray-700 mb-2">
                {formData.typeService === "vendre" ? "Description de votre propriété" : "Description / Remarques"}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="4"
                placeholder={formData.typeService === "vendre" ? "Décrivez votre propriété (nombre de pièces, état, équipements... )" : "Décrivez vos besoins ou remarques... "}
              ></textarea>
            </div>

            {/* Messages d'erreur/succès */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded font-medium">
                {success}
              </div>
            )}

            {/* Bouton Envoyer */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "⏳ Envoi en cours..." : "✅ Envoyer ma demande"}
            </button>
          </form>
        </div>

        {/* COORDONNÉES DROITE */}
        <aside className="contact-aside bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📞 Coordonnées</h3>

          <div className="flex items-center gap-3 mb-4">
            <FaMapMarkerAlt className="text-red-500 text-lg flex-shrink-0" />
            <span className="text-gray-700">{address}</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <FaPhoneAlt className="text-indigo-600 text-lg flex-shrink-0" />
            <a href={`tel:+216${phonePrimary. replace(/\s/g, "")}`} className="text-indigo-600 font-medium hover:underline break-words">
              {phonePrimary}
            </a>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <FaPhoneAlt className="text-indigo-600 text-lg flex-shrink-0" />
            <a href={`tel:+216${phoneSecondary.replace(/\s/g, "")}`} className="text-indigo-600 font-medium hover:underline break-words">
              {phoneSecondary}
            </a>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <FaEnvelope className="text-blue-500 text-lg flex-shrink-0" />
            <a href={`mailto:${email}`} className="text-blue-600 font-medium hover:underline break-words">
              {email}
            </a>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <FaWhatsapp className="text-green-500 text-lg flex-shrink-0" />
            <span className="text-gray-700 font-medium">{whatsappNumber}</span>
          </div>

          <div className="mb-6">
            <a 
              href={`https://wa.me/${whatsappNumber. replace(/\+| /g, "")}`} 
              target="_blank" 
              rel="noreferrer" 
              className="block text-center px-4 py-3 rounded bg-green-500 text-white font-semibold hover:bg-green-600 transition shadow-md"
            >
              💬 Ouvrir WhatsApp
            </a>
          </div>

          {/* Social Links */}
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "24px", marginTop: "24px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>
              🌐 Nous suivre
            </h4>
            
            <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <a 
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                style={{ 
                  textDecoration: "none", 
                  transition: "transform 0.3s ease",
                  display: "inline-block"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
                onMouseLeave={(e) => e.currentTarget. style.transform = "scale(1)"}
                title="Suivez-nous sur Facebook"
              >
                <FaFacebook size={48} color="#1877F2" />
              </a>

              <a 
                href={tiktokUrl}
                target="_blank"
                rel="noreferrer"
                style={{ 
                  textDecoration: "none", 
                  transition: "transform 0.3s ease",
                  display: "inline-block"
                }}
                onMouseEnter={(e) => e. currentTarget.style.transform = "scale(1.2)"}
                onMouseLeave={(e) => e.currentTarget.style. transform = "scale(1)"}
                title="Suivez-nous sur TikTok"
              >
                <FaTiktok size={48} color="#000000" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}