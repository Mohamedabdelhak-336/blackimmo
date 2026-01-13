/**
 * Extrait l'ID YouTube d'une URL
 * Accepte les formats :
 * - https://www. youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - VIDEO_ID (directement)
 */
export function extractYouTubeId(url) {
  if (!url) return '';

  // Si c'est déjà un ID (11 caractères alphanumériques)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Format : https://www.youtube.com/watch?v=VIDEO_ID
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n? #]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Format court : youtu.be/VIDEO_ID
  match = url.match(/youtu\.be\/([^&\n?#]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return '';
}

/**
 * Génère une URL d'embed YouTube
 */
export function getYouTubeEmbedUrl(videoId) {
  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Valide si c'est un ID YouTube valide
 */
export function isValidYouTubeId(id) {
  return /^[a-zA-Z0-9_-]{11}$/. test(id);
}