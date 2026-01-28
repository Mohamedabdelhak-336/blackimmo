import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPropertyById } from "../../services/annonces";
import { getYouTubeEmbedUrl } from "../../services/youtube";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEFAULT_AGENCY_PHONE = import.meta.env.VITE_AGENCY_PHONE || "+21657230824";

function toFullUrl(p) {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("/")) return `${API}${p}`;
  return `${API}/${p}`;
}

function normalizePhoneForTel(p) {
  if (!p) return "";
  return p.replace(/[^\d+]/g, '');
}

function buildWhatsAppLink(phone, text) {
  const p = normalizePhoneForTel(phone);
  const base = `https://wa.me/${p.replace(/^\+/, '')}`;
  const encoded = encodeURIComponent(text);
  return `${base}?text=${encoded}`;
}

function formatType(type) {
  if (!type) return "";
  if (type.toLowerCase().includes('louer')) return { label: "Location", color: "#16a34a", bg: "#dcfce7" };
  return { label: "Vente", color: "#2563eb", bg: "#dbeafe" };
}

export default function ListingDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ann, setAnn] = useState(null);
  const [error, setError] = useState("");
  const [mainIndex, setMainIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchPropertyById(id);
        if (mounted) {
          setAnn(data);
          setMainIndex(0);
        }
      } catch (e) {
        if (mounted) setError(e.message || "Erreur");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="p-6" style={{ paddingTop: "100px" }}>⏳ Chargement... </div>;
  if (error) return <div className="p-6 text-red-600" style={{ paddingTop: "100px" }}>❌ Erreur: {error}</div>;
  if (!ann) return <div className="p-6" style={{ paddingTop: "100px" }}>📭 Annonce introuvable</div>;

  const images = (ann.photoPaths || ann.photos || []).map(p => toFullUrl(p)).filter(Boolean);
  const mainSrc = images[mainIndex] || images[0] || "";
  const typeDisplay = formatType(ann.type);
  const dateString = ann.createdAt
    ? new Date(ann.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
    : "";
  const rawPhone = ann.phone || ann.contactPhone || ann.agencyPhone || DEFAULT_AGENCY_PHONE;
  const telHref = `tel:${normalizePhoneForTel(rawPhone)}`;

  const currentUrl = typeof window !== "undefined" ? window.location.href : `${API}/annonces/${id}`;
  const waMessageLines = [
    `Bonjour,`,
    `Je suis intéressé(e) par cette annonce :`,
    (ann.reference ? `Référence : ${ann.reference}` : null),
    ann.title || ann.adresse || `Annonce #${id}`,
    ann.price ? `Prix : ${Number(ann.price).toLocaleString('fr-FR')} TND` : null,
    ann.adresse ? `Adresse : ${ann.adresse}` : null,
    ann.type ? `Type : ${ann.type}` : null,
    `Lien : ${currentUrl}`,
    ``,
    `Merci. `
  ].filter(Boolean).join("\n");
  const waHref = buildWhatsAppLink(rawPhone, waMessageLines);

  const latNum = ann.localisation && typeof ann.localisation.lat !== 'undefined' ? Number(ann.localisation.lat) : null;
  const lngNum = ann.localisation && typeof ann.localisation.lng !== 'undefined' ? Number(ann.localisation.lng) : null;
  const hasCoords = latNum !== null && lngNum !== null && !Number.isNaN(latNum) && !Number.isNaN(lngNum);
  const embedUrl = getYouTubeEmbedUrl(ann.videoId);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8" style={{ paddingTop: "90px" }}>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button className="btn-back" style={{ fontSize: 17, color: '#4f46e5' }} onClick={() => nav(-1)}>← Retour</button>
        <div className="flex gap-2">
          <a
            className="btn"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#25D366",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 9,
              padding: "10px 22px",
              fontSize: 16
            }}
          >💬 WhatsApp</a>
          <a
            className="btn"
            href={telHref}
            style={{
              background: "#0EA5A4",
              color: "#fff",
              fontWeight: 700,
              borderRadius: 9,
              padding: "10px 22px",
              fontSize: 16
            }}
          >📞 Appeler</a>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Galerie et infos principales */}
        <div className="flex flex-col lg:flex-row gap-0">
          {/* Images */}
          <div style={{ flex: 2, minWidth: 0 }}>
            <div className="relative" style={{ background: "#f3f4f6" }}>
              {mainSrc ? (
                <img
                  src={mainSrc}
                  alt={ann.title || ann.adresse}
                  className="w-full object-cover"
                  style={{ height: 320, maxHeight: "58vw", minHeight: 190, borderBottom: "1px solid #eee" }}
                  loading="lazy"
                />
              ) : (
                <div className="w-full flex items-center justify-center text-gray-400" style={{ height: 300 }}>
                  📷 Pas d'image
                </div>
              )}
              {/* Badges Overlay */}
              <div style={{ position: "absolute", top: 18, left: 18, display: "flex", gap: 8, zIndex: 3 }}>
                {ann.reference && (
                  <span style={{
                    background: "#f9fafb", color: "#3b82f6", fontWeight: 800, fontSize: 14, borderRadius: 8, padding: "4px 12px", border: "1.5px solid #dbeafe"
                  }}>
                    Ref: {ann.reference}
                  </span>
                )}
                {typeDisplay.label && (
                  <span style={{
                    background: typeDisplay.bg, color: typeDisplay.color, fontWeight: 700, fontSize: 14, borderRadius: 8, padding: "4px 12px"
                  }}>
                    {typeDisplay.label}
                  </span>
                )}
              </div>
              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", fontSize: 30, color: "#fff", background: "rgba(0,0,0,0.22)", border: "none", borderRadius: "0 12px 12px 0", width: 36, height: 54, cursor: "pointer", zIndex: 2 }}
                    onClick={() => setMainIndex(i => Math.max(0, i - 1))}
                    disabled={mainIndex === 0}
                  >‹</button>
                  <button
                    style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", fontSize: 30, color: "#fff", background: "rgba(0,0,0,0.22)", border: "none", borderRadius: "12px 0 0 12px", width: 36, height: 54, cursor: "pointer", zIndex: 2 }}
                    onClick={() => setMainIndex(i => Math.min(images.length - 1, i + 1))}
                    disabled={mainIndex === images.length - 1}
                  >›</button>
                </>
              )}
              {/* Compteur d'image */}
              {images.length > 0 && (
                <div style={{
                  position: "absolute",
                  bottom: 16,
                  right: 18,
                  background: "rgba(0,0,0,0.72)",
                  color: "#fff",
                  borderRadius: "18px",
                  fontSize: "13px",
                  padding: "4px 12px",
                  fontWeight: 600,
                  zIndex: 3
                }}>
                  {mainIndex + 1}/{images.length}
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 px-4 py-3 bg-gray-50">
                {images.map((src, i) => (
                  <img key={i}
                    src={src}
                    alt={`Thumbnail ${i}`}
                    onClick={() => setMainIndex(i)}
                    className="rounded-lg cursor-pointer"
                    style={{
                      border: i === mainIndex ? "3px solid #4f46e5" : "1.5px solid #eaeaea",
                      width: 62,
                      height: 48,
                      objectFit: "cover",
                      opacity: i === mainIndex ? 1 : 0.72,
                      boxShadow: i === mainIndex ? "0 2px 10px #4f46e554" : "none"
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Infos principales */}
          <div style={{ flex: 3, minWidth: 0, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h1 className="font-extrabold" style={{ fontSize: 27, color: "#18181b" }}>{ann.title || ann.adresse || "Annonce"}</h1>
            <div className="text-md text-gray-500 mb-2">{ann.adresse}</div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              {ann.surface ? <span style={{ fontWeight: 600, color: "#1e293b", background: "#f1f5f9", borderRadius: 6, padding: "4px 9px", fontSize: 13 }}>📏 {ann.surface} m²</span> : null}
              {ann.rooms ? <span style={{ fontWeight: 600, color: "#4f46e5", background: "#eef2ff", borderRadius: 6, padding: "4px 9px", fontSize: 13 }}>🛏️ {ann.rooms} pièces</span> : null}
              {ann.reference && <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 15 }}>Ref: {ann.reference}</span>}
              {dateString && <span style={{ color: "#767676", fontSize: 14 }}>{dateString}</span>}
            </div>
            <div style={{ fontSize: 23, fontWeight: 900, color: "#4f46e5", marginTop: 18 }}>
              {ann.price ? `${Number(ann.price).toLocaleString("fr-FR")} TND` : "Sur demande"}
            </div>
            {ann.type && (
              <span style={{
                background: typeDisplay.bg,
                color: typeDisplay.color,
                fontWeight: 800,
                marginTop: 10,
                fontSize: 15,
                borderRadius: 8,
                padding: "5px 15px"
              }}>{typeDisplay.label}</span>
            )}
          </div>
        </div>

        {/* Description */}
        {ann.descript && (
          <div className="px-4 md:px-8 py-7" style={{ borderTop: "1.5px solid #eaeaea" }}>
            <h3 style={{ fontSize: "19px", fontWeight: 600, color: "#222", marginBottom: 7 }}>Description</h3>
            <div style={{
              color: "#484848", fontSize: 16, lineHeight: "1.8", whiteSpace: "pre-wrap", wordBreak: "break-word"
            }}>{ann.descript}</div>
          </div>
        )}

        <div className="px-4 md:px-8 py-7 flex flex-col md:flex-row gap-8" style={{ borderTop: "1.5px solid #eaeaea" }}>
          {/* Galerie - reaffiche ? */}
          {images.length > 1 && (
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 700, marginBottom: 10, color: "#333" }}>Galerie photos</h4>
              <div className="flex flex-wrap gap-3">
                {images.map((src, i) => (
                  <img key={i}
                    src={src}
                    alt={`Thumb gal-${i}`}
                    style={{
                      borderRadius: 6,
                      width: 68,
                      height: 54,
                      objectFit: "cover",
                      border: i === mainIndex ? "2.7px solid #4f46e5" : "1.5px solid #eee",
                      cursor: "pointer"
                    }}
                    onClick={() => setMainIndex(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Carte */}
          {hasCoords && (
            <div style={{ flex: 1, minWidth: 210 }}>
              <h4 style={{ fontWeight: 700, marginBottom: 10, color: "#333" }}>Localisation</h4>
              <div style={{ borderRadius: 11, overflow: "hidden", marginBottom: 7 }}>
                <MapContainer
                  center={[latNum, lngNum]}
                  zoom={14}
                  scrollWheelZoom={false}
                  style={{ height: 180, width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[latNum, lngNum]}>
                    <Popup>
                      {ann.title || ann.adresse}
                      <div className="text-xs text-gray-600">{ann.type} — {ann.price ? `${Number(ann.price).toLocaleString('fr-FR')} TND` : ""}</div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <a
                className="text-indigo-600 hover:underline font-medium"
                href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`}
                target="_blank"
                rel="noopener noreferrer"
              >→ Voir dans Google Maps</a>
            </div>
          )}
        </div>

        {/* Vidéo YouTube */}
        {embedUrl && (
          <div className="px-4 md:px-8 py-7" style={{ borderTop: "1.5px solid #eaeaea" }}>
            <h3 style={{ fontWeight: 600, fontSize: 17, color: "#222", marginBottom: "15px" }}>🎬 Visite vidéo</h3>
            <div style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              borderRadius: "12px",
              background: "#000"
            }}>
              <iframe
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: "14px"
                }}
                src={embedUrl}
                title="Vidéo du bien immobilier"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
      {/* Style mobile rapide */}
      <style>{`
        @media (max-width: 700px) {
          .flex-col, .flex-col-lg {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}