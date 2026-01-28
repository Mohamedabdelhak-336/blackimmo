const express = require('express');
const { getTopMatchesFromContact, scoreOfferSimple, normalizeType, parsePrice } = require('../matches');
const router = express.Router();

/**
 * POST /api/top-matches
 * Utilise le body JSON pour récupérer le contact et retourne les meilleurs offres
 */
router.post('/top-matches', async (req, res) => {
  try {
    const contact = req.body;
    const results = await getTopMatchesFromContact(contact);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

/**
 * POST /api/score-offer
 * Utilise le body JSON pour récupérer contact et offer, retourne le score
 */
router.post('/score-offer', (req, res) => {
  try {
    const { contact, offer } = req.body;
    if (!contact || !offer) {
      return res.status(400).json({ error: 'contact et offer sont requis' });
    }
    const score = scoreOfferSimple(contact, offer);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

/**
 * POST /api/normalize-type
 * Utilise le body JSON pour récupérer "type" et retourne une version normalisée
 */
router.post('/normalize-type', (req, res) => {
  try {
    const { type } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'Paramètre type requis' });
    }
    const normalized = normalizeType(type);
    res.json({ normalized });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

/**
 * POST /api/parse-price
 * Utilise le body JSON pour récupérer "value" et retourne le prix parsé
 */
router.post('/parse-price', (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'Paramètre value requis' });
    }
    const price = parsePrice(value);
    res.json({ price });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

module.exports = router;