import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extractYouTubeId } from "../../services/youtube";

// API base (vite env or fallback)
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function toFullUrl(p) {
  if (! p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (p.startsWith("/")) return `${API}${p}`;
  return `${API}/${p}`;
}

export default function EditOffer() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ann, setAnn] = useState(null);

  // form fields
  const [adresse, setAdresse] = useState("");
  const [descript, setDescript] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("À vendre");
  const [published, setPublished] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [videoUrl, setVideoUrl] = useState("");        // ← NOUVEAU
  const [videoId, setVideoId] = useState("");          // ← NOUVEAU
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [replacePhotos, setReplacePhotos] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${API}/api/admin/offres/${id}`, { credentials: "include" });
        if (!res. ok) {
          const b = await res.json(). catch(()=>({}));
          throw new Error(b.error || `Erreur ${res.status}`);
        }
        const json = await res.json();
        if (! mounted) return;
        setAnn(json);
        setAdresse(json.adresse || "");
        setDescript(json. descript || "");
        setPrice(json.price != null ? String(json.price) : "");
        setType(json.type || "À vendre");
        setPublished(!! json.published);
        setLat(json.localisation?.lat ??  "");
        setLng(json.localisation?.lng ?? "");
        setVideoUrl(json.videoUrl || "");              // ← NOUVEAU
        setVideoId(json.videoId || "");                // ← NOUVEAU
        setExistingPhotos(json.photoPaths || []);
      } catch (e) {
        setError(e.message || "Erreur");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    return () => newPreviews.forEach(u => URL.revokeObjectURL(u));
  }, [newPreviews]);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []). slice(0, 6);
    setNewPhotos(files);
    setNewPreviews(files.map(f => URL.createObjectURL(f)));
  }

  // ← NOUVEAU : Gère le changement de l'URL YouTube
  function handleVideoUrlChange(e) {
    const url = e.target.value;
    setVideoUrl(url);
    setVideoId(extractYouTubeId(url)); // Extrait automatiquement l'ID
  }

  function handleBack() {
    nav("/admin/dashboard");
  }

  async function removeExistingPhoto(index) {
    const pathToRemove = existingPhotos[index];
    if (! pathToRemove) return;

    if (! confirm('Supprimer définitivement cette photo ?')) return;

    // Optimistic UI
    const prev = [... existingPhotos];
    const newList = prev.slice();
    newList.splice(index, 1);
    setExistingPhotos(newList);

    try {
      const res = await fetch(`${API}/api/admin/offres/${id}/photo`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoPath: pathToRemove })
      });
      const json = await res.json();
      if (! res.ok) {
        setExistingPhotos(prev);
        throw new Error(json.error || `Erreur ${res. status}`);
      }

      if (json.annonce && Array.isArray(json.annonce. photoPaths)) {
        setExistingPhotos(json.annonce.photoPaths);
      }
      try { window.dispatchEvent(new Event('offres:updated')); } catch(e){}

    } catch (err) {
      alert("Erreur suppression photo : " + (err.message || err));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const form = new FormData();
      form.append('adresse', adresse);
      form. append('descript', descript);
      form.append('price', price);
      form.append('type', type);
      form. append('published', published ?  'true' : 'false');
      
      // Localisation
      if (lat) form.append('lat', String(lat));
      if (lng) form.append('lng', String(lng));
      
      // ← NOUVEAU : Ajoute les infos vidéo YouTube
      if (videoUrl) form.append('videoUrl', videoUrl);
      if (videoId) form.append('videoId', videoId);
      
      // Photos
      newPhotos.forEach(f => form.append('photos', f));

      const url = `${API}/api/admin/offres/${id}` + (replacePhotos ? '?replacePhotos=true' : '');
      const res = await fetch(url, {
        method: "PUT",
        credentials: "include",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      
      alert("Annonce mise à jour avec succès !");
      try { window.dispatchEvent(new Event('offres:updated')); } catch(e){}
      nav("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Erreur réseau");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">Erreur: {error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Modifier l'annonce #{id}</h2>
        <button onClick={handleBack} className="btn-back" aria-label="Retour au dashboard">← Retour</button>
      </div>

      {error && <div className="error-alert mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        {/* Adresse */}
        <label className="block">
          <div className="label">Adresse</div>
          <input 
            className="input-field w-full" 
            value={adresse} 
            onChange={e => setAdresse(e.target.value)} 
          />
        </label>

        {/* Description */}
        <label className="block">
          <div className="label">Description</div>
          <textarea 
            className="input-field w-full h-28" 
            value={descript} 
            onChange={e => setDescript(e.target. value)} 
          />
        </label>

        {/* Prix et Type */}
        <div className="grid grid-cols-2 gap-4">
          <label>
            <div className="label">Prix (TND)</div>
            <input 
              className="input-field w-full" 
              type="number"
              value={price} 
              onChange={e => setPrice(e.target.value)} 
            />
          </label>
          <label>
            <div className="label">Type</div>
            <select 
              className="input-field w-full" 
              value={type} 
              onChange={e => setType(e.target.value)}
            >
              <option value="À vendre">À vendre</option>
              <option value="À louer">À louer</option>
            </select>
          </label>
        </div>

        {/* Localisation */}
        <div className="grid grid-cols-2 gap-4">
          <label>
            <div className="label">Latitude</div>
            <input 
              className="input-field w-full" 
              type="number"
              value={lat} 
              onChange={e=>setLat(e.target. value)}
              step="0.0001"
            />
          </label>
          <label>
            <div className="label">Longitude</div>
            <input 
              className="input-field w-full" 
              type="number"
              value={lng} 
              onChange={e=>setLng(e.target. value)}
              step="0. 0001"
            />
          </label>
        </div>

        {/* ← NOUVEAU : Vidéo YouTube */}
        <div>
          <div className="label mb-2">Vidéo YouTube (Optionnel)</div>
          <input
            type="text"
            value={videoUrl}
            onChange={handleVideoUrlChange}
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            className="input-field w-full"
          />
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            📹 Exemple : https://www.youtube.com/watch?v=dQw4w9WgXcQ
          </p>
          {videoId && (
            <p style={{ fontSize: "12px", color: "#10b981", marginTop: "4px" }}>
              ✅ ID extrait : {videoId}
            </p>
          )}
        </div>

        {/* Photos */}
        <div>
          <div className="label mb-2">Photos existantes</div>
          {existingPhotos.length === 0 && <div className="p-2 text-sm text-gray-500">Aucune</div>}
          <div className="grid grid-cols-3 gap-2">
            {existingPhotos.map((u, i) => (
              <div key={i} className="relative">
                <img
                  src={toFullUrl(u)}
                  alt={`exist-${i}`}
                  className="w-full h-24 object-cover rounded"
                  onError={(e) => { 
                    e.currentTarget.onerror = null; 
                    e.currentTarget.src = `${API}/uploads/placeholder.png`; 
                  }}
                />
                <button 
                  type="button" 
                  className="preview-remove" 
                  onClick={() => removeExistingPhoto(i)}
                  aria-label="Supprimer la photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Ajouter nouvelles photos */}
          <div className="mt-4">
            <div className="label mb-2">Ajouter nouvelles photos (max 6)</div>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleFiles}
              className="input-field w-full"
            />
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              {newPreviews.length} photo(s) sélectionnée(s)
            </p>
            {newPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {newPreviews.map((p, i) => (
                  <div key={i} className="relative">
                    <img 
                      src={p} 
                      alt={`new-${i}`} 
                      className="w-full h-24 object-cover rounded" 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remplacer photos */}
          <label className="inline-flex items-center gap-2 mt-3">
            <input 
              type="checkbox" 
              checked={replacePhotos} 
              onChange={e => setReplacePhotos(e.target.checked)} 
            />
            <span style={{ fontSize: "14px" }}>
              Remplacer les photos existantes (les anciennes seront supprimées)
            </span>
          </label>
        </div>

        {/* Publié */}
        <label className="inline-flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={published} 
            onChange={e => setPublished(e.target.checked)} 
          />
          <span>Publier cette annonce</span>
        </label>

        {/* Boutons */}
        <div className="flex items-center gap-3">
          <button 
            className="btn-submit" 
            type="submit" 
            disabled={sending}
          >
            {sending ? "Envoi..." : "Enregistrer les modifications"}
          </button>
          <button 
            type="button" 
            onClick={handleBack} 
            className="btn-back-outline"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}