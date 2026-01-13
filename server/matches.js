// server/matches.js
// Simple matching based on typeService and budget
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

/**
 * scoreOfferSimple(contact, offer)
 * - contact: { typeService: 'a_louer'|'a_vendre', maxBudget: number }
 * - offer: must have price (number) and type/typeService
 * returns { score: 0..100, offer, details }
 */
function scoreOfferSimple(contact, offer) {
  const contactBudget = Number(contact.maxBudget || contact.budget || 0);
  const offerPrice = Number(offer.price || offer.prix || offer.priceNum || 0);

  if (!contactBudget || !offerPrice) {
    return { score: 0, offer, details: { contactBudget, offerPrice } };
  }

  const diff = Math.abs(offerPrice - contactBudget);
  const s_budget = Math.max(0, 1 - diff / contactBudget); // 1..0
  const score = Math.round(s_budget * 100);
  return { score, offer, details: { contactBudget, offerPrice, diff, s_budget } };
}

/**
 * getTopMatchesFromContact(contact, top=5)
 * - If FIREBASE is used, tries to read from Firestore collection 'annonces' where published==true
 * - Else reads server/data/offres.json
 * - Filters by typeService and price window [0.5*budget .. 1.5*budget]
 */
async function getTopMatchesFromContact(contact, top = 5, useFirebase = false, adminInstance = null) {
  const typeWanted = String(contact.typeService || '').toLowerCase();
  const budget = Number(contact.maxBudget || contact.budget || 0);
  let candidates = [];

  if (useFirebase && adminInstance) {
    try {
      const db = adminInstance.firestore();
      let q = db.collection('annonces').where('published', '==', true);
      if (typeWanted) q = q.where('type', '==', typeWanted);
      // if budget present we still limit later in JS if Firestore index missing
      const snap = await q.get();
      snap.forEach(doc => {
        candidates.push({ id: doc.id, ...(doc.data() || {}) });
      });
    } catch (err) {
      console.warn('Firebase read error in matching:', err.message || err);
      candidates = [];
    }
  } else {
    // fallback read JSON
    candidates = loadOffersFromJson();
  }

  // normalize the candidate type field names
  candidates = candidates.filter(o => {
    const ot = String(o.type || o.typeService || '').toLowerCase();
    if (!ot) return false;
    if (typeWanted && ot !== typeWanted) return false;
    return true;
  });

  // filter by budget window if budget provided
  if (budget > 0) {
    const minPrice = Math.max(0, Math.floor(budget * 0.5));
    const maxPrice = Math.ceil(budget * 1.5);
    candidates = candidates.filter(o => {
      const p = Number(o.price || o.prix || 0);
      return p >= minPrice && p <= maxPrice;
    });
  }

  // score them
  const scored = candidates.map(o => scoreOfferSimple(contact, o));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, top);
}

module.exports = { getTopMatchesFromContact, scoreOfferSimple };