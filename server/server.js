require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin'); 
const storage = multer.memoryStorage();
const { sendNewDemandeEmailSMTP } = require('./notify-nodemailer');
const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PW_HASH = process.env.ADMIN_PW_HASH;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || '2h';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
// ---------- FIREBASE: load service account, normalize bucket, init and upload helper ----------
let serviceAccount = null;
let USING_FIREBASE = false;

try {
  const keyFilePath = path.join(__dirname, process.env.FIREBASE_KEY_FILE || './firebaseKey.json');

  console.log('🔍 Looking for Firebase key at:', keyFilePath);
  console.log('📁 File exists?  ', fs.existsSync(keyFilePath));

  if (fs.existsSync(keyFilePath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
    console.log('✅ Firebase key loaded from file:', keyFilePath);
    USING_FIREBASE = true;
  } else {
    console.warn('⚠️ Firebase key file not found at:', keyFilePath);
    USING_FIREBASE = false;
  }
} catch (err) {
  console.error('❌ Error loading Firebase key:', err && err.message ? err.message : err);
  USING_FIREBASE = false;
}

// Determine and normalize bucket name AFTER serviceAccount is available
const rawBucketFromEnv = process.env.FIREBASE_STORAGE_BUCKET || null;
const rawBucketFromServiceAccount = serviceAccount?.storage_bucket || null;
const rawBucket = rawBucketFromEnv || rawBucketFromServiceAccount || null;

// normalize: remove optional gs:// prefix and trailing slashes
const normalizedBucket = rawBucket ? String(rawBucket).replace(/^gs:\/\//, '').replace(/\/+$/, '') : null;

// fallback to project_id.appspot.com if nothing else
const fallbackBucket = (!normalizedBucket && serviceAccount && serviceAccount.project_id) ? `${serviceAccount.project_id}.appspot.com` : null;

const FIREBASE_STORAGE_BUCKET_NAME = normalizedBucket || fallbackBucket || null;

// Initialize Firebase once (only if serviceAccount loaded)
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: FIREBASE_STORAGE_BUCKET_NAME || undefined,
  });
  console.log('✅ Firebase initialized. Using storage bucket:', FIREBASE_STORAGE_BUCKET_NAME);
} else {
  console.warn('⚠️ Firebase service account not loaded - Firebase features disabled');
}

// Keep USING_FIREBASE consistent (true only when serviceAccount present)
USING_FIREBASE = !!serviceAccount;

/**
 * Upload file buffer to explicit bucket and return signed URL.
 */
async function uploadPhotoToFirebase(file) {
  if (!USING_FIREBASE) {
    throw new Error('Firebase not configured');
  }

  // Ensure bucket name exists
  const bucketName = FIREBASE_STORAGE_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('No Firebase storage bucket specified. Set FIREBASE_STORAGE_BUCKET in .env (without gs://) or include storage_bucket in your service account key.');
  }

  const bucket = admin.storage().bucket(bucketName);
  console.log('Uploading to Firebase bucket:', bucketName);

  const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
  const fileRef = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const blobStream = fileRef.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000',
      },
      public: true,
    });

    blobStream.on('error', (error) => {
      console.error('Firebase upload error:', error);
      reject(error);
    });

    blobStream.on('finish', async () => {
      try {
        const [signedUrl] = await fileRef.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        console.log('✅ Uploaded with signed URL', signedUrl);
        resolve(signedUrl);
      } catch (error) {
        console.error('Signed URL error:', error);
        reject(error);
      }
    });

    blobStream.end(file.buffer);
  });
}

// ← AJOUTER : Initialiser Firebase



async function setupStorageCORS() {
  try {
    const bucket = admin.storage().bucket();
    
    // Configure CORS
    await bucket.setCorsConfiguration([
      {
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost',
          '*'  // ← Permets TOUS les domaines (optionnel, pour dev)
        ],
        method: ['GET', 'HEAD', 'DELETE', 'POST', 'PUT'],
        responseHeader: ['Content-Type', 'Access-Control-Allow-Origin'],
        maxAgeSeconds: 3600,
      },
    ]);
    
    console. log('✅ Storage CORS configured successfully');
  } catch (err) {
    console.warn('⚠️ CORS setup warning:', err.message);
  }
}

// Appelle la fonction au démarrage
if (process.env.FIREBASE_PROJECT_ID) {
  setupStorageCORS();
}
// Ensure upload + data dirs exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
// ensure offres.json exists
const OFFRES_FILE = path.join(DATA_DIR, 'offres.json');
if (!fs.existsSync(OFFRES_FILE)) fs.writeFileSync(OFFRES_FILE, '[]', 'utf8');

if (!ADMIN_EMAIL || !ADMIN_PW_HASH || !JWT_SECRET) {
  console.error("Missing required env variables. Please set ADMIN_EMAIL, ADMIN_PW_HASH and ADMIN_JWT_SECRET in server/.env");
  process.exit(1);
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
}));

// Optional request logger (helpful for debugging)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.path);
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));
 function safeRequireRouter(relPath, name) {
   try {
     const mod = require(relPath);
     console.log(`[server] require ${name} ->`, typeof mod);
     if (typeof mod === 'function') return mod;
     if (mod && typeof mod === 'object') {
       if (typeof mod.default === 'function') {
         console.log(`[server] ${name}.default is function, using it`);
         return mod.default;
       }
       if (typeof mod.use === 'function' || typeof mod.handle === 'function') {
         return mod;
       }
       return mod;
     }
     return null;
   } catch (e) {
     console.error(`[server] require failed for ${relPath}:`, e && e.message ? e.message : e);
     return null;
   }
 }

 const matchesRouter = safeRequireRouter('./routes/matches', 'matches');
 if (matchesRouter && (typeof matchesRouter === 'function' || typeof matchesRouter.use === 'function')) {
   app.use('/api', matchesRouter);
 } else {
   console.error('[server] matchesRouter is invalid, not mounting /api. value=', matchesRouter);
 }

 const contactMatchesRouter = safeRequireRouter('./routes/contactMatches', 'contactMatches');
 if (contactMatchesRouter && (typeof contactMatchesRouter === 'function' || typeof contactMatchesRouter.use === 'function')) {
   app.use('/api/admin', contactMatchesRouter);
 } else {
   console.error('[server] contactMatchesRouter is invalid, not mounting /api/admin. value=', contactMatchesRouter);
 }
 const debugRouter = require('./routes/debug');
app.use('/api/debug', debugRouter);
const contactMatchesDebug = require('./routes/contactMatchesDebug');
app.use('/api/admin', contactMatchesDebug);
/* ---------- Helpers ---------- */

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch (e) {
    console.error('readJson error', e);
    return [];
  }
}
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// helper: delete files from disk given photoPaths like "/uploads/xxx.jpg"
function deleteUploadedFiles(photoPaths = []) {
  photoPaths.forEach(p => {
    try {
      const rel = p.startsWith('/') ? p.slice(1) : p;
      const full = path.join(__dirname, rel);
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
      }
    } catch (e) {
      console.warn('Failed to delete file', p, e.message);
    }
  });
}
// ← NOUVEAU : Uploader une photo dans Firebase Storage

/**
 * Upload file buffer to explicit bucket and return signed URL.
 */

/* ---------- Location helpers & optional endpoints ---------- */

// Validate lat/lng (returns true if both are numbers inside acceptable ranges)
function isValidLatLng(lat, lng) {
  if (lat === undefined || lng === undefined || lat === null || lng === null) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (Number.isNaN(nLat) || Number.isNaN(nLng)) return false;
  if (nLat < -90 || nLat > 90) return false;
  if (nLng < -180 || nLng > 180) return false;
  return true;
}

// Haversine distance between two points (km)
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => v * Math.PI / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Example: validate lat/lng in POST / PUT handlers (add this check where you build localisation)
// if (lat || lng) {
//   if (!isValidLatLng(lat, lng)) {
//     return res.status(400).json({ error: 'Invalid lat/lng' });
//   }
//   existing.localisation = { lat: Number(lat), lng: Number(lng) };
// }

/*
 Public endpoint: find published offers near given lat/lng
 GET /api/offres/nearby?lat=36.8&lng=10.1&radius_km=5&limit=20
 Response: array of offres with an extra field distance_km
*/
app.get('/api/offres/nearby', async (req, res) => {
  try {
    const { lat, lng, radius_km = 5, limit = 20 } = req.query;
    if (!isValidLatLng(lat, lng)) return res.status(400).json({ error: 'lat and lng query params required and must be valid numbers' });

    const centerLat = Number(lat);
    const centerLng = Number(lng);
    const maxKm = Math.max(0.1, Number(radius_km) || 5);
    const lim = Math.max(1, Number(limit) || 20);

    let offres = [];

    if (USING_FIREBASE) {
      const db = admin.firestore();
      const snapshot = await db.collection('annonces')
        .where('published', '==', true)
        .get();
      
      snapshot.forEach(doc => {
        offres.push({ id: doc.id, ...  doc.data() });
      });
    } else {
      offres = readJson(OFFRES_FILE). filter(o => !!o.published);
    }

    offres = offres.filter(o => o.localisation && typeof o.localisation. lat !== 'undefined' && typeof o.localisation.lng !== 'undefined');

    const withDist = offres.map(o => {
      const d = haversineDistanceKm(centerLat, centerLng, Number(o.localisation.lat), Number(o.localisation.lng));
      return { ...o, distance_km: d };
    }). filter(o => o.distance_km <= maxKm);

    withDist.sort((a,b) => a.distance_km - b.distance_km);

    return res.json(withDist. slice(0, lim));
  } catch (err) {
    console.error('GET /api/offres/nearby error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
/* ---------- Auth & middlewares ---------- */

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

/* ---------------------------
   Multer config for uploads
   --------------------------- */

const upload = multer({
  storage,  // ← référence au memoryStorage
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (! file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
    cb(null, true);
  }
});
/* ---------------------------
   Auth endpoints
   --------------------------- */

app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  if (email !== ADMIN_EMAIL) {
    await new Promise(r => setTimeout(r, 400)); // slow down enumeration attacks
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const match = await bcrypt.compare(password, ADMIN_PW_HASH);
  if (!match) return res.status(401).json({ error: 'Unauthorized' });

  const token = createToken({ email: ADMIN_EMAIL, role: 'admin' });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
  });

  return res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  return res.json({ email: req.admin.email, role: req.admin.role });
});

/* ---------------------------
   Example protected endpoints
   --------------------------- */

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({ totalListings: 123, totalUsers: 42 });
});

app.get('/api/admin/demandes', requireAdmin, async (req, res) => {
  try {
    if (!USING_FIREBASE) {
      return res.status(400).json({ error: 'Firebase not configured' });
    }

    const db = admin.firestore();
    const snapshot = await db.collection('demandes')
      .orderBy('dateDemande', 'desc')
      .get();

    const demandes = [];
    snapshot.forEach(doc => {
      demandes.push({
        id: doc.id,
        ... doc.data()
      });
    });

    return res.json(demandes);
  } catch (err) {
    console.error('GET /api/admin/demandes error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
app.post('/api/demandes', express.json(), async (req, res) => {
  try {
    if (!USING_FIREBASE) {
      return res.status(400).json({ error: 'Firebase not configured' });
    }

    const {
      localisation,
      nom,
      prenom,
      numTel,
      typeService,
      maxBudget,
      description,
      marie,
      nombreFamille,
      typeLogement
    } = req.body;

    // Validation
    if (!nom || !prenom || !numTel) {
      return res.status(400).json({ error: 'Nom, prénom et téléphone obligatoires' });
    }

    const db = admin.firestore();
    
    const demande = {
      localisation: localisation || "",
      nom: String(nom).trim(),
      prenom: String(prenom).trim(),
      numTel: String(numTel).trim(),
      typeService: typeService ? String(typeService).toLowerCase() : "achat",
      maxBudget: maxBudget ? Number(maxBudget) : null,
      description: description || "",
      dateDemande: new Date().toISOString(),
      marie: marie || "",
      nombreFamille: nombreFamille ? Number(nombreFamille) : null,
      typeLogement: typeLogement || "",
      createdAt: new Date().toISOString()
    };

    // Ajoute à Firestore
    const docRef = await db.collection('demandes').add(demande);

    // Compose l'objet sauvegardé (inclut id) – utile pour le mail
    const saved = { id: docRef.id, ...demande };

    // Envoi email en arrière-plan (non bloquant) — log d'erreur en catch
    sendNewDemandeEmailSMTP(saved).catch(err => {
      console.warn('sendNewDemandeEmailSMTP error:', err);
    });

    // Répond au client sans attendre l'envoi de l'e-mail
    return res.status(201).json({ 
      ok: true, 
      id: docRef.id,
      demande 
    });
  } catch (err) {
    console.error('POST /api/demandes error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
app.delete('/api/admin/demandes/:id', requireAdmin, async (req, res) => {
  try {
    if (!USING_FIREBASE) {
      return res.status(400).json({ error: 'Firebase not configured' });
    }

    const db = admin.firestore();
    await db.collection('demandes'). doc(req.params.id).delete();
    
    return res.json({ ok: true });
  } catch (err) {
    console. error('DELETE /api/admin/demandes/:id error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
// Enregistrer une demande comme contact
app.post('/api/admin/contacts', requireAdmin, express.json(), async (req, res) => {
  try {
    if (! USING_FIREBASE) {
      return res.status(400).json({ error: 'Firebase not configured' });
    }

    const { demandeId, nom, prenom, numTel, typeService, maxBudget, description, localisation, marie, nombreFamille, typeLogement } = req.body;

    if (!demandeId) {
      return res.status(400).json({ error: 'demandeId required' });
    }

    const db = admin.firestore();
    
    const contact = {
      demandeId,
      nom,
      prenom,
      numTel,
      typeService,
      maxBudget: maxBudget ?  Number(maxBudget) : null,
      description,
      localisation,
      marie,
      nombreFamille: nombreFamille ? Number(nombreFamille) : null,
      typeLogement,
      dateEnregistrement: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('contacts').add(contact);

    return res.status(201).json({ 
      ok: true, 
      id: docRef.id,
      contact 
    });
  } catch (err) {
    console.error('POST /api/admin/contacts error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Récupérer tous les contacts
app.get('/api/admin/contacts', requireAdmin, async (req, res) => {
  try {
    if (!USING_FIREBASE) {
      return res.status(400).json({ error: 'Firebase not configured' });
    }

    const db = admin.firestore();
    const snapshot = await db.collection('contacts')
      .orderBy('dateEnregistrement', 'desc')
      .get();

    const contacts = [];
    snapshot.forEach(doc => {
      contacts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.json(contacts);
  } catch (err) {
    console.error('GET /api/admin/contacts error:', err);
    return res. status(500).json({ error: err.message || 'Server error' });
  }
});
app.post('/api/admin/contacts/:id/schedule', requireAdmin, express.json(), async (req, res) => {
  try {
    if (!USING_FIREBASE) return res.status(400).json({ error: 'Firebase not configured' });

    const { id } = req.params;
    const { dateIso, timezone, assignedTo, notes } = req.body;
    if (!dateIso) return res.status(400).json({ error: 'dateIso required (ISO string)' });

    const db = admin.firestore();
    const docRef = db.collection('contacts').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Contact not found' });

    const scheduledCall = {
      dateIso,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      assignedTo: assignedTo || req.admin?.email || null,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      reminderSent: false
    };

    await docRef.update({
      status: 'scheduled',
      scheduledCall,
      updatedAt: new Date().toISOString()
    });

    return res.json({ ok: true, scheduledCall });
  } catch (err) {
    console.error('POST /api/admin/contacts/:id/schedule error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Mettre à jour le status d'un contact
// PUT /api/admin/contacts/:id/status
// body: { status: 'processed'|'not_processed'|'new' }
app.put('/api/admin/contacts/:id/status', requireAdmin, express.json(), async (req, res) => {
  try {
    if (!USING_FIREBASE) return res.status(400).json({ error: 'Firebase not configured' });

    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['processed', 'not_processed', 'new'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const db = admin.firestore();
    const docRef = db.collection('contacts').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Contact not found' });

    await docRef.update({
      status,
      updatedAt: new Date().toISOString()
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/contacts/:id/status error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
// Supprimer un contact
app.delete('/api/admin/contacts/:id', requireAdmin, async (req, res) => {
  try {
    if (!USING_FIREBASE) {
      return res. status(400).json({ error: 'Firebase not configured' });
    }

    const db = admin.firestore();
    await db.collection('contacts').doc(req.params.id).delete();
    
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/contacts/:id error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
/* ---------------------------
   Offres endpoints (LIST / CRUD / publish toggle)
   --------------------------- */

// LIST offres
app.get('/api/admin/offres', requireAdmin, async (req, res) => {
  try {
    if (! USING_FIREBASE) {
      // Fallback au fichier JSON
      const raw = fs.readFileSync(OFFRES_FILE, 'utf8') || '[]';
      const offres = JSON.parse(raw);
      return res.json(offres);
    }

    const db = admin.firestore();
    const snapshot = await db.collection('annonces')
      .orderBy('createdAt', 'desc')
      .get();
    
    const offres = [];
    snapshot.forEach(doc => {
      offres.push({
        id: doc.id,
        ... doc.data()
      });
    });

    return res.json(offres);
  } catch (err) {
    console.error('GET /api/admin/offres error:', err);
    return res. status(500).json({ error: err.message || 'Server error' });
  }
});

// GET single offre
app.get('/api/admin/offres/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    if (USING_FIREBASE) {
      const db = admin.firestore();
      const doc = await db.collection('annonces'). doc(id).get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Offre non trouvée' });
      }

      return res.json({
        id: doc.id,
        ... doc.data()
      });
    } else {
      // Fallback JSON
      const offres = readJson(OFFRES_FILE);
      const found = offres.find(o => Number(o.id) === Number(id));
      if (!found) return res.status(404).json({ error: 'Offre non trouvée' });
      return res.json(found);
    }
  } catch (err) {
    console.error('GET /api/admin/offres/:id error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
// ← MODIFIÉ : Créer annonce dans Firestore + Firebase Storage
app.post('/api/admin/offres', requireAdmin, upload.array('photos', 6), async (req, res) => {
  try {
    const {
      adresse = '',
      descript = '',
      price = '',
      type = '',
      published = 'false',
      lat,
      lng,
      videoId = '',
      videoUrl = ''
    } = req.body;

    const priceNum = price ?  Number(price) : null;
    const publishedBool = (published === 'true' || published === true);

    // Upload photos vers Firebase Storage
    const photoPaths = [];
    if (USING_FIREBASE && req.files && req.files. length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadPhotoToFirebase(file);
          photoPaths.push(url);
        } catch (error) {
          console.error('Failed to upload file:', error);
          return res. status(500).json({ error: 'Failed to upload photo' });
        }
      }
    } else if (req.files && req.files.length > 0) {
      // Fallback local
      photoPaths.push(... req.files.map(f => `/uploads/${path.basename(f.path)}`));
    }

    const createdAt = new Date(). toISOString();

    if (USING_FIREBASE) {
      // Ajouter à Firestore
      const db = admin.firestore();
      const docRef = db.collection('annonces').doc();

      const annonce = {
        adresse,
        descript,
        price: priceNum,
        type,
        published: publishedBool,
        localisation: (lat && lng) ? { 
          lat: Number(lat), 
          lng: Number(lng) 
        } : null,
        photoPaths,
        photos: photoPaths,
        videoId,
        videoUrl,
        createdAt,
        updatedAt: createdAt
      };

      await docRef.set(annonce);

      return res.status(201). json({ 
        ok: true, 
        annonce: {
          id: docRef.id,
          ...annonce
        }
      });
    } else {
      // Fallback fichier JSON
      const offres = readJson(OFFRES_FILE);
      const nextId = offres.length ?  (Math.max(...offres. map(o => Number(o. id) || 0)) + 1) : 1;

      const annonce = {
        id: nextId,
        adresse,
        descript,
        price: priceNum,
        type,
        published: publishedBool,
        localisation: (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null,
        photoPaths,
        photos: photoPaths,
        videoId,
        videoUrl,
        createdAt
      };

      offres.push(annonce);
      writeJson(OFFRES_FILE, offres);
      return res.status(201).json({ ok: true, annonce });
    }
  } catch (err) {
    console.error('POST /api/admin/offres error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// UPDATE offre (supports uploading photos; ?replacePhotos=true to replace)
app.put('/api/admin/offres/:id', requireAdmin, upload.array('photos', 6), async (req, res) => {
  try {
    const id = req.params.id;
    const {
      adresse,
      descript,
      price,
      type,
      published,
      lat,
      lng,
      videoId,
      videoUrl
    } = req.body;

    if (USING_FIREBASE) {
      const db = admin.firestore();
      const doc = await db.collection('annonces'). doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Offre non trouvée' });
      }

      const existing = doc.data();

      // Upload nouvelles photos
      const uploadedPaths = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const url = await uploadPhotoToFirebase(file);
            uploadedPaths.push(url);
          } catch (error) {
            console.error('Failed to upload file:', error);
            return res.status(500).json({ error: 'Failed to upload photo' });
          }
        }
      }

      const replacePhotos = String(req.query.replacePhotos || '').toLowerCase() === 'true';

      const updates = {};
      if (typeof adresse !== 'undefined') updates. adresse = adresse;
      if (typeof descript !== 'undefined') updates.descript = descript;
      if (typeof price !== 'undefined') updates.price = price ?  Number(price) : null;
      if (typeof type !== 'undefined') updates.type = type;
      if (typeof published !== 'undefined') updates.published = (published === 'true' || published === true);
      if (typeof videoId !== 'undefined') updates. videoId = videoId;
      if (typeof videoUrl !== 'undefined') updates.videoUrl = videoUrl;

      if (typeof lat !== 'undefined' && typeof lng !== 'undefined' && lat !== '' && lng !== '') {
        updates.localisation = { lat: Number(lat), lng: Number(lng) };
      }

      if (replacePhotos) {
        updates.photoPaths = uploadedPaths;
        updates.photos = uploadedPaths;
      } else if (uploadedPaths.length > 0) {
        updates.photoPaths = [... (existing.photoPaths || []), ...uploadedPaths];
        updates.photos = updates.photoPaths;
      }

      updates.updatedAt = new Date(). toISOString();

      await db.collection('annonces'). doc(id).update(updates);

      const updated = await db.collection('annonces').doc(id).get();
      return res.json({ 
        ok: true, 
        annonce: {
          id: updated.id,
          ...updated. data()
        }
      });
    } else {
      // Fallback JSON
      const offres = readJson(OFFRES_FILE);
      const idx = offres.findIndex(o => String(o.id) === id);
      if (idx === -1) return res.status(404).json({ error: 'Offre non trouvée' });

      const existing = offres[idx];

      if (typeof adresse !== 'undefined') existing.adresse = adresse;
      if (typeof descript !== 'undefined') existing.descript = descript;
      if (typeof price !== 'undefined') existing. price = price ? Number(price) : null;
      if (typeof type !== 'undefined') existing. type = type;
      if (typeof published !== 'undefined') existing.published = (published === 'true' || published === true);
      if (typeof videoId !== 'undefined') existing.videoId = videoId;
      if (typeof videoUrl !== 'undefined') existing.videoUrl = videoUrl;

      if (typeof lat !== 'undefined' && typeof lng !== 'undefined' && lat !== '' && lng !== '') {
        existing.localisation = { lat: Number(lat), lng: Number(lng) };
      }

      existing.updatedAt = new Date(). toISOString();
      offres[idx] = existing;
      writeJson(OFFRES_FILE, offres);

      return res.json({ ok: true, annonce: existing });
    }
  } catch (err) {
    console.error('PUT /api/admin/offres/:id error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// DELETE offre
app.delete('/api/admin/offres/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params. id;

    if (USING_FIREBASE) {
      const db = admin.firestore();
      await db.collection('annonces'). doc(id).delete();
      return res.json({ ok: true });
    } else {
      // Fallback JSON
      const offres = readJson(OFFRES_FILE);
      const idx = offres.findIndex(o => String(o.id) === id);
      if (idx === -1) return res.status(404).json({ error: 'Offre non trouvée' });
      const [removed] = offres.splice(idx, 1);
      deleteUploadedFiles(removed.photoPaths || []);
      writeJson(OFFRES_FILE, offres);
      return res.json({ ok: true });
    }
  } catch (err) {
    console.error('DELETE /api/admin/offres/:id error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// DELETE single photo from an offre
// Endpoint: DELETE /api/admin/offres/:id/photo
// Body (JSON): { "photoPath": "/uploads/xxxx.jpg" }
app.delete('/api/admin/offres/:id/photo', requireAdmin, express.json(), async (req, res) => {
  try {
    const id = req.params.id;
    const { photoPath } = req.body;
    if (!photoPath) return res.status(400).json({ error: 'photoPath required' });

    if (USING_FIREBASE) {
      const db = admin.firestore();
      const doc = await db.collection('annonces').doc(id). get();

      if (!doc. exists) {
        return res. status(404).json({ error: 'Offre non trouvée' });
      }

      const existing = doc.data();
      const updated = {
        photoPaths: (existing.photoPaths || []). filter(p => p !== photoPath),
        photos: (existing.photos || []).filter(p => p !== photoPath),
        updatedAt: new Date().toISOString()
      };

      await db. collection('annonces').doc(id).update(updated);

      const result = await db.collection('annonces').doc(id).get();
      return res.json({ 
        ok: true, 
        annonce: {
          id: result.id,
          ...result.data()
        }
      });
    } else {
      // Fallback JSON
      const offres = readJson(OFFRES_FILE);
      const idx = offres. findIndex(o => String(o.id) === id);
      if (idx === -1) return res.status(404).json({ error: 'Offre non trouvée' });

      const existing = offres[idx];
      existing.photoPaths = (existing.photoPaths || []). filter(p => p !== photoPath);
      existing.photos = existing.photoPaths;

      try {
        const rel = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
        const full = path.join(__dirname, rel);
        if (fs.existsSync(full)) fs.unlinkSync(full);
      } catch (e) {
        console.warn('Failed to delete file:', photoPath, e. message);
      }

      existing.updatedAt = new Date(). toISOString();
      offres[idx] = existing;
      writeJson(OFFRES_FILE, offres);

      return res.json({ ok: true, annonce: existing });
    }
  } catch (err) {
    console.error('DELETE /api/admin/offres/:id/photo error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
// Import multiple offres from Excel
app.post('/api/admin/offres/import', requireAdmin, express.json(), (req, res) => {
  try {
    const { offres } = req.body;
    
    if (!Array.isArray(offres) || offres.length === 0) {
      return res.status(400).json({ error: 'Tableau d\'offres vide' });
    }

    const allOffres = readJson(OFFRES_FILE);
    
    // Crée les nouvelles offres
    const importedOffres = offres.map((o) => {
      const nextId = allOffres.length ?  (Math.max(...allOffres.map(x => Number(x.id) || 0)) + 1) : 1;
      
      return {
        id: nextId,
        adresse: o.adresse || "",
        descript: o. descript || "",
        price: o.price ?  Number(o.price) : null,
        type: o.type || "",
        published: o.published || false,
        localisation: o.localisation || null,
        photoPaths: [],
        photos: [],
        videoId: o.videoId || "",
        videoUrl: o.videoUrl || "",
        createdAt: o.createdAt || new Date(). toISOString()
      };
    });

    // Ajoute au fichier
    allOffres.push(...importedOffres);
    writeJson(OFFRES_FILE, allOffres);

    return res.json({ 
      ok: true, 
      imported: importedOffres.length,
      message: `${importedOffres.length} annonce(s) importée(s) avec succès`
    });
  } catch (err) {
    console.error('POST /api/admin/offres/import error:', err);
    return res. status(500).json({ error: err.message || 'Server error' });
  }
});
// Toggle publish
app.put('/api/admin/offres/:id/publish', requireAdmin, express.json(), async (req, res) => {
  try {
    const id = req.params.id;
    const { published } = req. body;
    
    if (typeof published === 'undefined') {
      return res.status(400).json({ error: 'published field required' });
    }

    if (USING_FIREBASE) {
      const db = admin.firestore();
      await db.collection('annonces'). doc(id).update({
        published: (published === true || published === 'true'),
        updatedAt: new Date(). toISOString()
      });

      const result = await db.collection('annonces').doc(id).get();
      return res.json({ 
        ok: true, 
        annonce: {
          id: result.id,
          ... result.data()
        }
      });
    } else {
      // Fallback JSON
      const offres = readJson(OFFRES_FILE);
      const idx = offres.findIndex(o => String(o.id) === id);
      if (idx === -1) return res.status(404).json({ error: 'Offre non trouvée' });

      offres[idx].published = (published === true || published === 'true');
      offres[idx]. updatedAt = new Date().toISOString();
      writeJson(OFFRES_FILE, offres);

      return res.json({ ok: true, annonce: offres[idx] });
    }
  } catch (err) {
    console.error('PUT /api/admin/offres/:id/publish error:', err);
    return res.status(500). json({ error: err.message || 'Server error' });
  }
});
// Public endpoint: list published offres for clients
// GET /api/offres? limit=8&page=1&type=a_vendre&q=mot
app.get('/api/offres', async (req, res) => {
  try {
    let offres = [];

    if (USING_FIREBASE) {
      const db = admin.firestore();
      
      // Query published annonces (sans orderBy pour éviter l'erreur d'index)
      const snapshot = await db.collection('annonces')
        .where('published', '==', true)
        .get();
      
      // Récupère les données
      snapshot.forEach(doc => {
        offres. push({ 
          id: doc.id, 
          ...doc.data() 
        });
      });
      
      // Trie par createdAt en JavaScript (décroissant = plus récent d'abord)
      offres.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0). getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } else {
      // Fallback JSON
      const raw = fs.readFileSync(OFFRES_FILE, 'utf8') || '[]';
      offres = JSON.parse(raw). filter(o => !!o. published);
      
      // Trie aussi en JSON
      offres.sort((a, b) => {
        const dateA = new Date(a. createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    // Filters (type et recherche)
    const { limit, page, type, q } = req.query;
    
    if (type) {
      const tNorm = String(type).toLowerCase();
      offres = offres.filter(o => {
        if (! o.type) return false;
        const ot = String(o.type).toLowerCase();
        return ot. includes(tNorm);
      });
    }
    
    if (q) {
      const qlow = String(q).toLowerCase();
      offres = offres.filter(o => 
        (o.adresse || '').toLowerCase().includes(qlow) ||
        (o. descript || '').toLowerCase().includes(qlow)
      );
    }

    // Pagination
    const lim = limit ? Math.max(1, Number(limit)) : undefined;
    const pg = page ? Math.max(1, Number(page)) : 1;
    
    if (lim) {
      const start = (pg - 1) * lim;
      offres = offres.slice(start, start + lim);
    }

    return res.json(offres);
  } catch (err) {
    console.error('Public GET /api/offres error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
app.get('/api/offres/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (USING_FIREBASE) {
      const db = admin.firestore();
      const doc = await db.collection('annonces').doc(id).get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Offre non trouvée' });
      }

      const data = doc.data();
      if (! data. published) {
        return res. status(404).json({ error: 'Offre non trouvée' });
      }

      return res.json({
        id: doc.id,
        ...data
      });
    } else {
      // Fallback JSON
      const offres = readJson(OFFRES_FILE);
      const found = offres.find(o => String(o.id) === id);
      if (!found || !found.published) {
        return res.status(404).json({ error: 'Offre non trouvée' });
      }
      return res.json(found);
    }
  } catch (err) {
    console.error('Public GET /api/offres/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
/* Global error handler for multer/file errors (optional) */
app.use((err, req, res, next) => {
  if (err) {
    console.error('Global error handler:', err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || 'Server error' });
  }
  next();
});

/* ---------------------------
   Start server
   --------------------------- */
app.listen(PORT, () => {
  console.log(`Admin server listening on ${PORT}`);
});