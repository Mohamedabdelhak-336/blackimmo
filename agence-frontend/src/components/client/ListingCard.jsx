import React from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function toFull(p) {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("/")) return `${API}${p}`;
  return `${API}/${p}`;
}

function formatType(type) {
  if (!type) return "";
  return type.toLowerCase().includes("louer") ? "Location" : "Vente";
}

export default function ListingCard({ item }) {
  const img = item.photos?.[0] || (item.photoPaths && item.photoPaths[0]) || null;
  const imgUrl = img ? toFull(img) : null;
  const typeLabel = formatType(item.type);
  const typeColor =
    typeLabel === "Location"
      ? { bg: "#dcfce7", color: "#166534" }
      : { bg: "#dbeafe", color: "#1e40af" };

  return (
    <article
      className="card listing-card"
      style={{
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.11)",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
        overflow: "hidden",
        minHeight: 270
      }}
    >
      <Link
        to={`/annonces/${item.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        {/* Image principale ou placeholder */}
        <div style={{ position: "relative", width: "100%", height: 210, background: "#f1f5f9" }}>
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={item.title || item.adresse || ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.3s"
              }}
              loading="lazy"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                color: "#a3a3a3"
              }}
            >
              📷 Pas d'image
            </div>
          )}

          {/* Référence en badge */}
          {item.reference && (
            <span
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                background: "#f9fafb",
                color: "#3730a3",
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 8,
                padding: "5px 14px",
                boxShadow: "0 2px 10px #0002"
              }}
            >
              {item.reference}
            </span>
          )}

          {/* Type en badge */}
          {typeLabel && (
            <span
              style={{
                position: "absolute",
                right: 12,
                top: 12,
                background: typeColor.bg,
                color: typeColor.color,
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 8,
                padding: "5px 14px",
                boxShadow: "0 2px 10px #0002"
              }}
            >
              {typeLabel}
            </span>
          )}
        </div>

        {/* Contenu principal */}
        <div style={{ padding: "15px 17px 10px 17px" }}>
          {/* Adresse (toujours présente) */}
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 15, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.adresse || "Adresse non spécifiée"}
          </div>

          {/* Prix */}
          <div style={{ color: "#4f46e5", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
            {item.price ? `${Number(item.price).toLocaleString("fr-FR")} TND` : "Sur demande"}
          </div>
        </div>
      </Link>
      {/* Styles responsives pour mobile */}
      <style>{`
        .listing-card:hover {
          box-shadow: 0 8px 28px rgba(79,70,229,0.15);
          transform: translateY(-5px) scale(1.01);
        }
        @media (max-width: 640px) {
          .listing-card {
            min-width: 95vw;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </article>
  );
}