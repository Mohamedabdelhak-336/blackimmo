import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ContactsTable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDesc, setSelectedDesc] = useState(null);

  // Matches modal state
  const [selectedMatches, setSelectedMatches] = useState(null); // { contactId, matches: [] }
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Scheduling UI state
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleContact, setScheduleContact] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(""); // value for input[type=datetime-local]
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API}/api/admin/contacts`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Erreur " + res.status);
        const json = await res.json();
        if (!mounted) return;
        setData(json);
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Erreur réseau");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrice(v) {
    if (v == null) return "-";
    return Number(v).toLocaleString("fr-FR") + " TND";
  }

  // Export contacts to Excel (unchanged)
  function exportToExcel() {
    if (!data || data.length === 0) {
      alert("❌ Aucun contact à exporter");
      return;
    }
    try {
      const rows = data.map((d) => ({
        Nom: d.nom || "-",
        Prénom: d.prenom || "-",
        Téléphone: d.numTel || "-",
        Type:
          d.typeService === "location"
            ? "Location"
            : d.typeService === "vendre"
            ? "Vendre"
            : "Achat",
        "Budget (TND)": d.maxBudget || "-",
        Localisation: d.localisation || "-",
        "Type Logement": d.typeLogement || "-",
        Marié: d.marie === "oui" ? "Oui" : d.marie === "non" ? "Non" : "-",
        "Nb Famille": d.nombreFamille || "-",
        Description: d.description || "-",
        "Date Enregistrement": formatDate(d.dateEnregistrement),
        Status: d.status || "new",
        ScheduledCall: d.scheduledCall ? d.scheduledCall.dateIso : "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
      XLSX.writeFile(workbook, `contacts_${new Date().getTime()}.xlsx`);
      alert("✅ Contacts exportés avec succès !");
    } catch (err) {
      alert("❌ Erreur lors de l'export: " + err.message);
    }
  }

  async function deleteContact(id) {
    if (!confirm("Supprimer ce contact ?")) return;
    try {
      const res = await fetch(`${API}/api/admin/contacts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur suppression");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      alert("Erreur: " + e.message);
    }
  }

  // Open schedule modal for a specific contact (unchanged)
  function openScheduleModal(contact) {
    setScheduleContact(contact);
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    const str = d.toISOString().slice(0, 16);
    setScheduleDate(str);
    setScheduleNotes(contact.scheduledCall?.notes || "");
    setScheduleOpen(true);
  }

  function toIsoFromLocal(localDateTimeLocalString) {
    const d = new Date(localDateTimeLocalString);
    return d.toISOString();
  }

  async function scheduleCall() {
    if (!scheduleContact || !scheduleDate) {
      alert("Choisir date/heure");
      return;
    }
    setScheduleLoading(true);
    try {
      const dateIso = toIsoFromLocal(scheduleDate);
      const res = await fetch(`${API}/api/admin/contacts/${scheduleContact.id}/schedule`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateIso, notes: scheduleNotes }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Erreur programmation");
      }
      const json = await res.json();
      setScheduleOpen(false);
      setScheduleContact(null);
      setScheduleDate("");
      setScheduleNotes("");
      setRefreshKey((k) => k + 1);
      alert("✅ Appel programmé : " + formatDate(json.scheduledCall.dateIso));
    } catch (e) {
      console.error(e);
      alert("Erreur: " + (e.message || e));
    } finally {
      setScheduleLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`${API}/api/admin/contacts/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Erreur mise à jour status");
      }
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      alert("Erreur: " + (e.message || e));
    }
  }

  // --- NEW: fetch matches for a contactId (calls GET /api/admin/contacts/:id/matches)
  async function fetchContactMatches(contactId) {
    try {
      // open modal immediately and show loading state
      setSelectedMatches({ contactId, matches: [] });
      setMatchesLoading(true);

      const res = await fetch(`${API}/api/admin/contacts/${contactId}/matches?top=8`, {
        method: "GET",
        credentials: "include",
        headers: { "Accept": "application/json" },
      });

      const text = await res.text();
      let json = {};
      try { json = text ? JSON.parse(text) : {}; } catch (e) { throw new Error("Réponse API non JSON: " + text); }

      if (!res.ok) throw new Error(json.message || `Erreur serveur (${res.status})`);

      // Normalise the matches array so frontend always has { score, offer } items
      const rawMatches = json.matches || [];
      const normalized = rawMatches.map((item) => {
        // Case 1: backend returns { score, offer, ... } -> keep as is
        if (item && (item.offer || item.offerId)) {
          // if backend returned offerId + sketched data, try to fill
          if (!item.offer && item.offerId) {
            return { score: item.score || 0, offer: { id: item.offerId, price: item.price ?? item.prix ?? null, adresse: item.adresse ?? item.title ?? '' } };
          }
          return item;
        }
        // Case 2: backend returns plain offer object -> wrap it
        if (item && item.id) {
          return { score: 0, offer: item };
        }
        // fallback: preserve original
        return { score: item.score || 0, offer: item.offer || item };
      });

      setSelectedMatches({ contactId, matches: normalized });
    } catch (e) {
      console.error("fetchContactMatches error:", e);
      alert("Erreur récupération matches: " + (e.message || e));
      // keep modal open but show empty list to let user see message
      setSelectedMatches(prev => prev || { contactId, matches: [] });
    } finally {
      setMatchesLoading(false);
    }
  }

  if (loading) return <div className="p-6">⏳ Chargement des contacts…</div>;
  if (err) return <div className="p-6 text-red-600">❌ Erreur: {err}</div>;
  if (!data || data.length === 0) return <div className="p-6">📭 Aucun contact enregistré. </div>;

  return (
    <div className="p-6">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 className="text-2xl font-semibold">Contacts Enregistrés ({data.length})</h2>
        <button onClick={exportToExcel} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", fontSize: "14px", fontWeight: "700", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
          📊 Exporter en Excel
        </button>
      </div>

      <div style={{ overflowX: "auto", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
        <table className="w-full bg-white rounded shadow-sm" style={{ fontSize: "13px" }}>
          <thead>
            <tr className="text-left bg-gradient-to-r from-gray-50 to-gray-100" style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th className="p-3 font-700">Nom</th>
              <th className="p-3 font-700">Prénom</th>
              <th className="p-3 font-700">Téléphone</th>
              <th className="p-3 font-700">Type</th>
              <th className="p-3 font-700">Budget</th>
              <th className="p-3 font-700">Localisation</th>
              <th className="p-3 font-700">Description</th>
              <th className="p-3 font-700">Date Enregistrement</th>
              <th className="p-3 font-700">Suivi</th>
              <th className="p-3 font-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, idx) => {
              const t = (d.typeService || "").toString().toLowerCase().trim();
              let badgeText = "—", bg = "#e5e7eb", color = "#374151";
              if (t === "location") { badgeText = "🏠 Location"; bg = "#fef3c7"; color = "#92400e"; }
              else if (t === "achat") { badgeText = "🛒 Achat"; bg = "#dbeafe"; color = "#0c4a6e"; }
              else if (t === "vendre") { badgeText = "📈 Vendre"; bg = "#fee2e2"; color = "#7f1d1d"; }

              const status = d.status || "new";
              let sBg = "#e5e7eb", sColor = "#374151", sText = "Nouveau";
              if (status === "scheduled") { sBg = "#fff7ed"; sColor = "#92400e"; sText = "Programmé"; }
              else if (status === "processed") { sBg = "#ecfccb"; sColor = "#166534"; sText = "Traité"; }
              else if (status === "not_processed") { sBg = "#fee2e2"; sColor = "#7f1d1d"; sText = "Pas traité"; }

              return (
                <tr key={d.id} className="border-t" style={{ background: idx % 2 === 0 ? "#ffffff" : "#fafbfc", transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f4ff")} onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fafbfc")}>
                  <td className="p-3" style={{ fontWeight: "600", color: "#374151" }}>{d.nom || "-"}</td>
                  <td className="p-3">{d.prenom || "-"}</td>
                  <td className="p-3"><a href={`tel:${d.numTel}`} style={{ color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>{d.numTel || "-"}</a></td>
                  <td className="p-3"><span style={{ background: bg, color: color, padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", display: "inline-block" }}>{badgeText}</span></td>
                  <td className="p-3" style={{ color: "#4f46e5", fontWeight: "700" }}>{formatPrice(d.maxBudget)}</td>
                  <td className="p-3" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {d.localisation || "-"}</td>
                  <td className="p-3" style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#4f46e5", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }} onClick={() => setSelectedDesc(d.description)} title="Cliquer pour voir la description complète">{d.description ? d.description.substring(0, 15) + "..." : "-"}</td>
                  <td className="p-3" style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(d.dateEnregistrement)}</td>
                  <td className="p-3">
                    <div style={{ display: "inline-block", background: sBg, color: sColor, padding: "6px 10px", borderRadius: "8px", fontWeight: "700", fontSize: "12px" }} title={d.scheduledCall ? `Appel prévu: ${formatDate(d.scheduledCall.dateIso)}` : ""}>
                      {sText}
                      {d.scheduledCall && (<div style={{ fontSize: "11px", fontWeight: 600, marginTop: 4 }}>{formatDate(d.scheduledCall.dateIso)}</div>)}
                    </div>
                  </td>
                  <td className="p-3" style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openScheduleModal(d)} style={{ background: "#f59e0b", color: "white", padding: "6px 10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700" }} title="Programmer un appel">📅 Appeler</button>

                    <button onClick={() => updateStatus(d.id, "processed")} style={{ background: "#10b981", color: "white", padding: "6px 10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700" }} title="Marquer Traité">✅ Traité</button>

                    <button onClick={() => updateStatus(d.id, "not_processed")} style={{ background: "#ef4444", color: "white", padding: "6px 10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700" }} title="Marquer Pas traité">❌ Pas traité</button>

                    {/* NEW: Match button */}
                    <button onClick={() => fetchContactMatches(d.id)} style={{ background: "#2563eb", color: "white", padding: "6px 10px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "700" }} title="Voir les offres compatibles">🔎 Match</button>

                    <button onClick={() => deleteContact(d.id)} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", padding: "6px 10px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "700", transition: "all 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")} title="Supprimer">🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Description */}
      {selectedDesc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setSelectedDesc(null)}>
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", maxWidth: "500px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", wordWrap: "break-word", whiteSpace: "pre-wrap" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>📋 Description complète</h3>
            <p style={{ color: "#4b5563", lineHeight: "1.6" }}>{selectedDesc}</p>
            <button onClick={() => setSelectedDesc(null)} style={{ marginTop: "16px", background: "#4f46e5", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "700" }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Matches modal */}
      {selectedMatches && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }} onClick={() => setSelectedMatches(null)}>
          <div style={{ background: "white", padding: "18px", borderRadius: "12px", width: 720, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Matches pour le contact</h3>
              <button onClick={() => setSelectedMatches(null)} aria-label="Fermer">✕</button>
            </div>

            <div style={{ marginTop: 12 }}>
              {matchesLoading ? <div>Chargement...</div> : (
                selectedMatches.matches.length === 0 ? <div>Aucune offre trouvée (même type & ±50% du budget)</div> : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {selectedMatches.matches.map((m) => (
                   <li key={m.offer.id || Math.random()} style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: 12 }}>
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    {/* vignette si dispo */}
    {m.offer.photoPaths && m.offer.photoPaths[0] && (
      <img src={m.offer.photoPaths[0]} alt="thumb" style={{ width: 72, height: 56, objectFit: "cover", borderRadius: 6 }} />
    )}

    <div>
      {/* Référence (fallback à id tronqué) */}
      <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
        { (m.offer.reference || m.offer.ref || (m.offer.id ? `#${String(m.offer.id).slice(0,6)}` : 'Ref inconnue')) }
      </div>

      {/* Adresse / titre */}
      <div style={{ fontSize: 13, color: "#374151", marginTop: 4 }}>
        { m.offer.adresse || m.offer.title || (m.offer.localisation ? `${m.offer.localisation}` : `Offre ${m.offer.id}`) }
      </div>

      {/* Type + Prix */}
      <div style={{ color: "#6b7280", marginTop: 6 }}>
        {(m.offer.type || m.offer.typeService || '').toString()} — {(m.offer.price ?? m.offer.prix ?? "-")} TND
      </div>

      {/* Courte description */}
      {m.offer.descript && (
        <div style={{ marginTop: 6, color: "#374151", fontSize: 13 }}>
          {m.offer.descript.length > 140 ? m.offer.descript.slice(0, 140) + "…" : m.offer.descript}
        </div>
      )}
    </div>
  </div>

  <div style={{ textAlign: "right" }}>
    <div style={{ fontWeight: 800, fontSize: 18 }}>{m.score}%</div>
    <div style={{ marginTop: 8 }}>
      <a href={`/admin/offres/${m.offer.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded bg-green-500 text-white" style={{ textDecoration: 'none' }}>
        Ouvrir
      </a>
    </div>
  </div>
</li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal (unchanged) */}
      {scheduleOpen && scheduleContact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => { if (!scheduleLoading) setScheduleOpen(false); }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Programmer un appel — {scheduleContact.nom} {scheduleContact.prenom}</h3>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Date et heure</label>
              <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Notes</label>
              <textarea value={scheduleNotes} onChange={(e) => setScheduleNotes(e.target.value)} rows={4} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14 }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button onClick={() => { if (!scheduleLoading) setScheduleOpen(false); }} disabled={scheduleLoading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: scheduleLoading ? "not-allowed" : "pointer" }}>Annuler</button>
              <button onClick={scheduleCall} disabled={scheduleLoading} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 800, cursor: scheduleLoading ? "not-allowed" : "pointer" }}>{scheduleLoading ? "Envoi..." : "Programmer l'appel"}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          table { font-size: 11px !important; }
          table th, table td { padding: 8px !important; }
        }
        @media (max-width: 480px) {
          table { font-size: 10px !important; }
          table th, table td { padding: 6px !important; }
        }
      `}</style>
    </div>
  );
}