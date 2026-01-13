import React, { useEffect } from "react";

/*
  ImageLightbox props:
    - images: array of image URLs
    - startIndex: number
    - open: boolean
    - onClose(): callback
*/
export default function ImageLightbox({ images = [], startIndex = 0, open, onClose }) {
  const [index, setIndex] = React.useState(startIndex || 0);

  useEffect(() => {
    setIndex(startIndex || 0);
  }, [startIndex, open]);

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex(i => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onClose]);

  if (!open) return null;
  if (!images || images.length === 0) return null;

  return (
    <div className="lightbox-backdrop" role="dialog" aria-modal="true" aria-label="Galerie photos">
      <div className="lightbox-content">
        <button className="lightbox-close" onClick={onClose} aria-label="Fermer">✕</button>

        <div className="lightbox-main">
          <button className="lightbox-arrow left" onClick={() => setIndex(i => Math.max(i - 1, 0))} aria-label="Précédent">‹</button>

          <div className="lightbox-image-wrap">
            <img src={images[index]} alt={`Photo ${index + 1}`} className="lightbox-image" />
            <div className="lightbox-caption">{index + 1} / {images.length}</div>
          </div>

          <button className="lightbox-arrow right" onClick={() => setIndex(i => Math.min(i + 1, images.length - 1))} aria-label="Suivant">›</button>
        </div>

        {images.length > 1 && (
          <div className="lightbox-thumbs" role="list">
            {images.map((src, i) => (
              <button
                key={i}
                className={`thumb-btn ${i === index ? "active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Voir la photo ${i + 1}`}
              >
                <img src={src} alt={`Mini ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}