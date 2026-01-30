import React from "react";
import { FaPhoneAlt, FaMapMarkerAlt, FaWhatsapp, FaEnvelope, FaFacebook, FaTiktok } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function CompanyInfo() {
  const phonePrimary = "57230824";
  const phoneSecondary = "50323788";
  const whatsappNumber = "+21657230824";
  const email = "mrblackimmobilier@gmail.com";
  const facebookUrl = "https://www.facebook.com/profile.php?id=61567196025352";
  const tiktokUrl = "https://www.tiktok.com/@mr.black.immobili";

  return (
    <div className="bg-white rounded-lg shadow p-6 contact-aside">
      {/* Header avec logo */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: "12px",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
          <img src={logo} alt="logo" style={{ width: "45px", height: "45px", objectFit: "contain" }} />
        </div>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>
            Mr Black Immobilier
          </h3>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>
            Agence immobilière — Tunis
          </p>
        </div>
      </div>

      {/* Informations de contact */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        
        {/* Localisation */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaMapMarkerAlt style={{ color: "#4f46e5", fontSize: "16px", flexShrink: 0 }} />
          <span style={{ fontSize: "14px", color: "#4b5563" }}>Tunis, Tunisie</span>
        </div>

        {/* Téléphone 1 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaPhoneAlt style={{ color: "#4f46e5", fontSize: "16px", flexShrink: 0 }} />
          <a 
            href={`tel:+216${phonePrimary. replace(/\s/g, "")}`} 
            style={{ fontSize: "14px", color: "#4f46e5", textDecoration: "none", transition: "color 0.2s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#6150f3"}
            onMouseLeave={(e) => e.currentTarget. style.color = "#4f46e5"}
          >
            {phonePrimary}
          </a>
        </div>

        {/* Téléphone 2 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaPhoneAlt style={{ color: "#4f46e5", fontSize: "16px", flexShrink: 0 }} />
          <a 
            href={`tel:+216${phoneSecondary.replace(/\s/g, "")}`} 
            style={{ fontSize: "14px", color: "#4f46e5", textDecoration: "none", transition: "color 0.2s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#6150f3"}
            onMouseLeave={(e) => e.currentTarget. style.color = "#4f46e5"}
          >
            {phoneSecondary}
          </a>
        </div>

        {/* Email */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaEnvelope style={{ color: "#4f46e5", fontSize: "16px", flexShrink: 0 }} />
          <a 
            href={`mailto:${email}`} 
            style={{ fontSize: "14px", color: "#4f46e5", textDecoration: "none", transition: "color 0. 2s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#6150f3"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#4f46e5"}
          >
            {email}
          </a>
        </div>

        {/* WhatsApp */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaWhatsapp style={{ color: "#25D366", fontSize: "16px", flexShrink: 0 }} />
          <span style={{ fontSize: "14px", color: "#4b5563" }}>
            <strong>WhatsApp:</strong> {whatsappNumber}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#e5e7eb", margin: "6px 0" }}></div>

        {/* Réseaux sociaux */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Facebook */}
          <a 
            href={facebookUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: "#1877F2",
              textDecoration: "none",
              padding: "8px 10px",
              borderRadius: "6px",
              transition: "all 0.2s ease",
              background: "transparent"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0f4ff";
              e.currentTarget. style.color = "#0c63e4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style. background = "transparent";
              e.currentTarget.style.color = "#1877F2";
            }}
          >
            <FaFacebook style={{ fontSize: "18px", flexShrink: 0 }} />
            <span style={{ fontWeight: "600" }}>Facebook</span>
          </a>

          {/* TikTok */}
          <a 
            href={tiktokUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: "#000000",
              textDecoration: "none",
              padding: "8px 10px",
              borderRadius: "6px",
              transition: "all 0. 2s ease",
              background: "transparent"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "f0f0f0";
              e.currentTarget.style.color = "#333333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#000000";
            }}
          >
            <FaTiktok style={{ fontSize: "18px", flexShrink: 0 }} />
            <span style={{ fontWeight: "600" }}>TikTok</span>
          </a>
        </div>
      </div>

      {/* Bouton Contactez-nous */}
      <div style={{ marginTop: "20px" }}>
        <Link 
          to="/contact" 
          style={{
            display: "block",
            textAlign: "center",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #4f46e5, #6150f3)",
            color: "white",
            fontWeight: "700",
            fontSize: "14px",
            textDecoration: "none",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget. style.transform = "translateY(-2px)";
            e.currentTarget.style.  boxShadow = "0 6px 16px rgba(79, 70, 229, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style. boxShadow = "0 4px 12px rgba(79, 70, 229, 0.2)";
          }}
        >
          📞 Contactez-nous
        </Link>
      </div>
    </div>
  );
}