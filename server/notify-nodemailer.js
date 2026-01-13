const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT || 465);
const secure = String(process.env.SMTP_SECURE || 'true') === 'true'; // true for 465, false for 587
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

if (!user || !pass) {
  console.warn('SMTP_USER or SMTP_PASS missing. SMTP emails will not be sent.');
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user && pass ? { user, pass } : undefined,
  // optional TLS tweaks:
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * sendNewDemandeEmailSMTP(demande)
 * demande: object with fields (nom, prenom, numTel, typeService, maxBudget, localisation, description, id, dateDemande...)
 */
async function sendNewDemandeEmailSMTP(demande) {
  try {
    if (!user || !pass) {
      console.warn('SMTP credentials missing — skipping email.');
      return;
    }
    const to = process.env.NOTIFY_ADMIN_EMAIL;
    if (!to) {
      console.warn('NOTIFY_ADMIN_EMAIL not set — skipping email.');
      return;
    }

    const from = process.env.SMTP_FROM || user; // fallback sender
    const subject = `Nouvelle demande (${demande.typeService || 'demande'}) — ${demande.nom || ''} ${demande.prenom || ''}`;
    const clientOrigin = process.env.CLIENT_ORIGIN || '';
    const viewLink = clientOrigin ? `${clientOrigin}/admin/dashboard` : '';

    const html = `
      <h2>Nouvelle demande reçue</h2>
      <p><strong>Nom :</strong> ${demande.nom || '-'}</p>
      <p><strong>Prénom :</strong> ${demande.prenom || '-'}</p>
      <p><strong>Téléphone :</strong> ${demande.numTel || '-'}</p>
      <p><strong>Type :</strong> ${demande.typeService || '-'}</p>
      <p><strong>Budget / Prix :</strong> ${demande.maxBudget != null ? demande.maxBudget : '-'}</p>
      <p><strong>Localisation :</strong> ${demande.localisation || '-'}</p>
      <p><strong>Description :</strong> ${demande.description || '-'}</p>
      <p><strong>Créé le :</strong> ${demande.dateDemande || demande.createdAt || new Date().toISOString()}</p>
      ${viewLink ? `<p><a href="${viewLink}" target="_blank">Voir le dashboard admin</a></p>` : ''}
      <hr/>
      <p style="font-size:12px;color:#666">Ce message est automatique.</p>
    `;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    console.log('✅ SMTP email envoyé:', info.messageId);
  } catch (err) {
    console.error('❌ Erreur envoi SMTP:', err && err.message ? err.message : err);
  }
}

module.exports = { sendNewDemandeEmailSMTP, transporter };