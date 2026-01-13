const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

// Local helpers (self-contained)
function normalizeType(t) {
  if (!t) return '';
  let s = String(t).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  s = s.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.includes('louer') || s.includes('location') || s.includes('rent')) return 'a_louer';
  if (s.includes('vendre') || s.includes('vente') || s.includes('achat') || s.includes('sell') || s.includes('sale')) return 'a_vendre';
  if (s === 'a_louer' || s === 'a_vendre') return s;
  return s;
}
function parsePrice(v) {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/\s+/g, '').replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
function scoreOfferSimple(contact, offer) {
  const contactBudget = Number(contact.maxBudget || contact.budget || 0);
  const offerPrice = parsePrice(offer.price ?? offer.prix ?? 0);
  if (!contactBudget || !offerPrice) return { score: 0, offer, details: { contactBudget, offerPrice } };
  const diff = Math.abs(offerPrice - contactBudget);
  const s_budget = Math.max(0, 1 - diff / contactBudget);
  return { score: Math.round(s_budget * 100), offer, details: { contactBudget, offerPrice, diff, s_budget } };
}

// requireAdmin (same logic as server.js)
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

// GET /api/admin/contacts/:id/matches?top=8
router.get('/contacts/:id/matches', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const top = Number(req.query.top) || 8;
  console.log(`CONTACT-MATCH: start for contactId=${id} top=${top}`);

  try {
    if (!admin.apps || admin.apps.length === 0) {
      console.warn('CONTACT-MATCH: Firebase not initialized');
      return res.status(500).json({ ok: false, message: 'Firebase non initialisé' });
    }

    const db = admin.firestore();
    const doc = await db.collection('contacts').doc(id).get();
    if (!doc.exists) {
      console.log('CONTACT-MATCH: contact not found id=', id);
      return res.status(404).json({ ok: false, message: 'Contact non trouvé' });
    }

    const contact = doc.data();
    console.log('CONTACT-MATCH: contact data =', JSON.stringify(contact));
    const typeWanted = normalizeType(contact.typeService || contact.type || '');
    const budget = Number(contact.maxBudget || contact.budget || 0);
    console.log('CONTACT-MATCH: contact.typeService=', contact.typeService, 'normalized=', typeWanted, 'contact.maxBudget=', budget);

    // Load annonces published=true
    const snapshot = await db.collection('annonces').where('published', '==', true).get();
    const annonces = [];
    snapshot.forEach(d => annonces.push({ id: d.id, ...(d.data() || {}) }));
    console.log('CONTACT-MATCH: total annonces loaded=', annonces.length);

    // Filter by normalized type
    let byType = annonces.filter(a => {
      const ot = normalizeType(a.type ?? a.typeService ?? '');
      return ot && (!typeWanted || ot === typeWanted);
    });
    console.log('CONTACT-MATCH: after type filter=', byType.length);

    // Filter by price window ±50% if budget provided
    let byPrice = byType;
    const reasons = { parsedPriceZero: 0, priceExcluded: 0 };
    if (budget > 0) {
      const minPrice = Math.max(0, Math.floor(budget * 0.5));
      const maxPrice = Math.ceil(budget * 1.5);
      byPrice = byType.filter(a => {
        const p = parsePrice(a.price ?? a.prix ?? 0);
        if (!p) { reasons.parsedPriceZero++; return false; }
        if (p < minPrice || p > maxPrice) { reasons.priceExcluded++; return false; }
        return true;
      });
    }
    console.log('CONTACT-MATCH: after price filter=', byPrice.length, 'reasons=', reasons);

    // Score them and sort
    const scored = byPrice.map(o => scoreOfferSimple(contact, o));
    scored.sort((a,b) => b.score - a.score);

    const result = scored.slice(0, top);
    console.log('CONTACT-MATCH: returning matches count=', result.length);
    console.log('CONTACT-MATCH: sample', JSON.stringify(result.slice(0,5).map(r=>({ score:r.score, offerId: r.offer?.id, price: r.offer?.price || r.offer?.prix })), null, 2));

    return res.json({ ok: true, matches: result });
  } catch (err) {
    console.error('CONTACT-MATCH: error', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, message: err.message || 'Server error' });
  }
});

module.exports = router;