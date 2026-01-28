import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageLightbox from "./ImageLightbox";
import { getYouTubeEmbedUrl } from "../../services/youtube";
import ExportExcel from "./ExportExcel";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Barre de recherche intelligente simple
function SearchBar({ value, onChange, placeholder = "Recherche par référence, adresse, type, prix..." }) {
  return (
    <input
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="border px-4 py-2 mr-2 rounded-lg shadow-sm"
      style={{ width: 320, maxWidth: "95vw", fontSize: 15 }}
      autoComplete="off"
    />
  );
}

export default function OffresTable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const nav = useNavigate();

  // Ajout de l'état pour la recherche
  const [search, setSearch] = useState("");

  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);

  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API}/api/admin/offres`, { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Erreur ${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        setData(json);
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Erreur réseau");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    function onOffresUpdated() {
      setRefreshKey(k => k + 1);
    }
    window.addEventListener('offres:updated', onOffresUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('offres:updated', onOffresUpdated);
    };
  }, [refreshKey]);

  function formatPrice(v) {
    if (v == null) return "-";
    return Number(v).toLocaleString("fr-FR") + " TND";
  }

  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR");
  }

  function openLightboxForOffer(o, start = 0) {
    const images = (o.photoPaths || []).map(p => {
      if (!p) return "";
      if (p.startsWith("http://") || p.startsWith("https://")) return p;
      return `${API}${p}`;
    }).filter(Boolean);
    if (images.length === 0) return;
    setLbImages(images);
    setLbIndex(start);
    setLbOpen(true);
  }

  function openVideoPreview(videoId) {
    if (!videoId) return;
    const embedUrl = getYouTubeEmbedUrl(videoId);
    setVideoPreviewUrl(embedUrl);
    setVideoPreviewOpen(true);
  }

  async function togglePublish(id, current) {
    try {
      const res = await fetch(`${API}/api/admin/offres/${id}/publish`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !current })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert("Erreur: " + (e.message || e));
    }
  }

  async function deleteOffer(id) {
    if (!confirm("Supprimer cette annonce ?")) return;
    try {
      const res = await fetch(`${API}/api/admin/offres/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert("Erreur: " + (e.message || e));
    }
  }

  // Filtrage intelligent local sur les offres
  let filtered = data;
  if (data && search.trim()) {
    const q = search.toLowerCase();
    filtered = data.filter((o) =>
      (o.reference && o.reference.toLowerCase().includes(q)) ||
      (o.adresse && o.adresse.toLowerCase().includes(q)) ||
      (o.type && o.type.toLowerCase().includes(q)) ||
      (o.price && String(o.price).toLowerCase().includes(q))
    );
  }

  if (loading) return <div className="p-6">⏳ Chargement des offres…</div>;
  if (err) return <div className="p-6 text-red-600">❌ Erreur: {err}</div>;
  if (!filtered || filtered.length === 0) return <div className="p-6">📭 Aucune offre trouvée. </div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between items-start flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">Offres ({filtered.length})</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <SearchBar value={search} onChange={setSearch} />
          {/* ← BOUTON EXPORT */}
          {filtered && filtered.length > 0 && (
            <ExportExcel offres={filtered} />
          )}
        </div>
      </div>

      {/* Tableau Responsive */}
      <div style={{
        overflowX: "auto",
        borderRadius: "12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb"
      }}>
        <table style={{
          width: "100%",
          background: "white",
          borderCollapse: "collapse",
          fontSize: "15px"
        }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)", borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Référence</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Images</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Adresse</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Prix</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Type</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Vidéo</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Statut</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Date</th>
              <th style={{ padding: "16px", textAlign: "left", fontWeight: "700", color: "#1f2937", whiteSpace: "nowrap" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, idx) => (
              <tr
                key={o.id}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  transition: "background 0.2s ease, boxShadow 0.2s ease",
                  background: idx % 2 === 0 ? "#ffffff" : "#fafbfc"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f0f4ff"}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fafbfc"}
              >
                {/* Reference */}
                <td style={{ padding: "16px", color: "#374151", fontWeight: "700", fontSize: "16px" }}>
                  {o.reference || "-"}
                </td>

                {/* Images */}
                <td style={{ padding: "16px" }}>
                  <div
                    onClick={() => openLightboxForOffer(o, 0)}
                    style={{ cursor: 'pointer', display: "inline-block" }}
                  >
                    {o.photoPaths && o.photoPaths.length > 0 ? (
                      <div style={{ position: "relative" }}>
                        <img
                          src={(o.photoPaths[0].startsWith("http") ? o.photoPaths[0] : `${API}${o.photoPaths[0]}`)}
                          alt="mini"
                          style={{
                            width: 100,
                            height: 75,
                            objectFit: "cover",
                            borderRadius: 8,
                            transition: "transform 0.2s ease",
                            border: "2px solid #e5e7eb"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `${API}/uploads/placeholder.png`;
                          }}
                        />
                        {o.photoPaths.length > 1 && (
                          <div style={{
                            position: "absolute",
                            bottom: "6px",
                            right: "6px",
                            background: "rgba(0,0,0,0.8)",
                            color: "white",
                            fontSize: "13px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontWeight: "700"
                          }}>
                            +{o.photoPaths.length - 1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ width: 100, height: 75, background: "#e5e7eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                        📷
                      </div>
                    )}
                  </div>
                </td>

                {/* Adresse */}
                <td style={{ padding: "16px", color: "#4b5563", fontWeight: "500" }}>
                  <div style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.adresse || o.titre || "-"}
                  </div>
                </td>

                {/* Prix */}
                <td style={{ padding: "16px", color: "#4f46e5", fontWeight: "700", fontSize: "16px" }}>
                  {formatPrice(o.price)}
                </td>

                {/* Type */}
                <td style={{ padding: "16px" }}>
                  <span style={{
                    background: o.type === "À vendre" ? "#dbeafe" : "#dcfce7",
                    color: o.type === "À vendre" ? "#0c4a6e" : "#15803d",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    display: "inline-block"
                  }}>
                    {o.type === "À vendre" ? "🏡 Vente" : "🏠 Location"}
                  </span>
                </td>

                {/* Vidéo */}
                <td style={{ padding: "16px" }}>
                  {o.videoId ? (
                    <button
                      onClick={() => openVideoPreview(o.videoId)}
                      style={{
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        color: "white",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "700",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(239, 68, 68, 0.2)";
                      }}
                    >
                      🎬 Aperçu
                    </button>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>-</span>
                  )}
                </td>

                {/* Statut */}
                <td style={{ padding: "16px" }}>
                  <span style={{
                    background: o.published ? "#d1fae5" : "#fee2e2",
                    color: o.published ? "#065f46" : "#991b1b",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    display: "inline-block"
                  }}>
                    {o.published ? "✓ Publié" : "📝 Brouillon"}
                  </span>
                </td>

                {/* Date */}
                <td style={{ padding: "16px", color: "#6b7280", fontSize: "13px", fontWeight: "500" }}>
                  {formatDate(o.createdAt || o.created_at)}
                </td>

                {/* Actions */}
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => nav(`/admin/offres/${o.id}/edit`)}
                      style={{
                        background: "linear-gradient(135deg, #4f46e5, #6150f3)",
                        color: "white",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "700",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(79, 70, 229, 0.2)";
                      }}
                      title="Modifier cette annonce"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => togglePublish(o.id, o.published)}
                      style={{
                        background: o.published ? "linear-gradient(135deg, #f97373, #ef4444)" : "linear-gradient(135deg, #10b981, #059669)",
                        color: "white",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "700",
                        transition: "all 0.2s ease",
                        boxShadow: o.published ? "0 2px 8px rgba(249, 115, 115, 0.2)" : "0 2px 8px rgba(16, 185, 129, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = o.published ? "0 4px 12px rgba(249, 115, 115, 0.3)" : "0 4px 12px rgba(16, 185, 129, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = o.published ? "0 2px 8px rgba(249, 115, 115, 0.2)" : "0 2px 8px rgba(16, 185, 129, 0.2)";
                      }}
                      title={o.published ? "Dépublier cette annonce" : "Publier cette annonce"}
                    >
                      {o.published ? "🔒 Dépub" : "🔓 Publier"}
                    </button>
                    <button
                      onClick={() => deleteOffer(o.id)}
                      style={{
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        color: "white",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "700",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(239, 68, 68, 0.2)";
                      }}
                      title="Supprimer définitivement cette annonce"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ImageLightbox */}
      <ImageLightbox
        images={lbImages}
        startIndex={lbIndex}
        open={lbOpen}
        onClose={() => setLbOpen(false)}
      />

      {/* Video Preview Modal */}
      {videoPreviewOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 120,
            padding: "20px"
          }}
          onClick={() => setVideoPreviewOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              width: "100%",
              maxWidth: "800px",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoPreviewOpen(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "#111",
                color: "white",
                border: "none",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "20px",
                zIndex: 10
              }}
            >
              ✕
            </button>

            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden"
              }}
            >
              <iframe
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none"
                }}
                src={videoPreviewUrl}
                title="Vidéo YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* CSS Responsive */}
      <style>{`
        @media (max-width: 1024px) {
          table {
            font-size: 14px !important;
          }
          table th, table td {
            padding: 14px !important;
          }
        }
        @media (max-width: 768px) {
          table {
            font-size: 13px !important;
          }
          table th, table td {
            padding: 12px !important;
          }
          table img {
            width: 80px !important;
            height: 60px !important;
          }
          button {
            padding: 8px 10px !important;
            font-size: 12px !important;
          }
        }
        @media (max-width: 480px) {
          table {
            font-size: 12px !important;
          }
          table th, table td {
            padding: 10px ! important;
          }
          table img {
            width: 70px !important;
            height: 50px !important;
          }
          button {
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}