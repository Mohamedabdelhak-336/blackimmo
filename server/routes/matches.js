// server/matches.js - matching robuste + logs
const path = require('path');
const fs = require('fs');

function loadOffersFromJson() {
  const p = path.join(__dirname, 'data', 'offres.json');
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading offres.json:', err);
    return [];
  }
}

function normalizeType(t) {
  if (!t) return '';
  // remove accents, lowercase, trim
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
  const offerPrice = parsePrice(offer.price ?? offer.prix ?? offer.priceNum ?? 0);
  if (!contactBudget || !offerPrice) {
    return { score: 0, offer, details: { contactBudget, offerPrice } };
  }
  const diff = Math.abs(offerPrice - contactBudget);
  const s_budget = Math.max(0, 1 - diff / contactBudget);
  const score = Math.round(s_budget * 100);
  return { score, offer, details: { contactBudget, offerPrice, diff, s_budget } };
}

/**
 * getTopMatchesFromContact(contact, top=5, useFirebase=false, adminInstance=null)
 * - returns array of { score, offer } sorted by score (desc)
 * - always returns an array (never a number)
 * - logs internal steps for debugging
 */
async function getTopMatchesFromContact(contact, top = 5, useFirebase = false, adminInstance = null) {
  try {
    const typeWanted = normalizeType(contact.typeService || contact.type || '');
    const budget = Number(contact.maxBudget || contact.budget || 0);
    let candidates = [];

    if (useFirebase && adminInstance) {
      try {
        const db = adminInstance.firestore();
        const snap = await db.collection('annonces').where('published', '==', true).get();
        snap.forEach(doc => candidates.push({ id: doc.id, ...(doc.data() || {}) }));
      } catch (err) {
        console.warn('Firebase read error in matching:', err && err.message ? err.message : err);
        candidates = [];
      }
    } else {
      candidates = loadOffersFromJson();
    }

    console.log('MATCH: total annonces loaded=', candidates.length, 'contactType=', typeWanted, 'budget=', budget);

    const reasons = { typeExcluded: 0, priceExcluded: 0, parsedPriceZero: 0 };

    // normalize & filter by type
    const byType = candidates.filter(o => {
      const ot = normalizeType(o.type || o.typeService || '');
      if (!ot) { reasons.typeExcluded++; return false; }
      if (typeWanted && ot !== typeWanted) { reasons.typeExcluded++; return false; }
      return true;
    });

    // filter by price window ±50% if budget provided
    let byPrice = byType;
    if (budget > 0) {
      const minPrice = Math.max(0, Math.floor(budget * 0.5));
      const maxPrice = Math.ceil(budget * 1.5);
      byPrice = byType.filter(o => {
        const p = parsePrice(o.price ?? o.prix ?? 0);
        if (!p) { reasons.parsedPriceZero++; return false; }
        if (p < minPrice || p > maxPrice) { reasons.priceExcluded++; return false; }
        return true;
      });
    }

    console.log('MATCH: after filters candidates=', byPrice.length, 'reasons=', reasons);
    if (byPrice.length > 0) console.log('MATCH sample:', JSON.stringify(byPrice.slice(0,5).map(c=>({ id:c.id, type:c.type||c.typeService, price:c.price||c.prix })), null, 2));

    // score
    const scored = byPrice.map(o => {
      const s = scoreOfferSimple(contact, o);
      return { score: s.score, offer: o };
    });
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, top);
  } catch (err) {
    console.error('getTopMatchesFromContact error:', err && err.stack ? err.stack : err);
    // Fail-safe: return empty array (never a number)
    return [];
  }
}

module.exports = { getTopMatchesFromContact, scoreOfferSimple, normalizeType, parsePrice };