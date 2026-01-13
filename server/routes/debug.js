const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/* Local helpers (self-contained so we don't dépendre d'autres exports) */
function parsePrice(v) {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/\s+/g, '').replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
function normalizeType(t) {
  if (!t) return '';
  let s = String(t).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  s = s.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.includes('louer') || s.includes('location') || s.includes('rent') || s === 'a louer' || s === 'alouer') return 'a_louer';
  if (s.includes('vendre') || s.includes('vente') || s.includes('achat') || s.includes('sell') || s.includes('sale') || s === 'a vendre' || s === 'avendre') return 'a_vendre';
  if (s === 'a_louer' || s === 'a_vendre') return s;
  return s;
}

// GET /api/debug/annonces-normalized
router.get('/annonces-normalized', async (req, res) => {
  try {
    let annonces = [];
    if (admin.apps && admin.apps.length > 0) {
      const db = admin.firestore();
      const snap = await db.collection('annonces').get();
      snap.forEach(doc => annonces.push({ id: doc.id, ...(doc.data() || {}) }));
    } else {
      const p = path.join(__dirname, '..', 'data', 'offres.json');
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8') || '[]';
        annonces = JSON.parse(raw);
      }
    }

    const mapped = annonces.map(a => {
      const rawType = a.type ?? a.typeService ?? '';
      const normalized = normalizeType(rawType);
      const rawPrice = a.price ?? a.prix ?? a.priceNum ?? null;
      const parsedPrice = parsePrice(rawPrice);
      return {
        id: a.id || null,
        rawType,
        normalizedType: normalized,
        rawPrice,
        parsedPrice,
        published: a.published ?? false,
      };
    });

    return res.json({ ok: true, count: mapped.length, annonces: mapped });
  } catch (err) {
    console.error('DEBUG annonces-normalized error', err);
    return res.status(500).json({ ok: false, message: err.message || 'Server error' });
  }
});

module.exports = router;