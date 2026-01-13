import React from "react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import logo from "../assets/logo.png"; // <-- ajoute ceci
/**
 * Luxe AgencyInfo component (final)
 * - Uses react-icons for social icons (Instagram / Facebook / TikTok)
 * - Clean, luxury styling
 * - RTL support for the Arabic tagline
 *
 * Drop this file at src/components/AgencyInfo.jsx and import it where needed.
 */

/* Replace these values with your real data if needed */
const phone1 = "+21657230824";
const phone2 = "50 323 788";
const insta = "https://www.instagram.com/mr.blackimmobilier/";
const fb = "https://www.facebook.com/profile.php?id=61567196025352";
const tiktok = "https://www.tiktok.com/@mr.black.immobili";
const address =
  "67 RUE ECHEM ETG1 1002 TUNIS, HEDICHAKER, BAB EL BHAR, Tunis, Tunisia 1002";
const coords = "36.815090, 10.181598";
const coordsMapUrl = "https://maps.google.com/?q=36.815090,10.181598";
const tagline =
  "Un guide complet des services immobiliers qui vous accompagne à chaque étape de votre parcours immobilier… Ici, où la construction et la prospérité illimitée abondent.🏘️🔑";

export default function AgencyInfo() {
  // Use the exact maps URL requested
  const mapsUrl = coordsMapUrl;

  return (
    <div
      style={{
        display: "flex",
        gap: 28,
        alignItems: "flex-start",
        padding: 26,
        background: "linear-gradient(180deg,#fffdfc, #fbfbfb)",
        borderRadius: 14,
        border: "1px solid rgba(11,18,32,0.06)",
        boxShadow: "0 30px 80px rgba(12,18,25,0.08)",
        color: "#071029",
        fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
      }}
      aria-label="À propos de l'agence"
    >
      {/* Left column */}
      <div style={{ flex: 1, minWidth: 320 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, rgba(11,18,32,0.95), rgba(30,36,52,0.95))",
              boxShadow: "0 12px 40px rgba(11,18,32,0.18)",
              border: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            {/* replace with your logo path */}
            <img
              src={logo}
              alt="Mr Black Immobilier"
              style={{
                width: 72,
                height: 72,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "-0.6px",
                color: "#071029",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Mr Black Immobilier
            </h3>
            <div
              style={{
                marginTop: 6,
                color: "#7b8794",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
              }}
            >
              Agence immobilière — Tunis
            </div>
          </div>
        </div>

        {/* Tagline (RTL) */}
        <div
          dir="rtl"
          style={{
            marginTop: 18,
            background:
              "linear-gradient(90deg, rgba(198,160,88,0.06), rgba(79,70,229,0.02))",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid rgba(11,18,32,0.03)",
            color: "#0b1220",
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          {tagline}
        </div>

        {/* Address */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <div style={{ color: "#c59d5f", fontWeight: 900, marginTop: 2 }}>
            Adresse
          </div>
          <div style={{ color: "#122033", fontWeight: 700, lineHeight: 1.35 }}>
            {address}
            <div style={{ marginTop: 8 }}>
              <div style={{ marginBottom: 6, color: "#495663", fontWeight: 600 }}>
                Coordonnées : {coords}
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#0f4ce8",
                  fontWeight: 800,
                  textDecoration: "none",
                  background: "transparent",
                }}
              >
                📍 Voir sur Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Contact buttons */}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <a
            href={`tel:${phone1}`}
            style={{
              display: "inline-flex",
              gap: 12,
              alignItems: "center",
              padding: "12px 18px",
              background: "#071029",
              color: "#fff",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 900,
              boxShadow: "0 12px 34px rgba(7,16,41,0.18)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#c59d5f",
                alignItems: "center",
                justifyContent: "center",
                color: "#071029",
                fontWeight: 900,
                boxShadow: "inset 0 -6px 12px rgba(0,0,0,0.05)",
              }}
            >
              📞
            </span>
            <span style={{ fontSize: 15 }}>{phone1}</span>
          </a>

          <a
            href={`tel:${phone2}`}
            style={{
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
              padding: "12px 16px",
              background: "#fff8f0",
              color: "#8c4a16",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 900,
              border: "1px solid rgba(140,74,22,0.06)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "#fff",
                alignItems: "center",
                justifyContent: "center",
                color: "#8c4a16",
              }}
            >
              📱
            </span>
            <span style={{ fontSize: 15 }}>{phone2}</span>
          </a>

          <a
            href={`https://wa.me/${phone1.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
              padding: "12px 16px",
              background: "linear-gradient(90deg,#19c96f,#12a94f)",
              color: "#fff",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 900,
              boxShadow: "0 10px 28px rgba(18,169,79,0.16)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#fff",
                alignItems: "center",
                justifyContent: "center",
                color: "#12a94f",
                fontWeight: 900,
              }}
            >
              💬
            </span>
            <span style={{ fontSize: 15 }}>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Right column: Social */}
      <aside style={{ width: 260, minWidth: 220 }}>
        <div
          style={{
            padding: 18,
            borderRadius: 12,
            background: "linear-gradient(180deg,#fff,#fbfbfb)",
            border: "1px solid rgba(7,16,41,0.03)",
            boxShadow: "0 10px 30px rgba(7,16,41,0.04)",
          }}
        >
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#071029" }}>
            Réseaux sociaux
          </h4>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Instagram */}
            <a
              href={insta}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background:
                  "linear-gradient(90deg,#c83b74 0%, #db3c78 40%, #f9678b 100%)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 800,
                boxShadow: "0 10px 26px rgba(219,60,120,0.12)",
              }}
            >
              <SiInstagram style={{ width: 18, height: 18, flex: "0 0 18px" }} />
              <span>Instagram</span>
            </a>

            {/* Facebook */}
            <a
              href={fb}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "linear-gradient(90deg,#1877F2,#2A65F2)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 800,
                boxShadow: "0 10px 26px rgba(24,119,242,0.12)",
              }}
            >
              <SiFacebook style={{ width: 18, height: 18, flex: "0 0 18px" }} />
              <span>Facebook</span>
            </a>

            {/* TikTok */}
            <a
              href={tiktok}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#0b0b0b",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 800,
                boxShadow: "0 10px 26px rgba(11,11,11,0.12)",
              }}
            >
              <SiTiktok style={{ width: 18, height: 18, flex: "0 0 18px" }} />
              <span>TikTok</span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}