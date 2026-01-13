import React from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function toFull(p) {
  if (!  p) return "";
  // Si c'est déjà une URL Firebase complète, retourne-la directement
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("/")) return `${API}${p}`;
  return `${API}/${p}`;
}

export default function ListingCard({ item }) {
  const img = item.photos?.[0] || (item.photoPaths && item.photoPaths[0]) || null;
  const imgUrl = img ? toFull(img) : null;
  const typeLabel = (String(item.type || "").toLowerCase(). includes('louer')) ? "🏠 Location" : "🏡 Vente";
  const hasVideo = !!item.videoId;

  return (
    <article 
      className="card listing-card overflow-hidden group" 
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transition: "all 0.3s cubic-bezier(0.2, 0. 9, 0.2, 1)",
        transform: "translateY(0)",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
      onMouseEnter={(e) => {
        e. currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 16px 32px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
    >
      {/* Image Container with Link */}
      <Link
        to={`/annonces/${item.id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-1"
        aria-label={`Voir les détails de ${item.title || item.adresse || "cette annonce"}`}
        style={{ textDecoration: "none" }}
      >
        <div 
          className="listing-media relative overflow-hidden" 
          style={{ height: 280, background: "#f3f4f6", position: "relative" }}
        >
          {imgUrl ?   (
            <img 
              src={imgUrl} 
              alt={item.title || item.adresse} 
              className="listing-media-img" 
              loading="lazy"
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.6s cubic-bezier(0.2, 0.9, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style. transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div 
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              📷 Pas d'image
            </div>
          )}

          {/* Overlay Gradient */}
          <div 
            className="listing-overlay"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%)",
              pointerEvents: "none"
            }}
          ></div>

          {/* Type Badge */}
          <div 
            style={{
              position: "absolute",
              left: 12,
              top: 12,
              zIndex: 10
            }}
          >
            <span 
              className="listing-badge"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #4f46e5 0%, #6150f3 100%)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                animation: "fadeInDown 0. 5s ease both"
              }}
            >
              {typeLabel}
            </span>
          </div>

          {/* Video Badge */}
          {hasVideo && (
            <div 
              style={{
                position: "absolute",
                right: 12,
                top: 12,
                zIndex: 10,
                background: "#ef4444",
                color: "white",
                padding: "6px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                animation: "fadeInDown 0.5s ease both 0.1s"
              }}
            >
              🎬 Vidéo
            </div>
          )}

          {/* CTA Button Floating */}
          <div 
            className="listing-cta"
            style={{
              position: "absolute",
              bottom: 14,
              right: 14,
              zIndex: 8,
              transform: "translateY(8px)",
              opacity: 0,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget. style.transform = "translateY(0)";
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style. transform = "translateY(8px)";
              e.currentTarget.style.opacity = "0";
            }}
          >
            <span 
              className="btn-detail"
              style={{
                display: "inline-block",
                padding: "10px 16px",
                background: "linear-gradient(90deg, #4f46e5, #6150f3)",
                color: "white",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "13px",
                boxShadow: "0 8px 20px rgba(79, 70, 229, 0.3)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              aria-hidden="true"
            >
              Voir le détail →
            </span>
          </div>
        </div>
      </Link>

      {/* Content Section */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Title and Price */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <h3 
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#111827",
                lineHeight: "1.4",
                marginBottom: "4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {item.title || item.adresse || "Annonce"}
            </h3>
            <p 
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "0"
              }}
            >
              {item.adresse || "Adresse non spécifiée"}
            </p>
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <div 
              style={{
                fontSize: "18px",
                fontWeight: "800",
                background: "linear-gradient(135deg, #4f46e5, #6150f3)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "4px"
              }}
            >
              {item.price ?   `${Number(item.price).toLocaleString('fr-FR')} TND` : "Sur demande"}
            </div>
            <div 
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                fontWeight: "500"
              }}
            >
              {item.createdAt ?   new Date(item.createdAt).  toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }) : ""}
            </div>
          </div>
        </div>

        {/* Description */}
        <p 
          style={{
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: "1.5",
            marginBottom: "12px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1
          }}
        >
          {item. descript || "Pas de description disponible"}
        </p>

        {/* Footer with features */}
        <div 
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            paddingTop: "12px",
            borderTop: "1px solid #e5e7eb"
          }}
        >
          {item.rooms && (
            <span 
              style={{
                fontSize: "12px",
                color: "#4f46e5",
                fontWeight: "600",
                background: "#eef2ff",
                padding: "4px 8px",
                borderRadius: "4px"
              }}
            >
              🏠 {item.rooms} pièce(s)
            </span>
          )}
          {hasVideo && (
            <span 
              style={{
                fontSize: "12px",
                color: "#ef4444",
                fontWeight: "600",
                background: "#fee2e2",
                padding: "4px 8px",
                borderRadius: "4px"
              }}
            >
              📹 Visite vidéo
            </span>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .listing-card {
          animation: slideIn 0.5s ease-out;
        }

        . listing-card:hover . listing-media-img {
          transform: scale(1.08) ! important;
        }

        @media (max-width: 640px) {
          .listing-card {
            margin-bottom: 12px;
          }
        }
      `}</style>
    </article>
  );
}