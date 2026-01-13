import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPropertyById } from "../../services/annonces";
import { getYouTubeEmbedUrl } from "../../services/youtube";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';

// Leaflet marker icon fix
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
  if (! p) return "";
  // Si c'est déjà une URL Firebase complète, retourne-la directement
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
  const base = `https://wa.me/${p. replace(/^\+/, '')}`;
  const encoded = encodeURIComponent(text);
  return `${base}?text=${encoded}`;
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

  useEffect(() => {
    function onKey(e) {
      if (! ann || !ann.photos || ann.photos.length <= 1) return;
      if (e.key === "ArrowLeft") setMainIndex(i => Math.max(i - 1, 0));
      if (e.key === "ArrowRight") setMainIndex(i => Math.min(i + 1, ann.photos.length - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window. removeEventListener("keydown", onKey);
  }, [ann]);

  if (loading) return <div className="p-6" style={{ paddingTop: "100px" }}>⏳ Chargement... </div>;
  if (error) return <div className="p-6 text-red-600" style={{ paddingTop: "100px" }}>❌ Erreur: {error}</div>;
  if (!ann) return <div className="p-6" style={{ paddingTop: "100px" }}>📭 Annonce introuvable</div>;

  const images = (ann.photoPaths || ann.photos || []).map(p => {
    if (! p) return null;
    // Si c'est déjà une URL Firebase complète, retourne-la directement
    if (p.startsWith("http")) return p;
    return p. startsWith("/") ? `${API}${p}` : `${API}/${p}`;
  }).filter(Boolean);

  const mainSrc = images[mainIndex] || images[0] || "";

  const rawPhone = ann.phone || ann.contactPhone || ann.agencyPhone || DEFAULT_AGENCY_PHONE;
  const telHref = `tel:${normalizePhoneForTel(rawPhone)}`;

  const currentUrl = typeof window !== "undefined" ? window. location.href : `${API}/annonces/${id}`;
  const waMessageLines = [
    `Bonjour,`,
    `Je suis intéressé(e) par cette annonce :`,
    `${ann.title || ann.adresse || `Annonce #${id}`}`,
    ann.price ?  `Prix : ${Number(ann.price).toLocaleString('fr-FR')} TND` : null,
    ann.adresse ? `Adresse : ${ann.adresse}` : null,
    ann.type ?  `Type : ${ann.type}` : null,
    `Lien : ${currentUrl}`,
    ``,
    `Merci. `
  ].filter(Boolean). join("\n");
  const waHref = buildWhatsAppLink(rawPhone, waMessageLines);

  const latNum = ann.localisation && typeof ann.localisation. lat !== 'undefined' ? Number(ann.localisation.lat) : null;
  const lngNum = ann.localisation && typeof ann.localisation.lng !== 'undefined' ? Number(ann. localisation.lng) : null;
  const hasCoords = latNum !== null && lngNum !== null && ! Number.isNaN(latNum) && !Number.isNaN(lngNum);

  // YouTube video
  const embedUrl = getYouTubeEmbedUrl(ann.videoId);

  // build a DivIcon with price badge
  const createDivIcon = (price) => {
    const priceText = price ? `${Number(price).toLocaleString('fr-FR')} TND` : '';
    const html = `
      <div class="custom-pin">
        <div class="pin-badge">${priceText}</div>
        <div class="pin-dot"></div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'custom-pin-wrapper',
      iconSize: [56, 64],
      iconAnchor: [28, 62],
      popupAnchor: [0, -60],
    });
  };

  function nextImage() {
    setMainIndex(i => Math.min(i + 1, images.length - 1));
  }

  function prevImage() {
    setMainIndex(i => Math.max(i - 1, 0));
  }

  return (
    <div className="max-w-5xl mx-auto p-6" style={{ paddingTop: "100px" }}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <button className="btn-back" onClick={() => nav(-1)}>← Retour</button>

        <div className="flex items-center gap-3">
          <a
            className="btn-primary"
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contacter via WhatsApp"
            style={{ background: "#25D366", borderRadius: 10 }}
          >
            💬 WhatsApp
          </a>

          <a
            className="btn-primary"
            href={telHref}
            aria-label="Appeler l'agence"
            style={{ background: "#0EA5A4", borderRadius: 10 }}
          >
            ☎️ Appeler
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        <div className="relative hero-wrap">
          {mainSrc ?  (
            <img
              src={mainSrc}
              alt={ann.title}
              className="w-full h-[420px] object-cover hero-image"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e) => {
                e. currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-[420px] bg-gray-100 flex items-center justify-center text-gray-400">
              📷 Pas d'image
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                className="hero-nav left"
                onClick={prevImage}
                aria-label="Précédent"
                disabled={mainIndex === 0}
              >‹</button>

              <button
                className="hero-nav right"
                onClick={nextImage}
                aria-label="Suivant"
                disabled={mainIndex === images.length - 1}
              >›</button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 0 && (
            <div style={{
              position: "absolute",
              bottom: "16px",
              right: "16px",
              background: "rgba(0, 0, 0, 0.6)",
              color: "white",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600"
            }}>
              {mainIndex + 1} / {images.length}
            </div>
          )}

          {images.length > 0 && (
            <div className="absolute bottom-4 left-6 flex gap-3 overflow-x-auto pb-2">
              {images. map((src, i) => (
                <button
                  key={i}
                  className={`thumb-btn ${i === mainIndex ?  'active' : ''}`}
                  onClick={() => setMainIndex(i)}
                  aria-label={`Voir image ${i + 1}`}
                  type="button"
                >
                  <img src={src} alt={`thumb-${i}`} crossOrigin="anonymous" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="max-w-[70%]">
              <h1 className="text-3xl font-extrabold text-gray-900">{ann.title || ann.adresse}</h1>
              <p className="text-sm text-gray-500 mt-2">{ann.adresse}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {ann.price ? `${Number(ann.price).toLocaleString('fr-FR')} TND` : "Sur demande"}
              </div>
              <div style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #4f46e5, #6150f3)",
                color: "white",
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "700",
                marginTop: "8px"
              }}>
                {ann.type || "Non spécifié"}
              </div>
            </div>
          </div>

          {/* Description */}
          {ann. descript && (
            <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">📋 Description</h3>
              <p style={{
                fontSize: "15px",
                color: "#4b5563",
                lineHeight: "1.8",
                whiteSpace: "pre-wrap"
              }}>
                {ann.descript}
              </p>
            </div>
          )}

          {/* YouTube Video Section */}
          {embedUrl && (
            <div style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                🎬 Visite vidéo
              </h2>
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
                    borderRadius: "12px"
                  }}
                  src={embedUrl}
                  title="Vidéo du bien immobilier"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {/* Location and Gallery Grid */}
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {/* Map */}
            {hasCoords && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900">📍 Localisation</h4>

                <div style={{ height: 220, width: "100%", borderRadius: 8, overflow: "hidden", marginBottom: "12px" }}>
                  <MapContainer
                    center={[latNum, lngNum]}
                    zoom={14}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile. openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <Marker position={[latNum, lngNum]} icon={createDivIcon(ann.price)}>
                      <Popup>
                        {ann.title || ann.adresse}
                        <div className="text-xs text-gray-600">{ann.type} — {ann.price ? `${Number(ann.price).toLocaleString('fr-FR')} TND` : ""}</div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>

                <div className="text-sm text-gray-600">
                  <div className="mb-2"><strong>Lat:</strong> {latNum. toFixed(6)} | <strong>Lng:</strong> {lngNum.toFixed(6)}</div>
                  <a
                    className="text-indigo-600 hover:underline font-medium"
                    href={`https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    → Ouvrir dans Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Gallery Thumbnails */}
            {images. length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900">🖼️ Galerie</h4>
                <div className="flex gap-2 flex-wrap">
                  {images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`gallery-${i}`}
                      className="w-20 h-14 object-cover rounded cursor-pointer transition-all hover:scale-110"
                      onClick={() => setMainIndex(i)}
                      crossOrigin="anonymous"
                      style={{
                        border: i === mainIndex ? "2px solid #4f46e5" : "1px solid #d1d5db"
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}