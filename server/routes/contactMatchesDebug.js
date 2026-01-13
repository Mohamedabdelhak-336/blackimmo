const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { parsePrice: parsePriceFromMatches } = require('../matches'); // reuse parsePrice if present

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change_me_if_missing';

function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// local normalizeType copy (safe)
function normalizeType(t) {
  if (!t) return '';
  let s = String(t).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  s = s.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.includes('louer') || s.includes('location') || s.includes('rent') || s === 'a louer' || s === 'alouer') return 'a_louer';
  if (s.includes('vendre') || s.includes('vente') || s.includes('achat') || s.includes('sell') || s.includes('sale') || s === 'a vendre' || s === 'avendre') return 'a_vendre';
  if (s === 'a_louer' || s === 'a_vendre') return s;
  return s;
}

function parsePrice(v) {
  // prefer parsePrice from matches if exists
  try {
    if (typeof parsePriceFromMatches === 'function') return parsePriceFromMatches(v);
  } catch (e) {}
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/\s+/g, '').replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// GET /api/admin/contacts/:id/matches-debug
// returns step-by-step arrays for debugging
router.get('/contacts/:id/matches-debug', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const top = Number(req.query.top) || 8;
    if (!admin.apps || admin.apps.length === 0) {
      return res.status(500).json({ ok: false, message: 'Firebase non initialisé' });
    }

    const db = admin.firestore();
    const contactDoc = await db.collection('contacts').doc(id).get();
    if (!contactDoc.exists) return res.status(404).json({ ok: false, message: 'Contact non trouvé' });
    const contact = contactDoc.data();

    const typeWanted = normalizeType(contact.typeService || contact.type || '');
    const budget = Number(contact.maxBudget || contact.budget || 0);

    // load annonces (published true)
    const snap = await db.collection('annonces').where('published', '==', true).get();
    const loaded = [];
    snap.forEach(doc => loaded.push({ id: doc.id, ...(doc.data() || {}) }));

    // enrich loaded with normalized + parsed price
    const loadedEnriched = loaded.map(a => {
      const rawType = a.type ?? a.typeService ?? '';
      const normalizedType = normalizeType(rawType);
      const rawPrice = a.price ?? a.prix ?? null;
      const parsedPrice = parsePrice(rawPrice);
      return { id: a.id, rawType, normalizedType, rawPrice, parsedPrice, published: !!a.published };
    });

    // filter by type
    const afterType = loadedEnriched.filter(a => {
      if (!a.normalizedType) return false;
      if (typeWanted && a.normalizedType !== typeWanted) return false;
      return true;
    });

    // filter by price window ±50%
    let afterPrice = afterType;
    const reasons = { typeExcluded: 0, priceExcluded: 0, parsedPriceZero: 0 };
    if (budget > 0) {
      const minPrice = Math.max(0, Math.floor(budget * 0.5));
      const maxPrice = Math.ceil(budget * 1.5);
      afterPrice = afterType.filter(a => {
        const p = a.parsedPrice || 0;
        if (!p) { reasons.parsedPriceZero++; return false; }
        if (p < minPrice || p > maxPrice) { reasons.priceExcluded++; return false; }
        return true;
      });
    }

    // score simple (budget closeness)
    const scored = afterPrice.map(a => {
      const diff = Math.abs(a.parsedPrice - budget);
      const s_budget = budget ? Math.max(0, 1 - diff / budget) : 0;
      return { id: a.id, parsedPrice: a.parsedPrice, score: Math.round(s_budget * 100), rawType: a.rawType, normalizedType: a.normalizedType };
    }).sort((x,y)=>y.score-x.score).slice(0, top);

    return res.json({
      ok: true,
      contactId: id,
      contact: { typeService: contact.typeService, maxBudget: contact.maxBudget },
      typeWanted,
      budget,
      loadedCount: loadedEnriched.length,
      loaded: loadedEnriched,
      afterTypeCount: afterType.length,
      afterType,
      afterPriceCount: afterPrice.length,
      afterPrice,
      reasons,
      scored
    });
  } catch (err) {
    console.error('matches-debug error', err);
    return res.status(500).json({ ok: false, message: err.message || 'Server error' });
  }
});

module.exports = router;