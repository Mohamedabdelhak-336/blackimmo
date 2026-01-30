import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapPicker from "../MapPicker";
import { extractYouTubeId } from "../../services/youtube";

export default function AdminCreateOffer() {
  const [adresse, setAdresse] = useState("");
  const [descript, setDescript] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("a_vendre");
  const [published, setPublished] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [videoUrl, setVideoUrl] = useState("");        // ← NOUVEAU
  const [videoId, setVideoId] = useState("");          // ← NOUVEAU
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []). slice(0, 6);
    setPhotos(files);
    const p = files.map(f => URL.createObjectURL(f));
    setPreviews(p);
  }

  function handleBack() {
    nav("/admin/dashboard");
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert("Géolocalisation non supportée par ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      (err) => {
        alert("Impossible d'obtenir la position : " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ← NOUVEAU : Gère le changement de l'URL YouTube
  function handleVideoUrlChange(e) {
    const url = e.target.value;
    setVideoUrl(url);
    setVideoId(extractYouTubeId(url)); // Extrait automatiquement l'ID
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (price && isNaN(Number(price))) {
      setError("Le prix doit être un nombre");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('adresse', adresse);
      form.append('descript', descript);
      form.append('price', price);
      form. append('type', type === 'a_vendre' ? 'À vendre' : 'À louer');
      form.append('published', published ?  'true' : 'false');
      
      // append lat/lng only if present
      if (lat !== "" && lat !== null && typeof lat !== 'undefined') form.append('lat', String(lat));
      if (lng !== "" && lng !== null && typeof lng !== 'undefined') form. append('lng', String(lng));
      
      // ← NOUVEAU : Ajoute les infos vidéo YouTube
      if (videoUrl) form.append('videoUrl', videoUrl);
      if (videoId) form.append('videoId', videoId);
      
      photos.forEach((f) => form.append('photos', f));

      const res = await fetch('${API_URL}/api/admin/offres', {
        method: "POST",
        credentials: "include",
        body: form
      });
      const data = await res.json();
      if (! res.ok) throw new Error(data?. error || 'Erreur lors de la création');
      
      alert("Offre créée avec succès !");
      nav("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-offer-page max-w-3xl mx-auto p-6 bg-white rounded-lg shadow animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Ajouter une annonce</h2>
        <button onClick={handleBack} className="btn-back" aria-label="Retour au dashboard">← Retour</button>
      </div>

      {error && <div className="error-alert mb-4">{error}</div>}

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
        {/* Adresse */}
        <label className="block">
          <div className="label">Adresse *</div>
          <input 
            className="input-field w-full" 
            value={adresse} 
            onChange={e => setAdresse(e.target.value)} 
            required
            placeholder="Rue, ville..." 
          />
        </label>

        {/* Description */}
        <label className="block">
          <div className="label">Description *</div>
          <textarea 
            className="input-field w-full h-28" 
            value={descript} 
            onChange={e => setDescript(e.target. value)} 
            required
            placeholder="Détails de l'annonce..." 
          />
        </label>

        {/* Prix et Type */}
        <div className="grid grid-cols-2 gap-4">
          <label>
            <div className="label">Prix (TND) *</div>
            <input 
              className="input-field w-full" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              required
              type="number"
              placeholder="Ex: 120000" 
            />
          </label>

          <label>
            <div className="label">Type *</div>
            <select 
              className="input-field w-full" 
              value={type} 
              onChange={e => setType(e.target. value)}
              required
            >
              <option value="a_vendre">À vendre</option>
              <option value="a_louer">À louer</option>
            </select>
          </label>
        </div>

        {/* Emplacement */}
        <div>
          <div className="label mb-2">Emplacement</div>
          <div className="mb-2 flex items-center gap-2">
            <button 
              type="button" 
              onClick={handleUseMyLocation} 
              className="btn-back-outline"
            >
              Utiliser ma position
            </button>
            <div className="text-sm text-gray-500">
              Lat: {lat !== "" ? Number(lat). toFixed(6) : "-"} | Lng: {lng !== "" ? Number(lng).toFixed(6) : "-"}
            </div>
          </div>

          <MapPicker
            lat={(lat === "" || lat === null) ? null : Number(lat)}
            lng={(lng === "" || lng === null) ? null : Number(lng)}
            zoom={13}
            height={320}
            pinLabel={price ? `${Number(price). toLocaleString('fr-FR')} TND` : 'Ici'}
            onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }}
          />
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
          <div className="label mb-2">Photos (max 6) *</div>
          <div className="file-drop" onClick={() => document.getElementById('photos-input')?.click()}>
            <input 
              id="photos-input" 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleFiles} 
              required
              style={{ display: "none" }} 
            />
            <div className="file-drop-inner">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v12" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10l-7-7-7 7" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="file-drop-text">Cliquez ou glissez des images ici (jpg, png)</div>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {previews.map((src, i) => (
                <div key={i} className="preview-card relative">
                  <img src={src} alt={`preview-${i}`} className="w-full h-24 object-cover rounded" />
                  <button 
                    type="button" 
                    className="preview-remove" 
                    onClick={() => {
                      const newPhotos = photos.slice();
                      newPhotos.splice(i, 1);
                      setPhotos(newPhotos);
                      const newPreviews = previews. slice();
                      URL.revokeObjectURL(newPreviews[i]);
                      newPreviews.splice(i, 1);
                      setPreviews(newPreviews);
                    }} 
                    aria-label="Supprimer photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publié */}
        <label className="inline-flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={published} 
            onChange={e => setPublished(e. target.checked)} 
          />
          <span>Publier cette annonce</span>
        </label>

        {/* Boutons */}
        <div className="pt-3 flex items-center gap-3">
          <button 
            type="submit" 
            className={`btn-submit ${loading ? 'loading' : ''}`} 
            disabled={loading}
          >
            {loading ? "Envoi..." : "Ajouter l'annonce"}
            {loading && <span className="spinner" aria-hidden="true" />}
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