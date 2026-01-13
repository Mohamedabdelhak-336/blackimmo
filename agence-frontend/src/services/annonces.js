const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

function normalizePhotos(o) {
  const photoPaths = (o.photoPaths || o.photos || []).map(p => {
    if (! p) return null;
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (p.startsWith('/')) return `${API}${p}`;
    return `${API}/${p}`;
  }). filter(Boolean);
  return photoPaths;
}

export async function fetchProperties(limit = 8, page = 1, opts = {}) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (page) params.append('page', String(page));
    if (opts.type) params.append('type', opts.type);
    if (opts.q) params.append('q', opts.q);
    if (opts.city) params.append('city', opts.city);
    if (opts.priceMin) params.append('priceMin', String(opts.priceMin));
    if (opts.priceMax) params.append('priceMax', String(opts.priceMax));
    if (opts.rooms) params.append('rooms', String(opts.rooms));
    if (opts.sort) params.append('sort', opts.sort);

    const url = `${API}/api/offres?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text(). catch(()=>null);
      throw new Error(body || `Erreur ${res.status}`);
    }
    const json = await res.json();
    const dataArray = Array.isArray(json) ? json : (json.items || []);
    const normalized = dataArray.map(o => {
      const photoPaths = normalizePhotos(o);
      return { ...o, photos: photoPaths, photoPaths };
    });
    return normalized;
  } catch (err) {
    console.error('fetchProperties error', err);
    throw err;
  }
}

export async function fetchPropertyById(id) {
  try {
    const response = await fetch(`${API}/api/offres/${id}`);
    if (!response.ok) throw new Error("Offre non trouvée");
    const data = await response.json();
    
    // ← Vérifie que les photos/photoPaths sont dans les données
    console.log('Fetched data:', data);
    console.log('Photos:', data.photos || data.photoPaths);
    
    return data;
  } catch (err) {
    throw new Error(err.message);
  }
}