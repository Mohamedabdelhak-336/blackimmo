import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function DemandesTable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDesc, setSelectedDesc] = useState(null);
  const [enregistredIds, setEnregistredIds] = useState(new Set());
  
  // États pour la recherche et le filtrage
  const [searchText, setSearchText] = useState("");
  const [filterPrice, setFilterPrice] = useState("all");
  const [filterType, setFilterType] = useState("all"); // ← garde "all" par défaut
  const [filterRegistered, setFilterRegistered] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  // --- NEW: Add modal states & form ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const initialForm = {
    nom: "",
    prenom: "",
    numTel: "",
    typeService: "achat",
    maxBudget: "",
    localisation: "",
    description: "",
    marie: "",
    nombreFamille: "",
    typeLogement: ""
  };
  const [form, setForm] = useState(initialForm);
  const [formErr, setFormErr] = useState("");

  function openAddModal() {
    setForm(initialForm);
    setFormErr("");
    setShowAddModal(true);
  }
  function closeAddModal() {
    setShowAddModal(false);
    setFormErr("");
  }
  function changeField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function submitAddDemande(e) {
    e && e.preventDefault();
    setFormErr("");
    if (!form.nom || !form.prenom || !form.numTel) {
      setFormErr("Nom, prénom et téléphone sont obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = `${API}/api/admin/demandes`;
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localisation: form.localisation,
          nom: form.nom,
          prenom: form.prenom,
          numTel: form.numTel,
          typeService: form.typeService,
          maxBudget: form.maxBudget ? Number(form.maxBudget) : null,
          description: form.description,
          marie: form.marie,
          nombreFamille: form.nombreFamille ? Number(form.nombreFamille) : null,
          typeLogement: form.typeLogement
        })
      });

      if (res.status === 404) {
        // fallback public
        const fallback = await fetch(`${API}/api/demandes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localisation: form.localisation,
            nom: form.nom,
            prenom: form.prenom,
            numTel: form.numTel,
            typeService: form.typeService,
            maxBudget: form.maxBudget ? Number(form.maxBudget) : null,
            description: form.description,
            marie: form.marie,
            nombreFamille: form.nombreFamille ? Number(form.nombreFamille) : null,
            typeLogement: form.typeLogement
          })
        });
        if (!fallback.ok) throw new Error("Erreur création (fallback) " + fallback.status);
        alert("✅ Demande ajoutée (fallback public).");
      } else if (!res.ok) {
        const txt = await res.text().catch(()=>null);
        throw new Error("Erreur création: " + (txt || res.status));
      } else {
        alert("✅ Demande ajoutée avec succès !");
      }

      closeAddModal();
      setRefreshKey(k => k + 1);
    } catch (err) {
      setFormErr(err.message || "Erreur serveur");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }
  // --- END modal/form code ---

  useEffect(() => {
    let mounted = true;
    
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const resD = await fetch(`${API}/api/admin/demandes`, { 
          credentials: "include" 
        });
        if (!resD.ok) throw new Error("Erreur " + resD.status);
        const jsonD = await resD.json();
        
        const resC = await fetch(`${API}/api/admin/contacts`, {
          credentials: "include"
        });
        if (resC.ok) {
          const jsonC = await resC.json();
          const enregistredSet = new Set(jsonC.map(c => c.demandeId));
          if (mounted) {
            setEnregistredIds(enregistredSet);
          }
        }
        
        if (!mounted) return;
        setData(jsonD);
      } catch (e) {
        if (! mounted) return;
        setErr(e.message || "Erreur réseau");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  // Fonction pour filtrer et rechercher
  function getFilteredData() {
    if (!data) return [];
    
    let filtered = [... data];

    // 1.  RECHERCHE par texte
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(d => 
        (d.nom || "").toLowerCase().includes(search) ||
        (d.prenom || "").toLowerCase().includes(search) ||
        (d.numTel || "").toLowerCase().includes(search) ||
        (d.localisation || "").toLowerCase().includes(search) ||
        (d.description || "").toLowerCase().includes(search)
      );
    }

    // 2. FILTRAGE par TYPE (location / achat / vendre)
    if (filterType !== "all") {
      filtered = filtered.filter(d => {
        const t = (d.typeService || "").toString().toLowerCase();
        return t === filterType;
      });
    }

    // 3. FILTRAGE par PRIX (LOGIQUE)
    if (filterPrice !== "all") {
      filtered = filtered.filter(d => {
        const price = d.maxBudget || 0;
        if (filterPrice === "500-1000") return price >= 500 && price < 1000;
        if (filterPrice === "1000-2000") return price >= 1000 && price < 2000;
        if (filterPrice === "50000-100000") return price >= 50000 && price < 100000;
        if (filterPrice === "100000plus") return price >= 100000;
        return true;
      });
    }

    // 4. FILTRAGE par DATE (CORRIGÉ)
    if (filterDate !== "all") {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset to midnight
      
      filtered = filtered.filter(d => {
        const demandDate = new Date(d.dateDemande || 0);
        demandDate.setHours(0, 0, 0, 0); // Reset to midnight
        
        const diffDays = Math.floor((now - demandDate) / (1000 * 60 * 60 * 24));
        
        if (filterDate === "today") return diffDays === 0;
        if (filterDate === "week") return diffDays >= 0 && diffDays < 7;
        if (filterDate === "month") return diffDays >= 0 && diffDays < 30;
        return true;
      });
    }

    // 5. FILTRAGE par ENREGISTREMENT (Enregistré ou Non)
    if (filterRegistered !== "all") {
      if (filterRegistered === "registered") {
        filtered = filtered.filter(d => enregistredIds.has(d.id));
      } else if (filterRegistered === "notregistered") {
        filtered = filtered.filter(d => !enregistredIds.has(d.id));
      }
    }

    return filtered;
  }

  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatPrice(v) {
    if (v == null) return "-";
    return Number(v).toLocaleString("fr-FR") + " TND";
  }

  async function enregistrerContact(demande) {
    try {
      const res = await fetch(`${API}/api/admin/contacts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandeId: demande.id,
          nom: demande.nom,
          prenom: demande.prenom,
          numTel: demande.numTel,
          typeService: demande.typeService,
          maxBudget: demande.maxBudget,
          description: demande.description,
          localisation: demande.localisation,
          marie: demande.marie,
          nombreFamille: demande.nombreFamille,
          typeLogement: demande.typeLogement
        })
      });

      if (! res.ok) throw new Error("Erreur enregistrement");
      
      alert("✅ Contact enregistré avec succès !");
      setEnregistredIds(prev => new Set([...prev, demande.id]));
      
    } catch (e) {
      alert("❌ Erreur: " + e.message);
    }
  }

  async function deleteDemande(id) {
    if (! confirm("Supprimer cette demande ?")) return;
    try {
      const res = await fetch(`${API}/api/admin/demandes/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Erreur suppression");
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert("Erreur: " + e.message);
    }
  }

  if (loading) return <div className="p-6">⏳ Chargement des demandes…</div>;
  if (err) return <div className="p-6 text-red-600">❌ Erreur: {err}</div>;
  if (! data || data.length === 0) return <div className="p-6">📭 Aucune demande trouvée.  </div>;

  const filteredData = getFilteredData();

  return (
    <div className="p-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 className="text-2xl font-semibold">Demandes ({filteredData.length})</h2>

        {/* Animated Add button */}
        <button
          onClick={openAddModal}
          aria-label="Ajouter une demande"
          style={{
            background: "linear-gradient(135deg,#06b6d4,#7c3aed)",
            color: "white",
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(124,58,237,0.18)",
            transform: "translateY(0)",
            transition: "transform 180ms ease, box-shadow 180ms ease"
          }}
          onMouseEnter={(e)=>{ e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(124,58,237,0.22)"; }}
          onMouseLeave={(e)=>{ e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.18)"; }}
        >
          ✨ Ajouter une demande
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div style={{
        background: "white",
        padding: "16px",
        borderRadius: "12px",
        marginBottom: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {/* RECHERCHE */}
          <input
            type="text"
            placeholder="🔍 Rechercher (nom, téléphone, localisation... )"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              flex: 1,
              minWidth: "250px",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
            onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
          />

          {/* FILTRAGE TYPE */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              background: "white",
              color: "#374151"
            }}
          >
            <option value="all">🏠 Tous les types</option>
            <option value="location">🏠 Location</option>
            <option value="achat">🛒 Achat</option>
            <option value="vendre">📈 Vendre</option> {/* ← ajouté */}
          </select>

          {/* FILTRAGE PRIX */}
          <select
            value={filterPrice}
            onChange={(e) => setFilterPrice(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              background: "white",
              color: "#374151"
            }}
          >
            <option value="all">💰 Tous les budgets</option>
            <option value="500-1000">💰 500 - 1 000 TND</option>
            <option value="1000-2000">💰 1 000 - 2 000 TND</option>
            <option value="50000-100000">💰 50 000 - 100 000 TND</option>
            <option value="100000plus">💰 100 000+ TND</option>
          </select>

          {/* FILTRAGE DATE */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              background: "white",
              color: "#374151"
            }}
          >
            <option value="all">📅 Toutes les dates</option>
            <option value="today">📅 Aujourd'hui</option>
            <option value="week">📅 Cette semaine</option>
            <option value="month">📅 Ce mois</option>
          </select>

          {/* FILTRAGE ENREGISTREMENT */}
          <select
            value={filterRegistered}
            onChange={(e) => setFilterRegistered(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              background: "white",
              color: "#374151"
            }}
          >
            <option value="all">👤 Tous les contacts</option>
            <option value="registered">✅ Enregistrés</option>
            <option value="notregistered">❌ Non enregistrés</option>
          </select>

          {/* BOUTON RÉINITIALISER */}
          <button
            onClick={() => {
              setSearchText("");
              setFilterPrice("all");
              setFilterType("all");
              setFilterDate("all");
              setFilterRegistered("all");
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "white",
              color: "#6b7280",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            ↺ Réinitialiser
          </button>
        </div>
      </div>

      {/* Message si aucun résultat */}
      {filteredData.length === 0 && (
        <div style={{
          background: "#fef3c7",
          color: "#92400e",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "16px",
          textAlign: "center",
          fontWeight: "600"
        }}>
          ⚠️ Aucune demande trouvée avec ces critères
        </div>
      )}

      {/* Tableau Responsive */}
      <div style={{ 
        overflowX: "auto", 
        borderRadius: "12px", 
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb"
      }}>
        <table className="w-full bg-white rounded shadow-sm" style={{ fontSize: "13px" }}>
          <thead>
            <tr className="text-left bg-gradient-to-r from-gray-50 to-gray-100" style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th className="p-3 font-700">Nom</th>
              <th className="p-3 font-700">Prénom</th>
              <th className="p-3 font-700">Téléphone</th>
              <th className="p-3 font-700">Type</th>
              <th className="p-3 font-700">Budget</th>
              <th className="p-3 font-700">Localisation</th>
              <th className="p-3 font-700">Type Logement</th>
              <th className="p-3 font-700">Marié</th>
              <th className="p-3 font-700">Nb Famille</th>
              <th className="p-3 font-700">Description</th>
              <th className="p-3 font-700">Date</th>
              <th className="p-3 font-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((d, idx) => {
              // normalize type for display
              const t = (d.typeService || "").toString().toLowerCase().trim();
              let badgeText = "—", bg = "#e5e7eb", color = "#374151";
              if (t === "location") { badgeText = "🏠 Location"; bg = "#fef3c7"; color = "#92400e"; }
              else if (t === "achat") { badgeText = "🛒 Achat"; bg = "#dbeafe"; color = "#0c4a6e"; }
              else if (t === "vendre") { badgeText = "📈 Vendre"; bg = "#fee2e2"; color = "#7f1d1d"; }

              return (
              <tr 
                key={d.id} 
                className="border-t"
                style={{
                  background: idx % 2 === 0 ? "#ffffff" : "#fafbfc",
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f0f4ff"}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#ffffff" : "#fafbfc"}
              >
                <td className="p-3" data-label="Nom">
                  <span style={{ fontWeight: "600", color: "#374151" }}>{d.nom || "-"}</span>
                </td>
                <td className="p-3" data-label="Prénom">
                  {d.prenom || "-"}
                </td>
                <td className="p-3" data-label="Téléphone">
                  <a href={`tel:${d.numTel}`} style={{ color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>
                    {d.numTel || "-"}
                  </a>
                </td>
                <td className="p-3" data-label="Type">
                  <span style={{
                    background: bg,
                    color: color,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                    display: "inline-block"
                  }}>
                    {badgeText}
                  </span>
                </td>
                <td className="p-3" data-label="Budget" style={{ color: "#4f46e5", fontWeight: "700" }}>
                  {formatPrice(d.maxBudget)}
                </td>
                <td className="p-3" data-label="Localisation" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  📍 {d.localisation || "-"}
                </td>
                <td className="p-3" data-label="Type Logement">
                  <span style={{
                    background: "#e0e7ff",
                    color: "#3730a3",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                    display: "inline-block"
                  }}>
                    {d.typeLogement || "-"}
                  </span>
                </td>
                <td className="p-3" data-label="Marié" style={{ textAlign: "center" }}>
                  {d.marie === "oui" ? "✅" : d.marie === "non" ? "❌" : "-"}
                </td>
                <td className="p-3" data-label="Nb Famille" style={{ textAlign: "center" }}>
                  {d.nombreFamille || "-"}
                </td>
                <td 
                  className="p-3" 
                  data-label="Description" 
                  style={{ 
                    maxWidth: "150px", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    whiteSpace: "nowrap",
                    color: "#4f46e5",
                    cursor: "pointer",
                    fontWeight: "600",
                    textDecoration: "underline"
                  }}
                  onClick={() => setSelectedDesc(d.description)}
                  title="Cliquer pour voir la description complète"
                >
                  {d.description ? d.description.substring(0, 15) + "..." : "-"}
                </td>
                <td className="p-3" data-label="Date" style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                  {formatDate(d.dateDemande)}
                </td>
                <td className="p-3" data-label="Actions" style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => enregistrerContact(d)}
                    disabled={enregistredIds.has(d.id)}
                    style={{
                      background: enregistredIds.has(d.id) ? "#9ca3af" : "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "none",
                      cursor: enregistredIds.has(d.id) ? "not-allowed" : "pointer",
                      fontSize: "11px",
                      fontWeight: "700",
                      transition: "all 0.2s ease",
                      opacity: enregistredIds.has(d.id) ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!enregistredIds.has(d.id)) {
                        e.currentTarget.style.opacity = "0.9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!enregistredIds.has(d.id)) {
                        e.currentTarget.style.opacity = "1";
                      }
                    }}
                    title={enregistredIds.has(d.id) ? "Ce contact est déjà enregistré" : "Enregistrer ce contact"}
                  >
                    {enregistredIds.has(d.id) ? "✅ Enregistré" : "💾 Enregistrer"}
                  </button>
                  <button
                    onClick={() => deleteDemande(d.id)}
                    style={{
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "700",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Modal Description */}
      {selectedDesc && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setSelectedDesc(null)}
        >
          <div 
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "500px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>
              📋 Description complète
            </h3>
            <p style={{ color: "#4b5563", lineHeight: "1.6" }}>
              {selectedDesc}
            </p>
            <button
              onClick={() => setSelectedDesc(null)}
              style={{
                marginTop: "16px",
                background: "#4f46e5",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: "700"
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Animated Add Modal */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={closeAddModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,11,13,0.36)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            backdropFilter: "blur(4px)",
            animation: "fadeIn 220ms ease"
          }}
        >
          <form
            onClick={(e)=>e.stopPropagation()}
            onSubmit={submitAddDemande}
            style={{
              width: 720,
              maxWidth: "94%",
              background: "linear-gradient(180deg, #ffffff, #fbfdff)",
              borderRadius: 14,
              padding: 20,
              boxShadow: "0 30px 80px rgba(2,6,23,0.36)",
              transformOrigin: "center",
              animation: "popIn 260ms cubic-bezier(.2,.9,.3,1)"
            }}
          >
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <h3 style={{margin:0}}>➕ Ajouter une demande</h3>
              <button type="button" onClick={closeAddModal} style={{background:"transparent", border:"none", fontSize:18, cursor:"pointer"}}>✕</button>
            </div>

            {formErr && <div style={{color:"red", marginBottom:8}}>{formErr}</div>}

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
              <input placeholder="Nom *" value={form.nom} onChange={e=>changeField("nom", e.target.value)} />
              <input placeholder="Prénom *" value={form.prenom} onChange={e=>changeField("prenom", e.target.value)} />
              <input placeholder="Téléphone *" value={form.numTel} onChange={e=>changeField("numTel", e.target.value)} />
              <select value={form.typeService} onChange={e=>changeField("typeService", e.target.value)}>
                <option value="achat">Achat</option>
                <option value="vendre">Vendre</option>
                <option value="location">Location</option>
              </select>
              <input placeholder="Budget (TND)" type="number" value={form.maxBudget} onChange={e=>changeField("maxBudget", e.target.value)} />
              <input placeholder="Localisation" value={form.localisation} onChange={e=>changeField("localisation", e.target.value)} />
              <input placeholder="Type logement (ex: S+1, villa)" value={form.typeLogement} onChange={e=>changeField("typeLogement", e.target.value)} />
              <input placeholder="Nombre de personnes/famille" type="number" value={form.nombreFamille} onChange={e=>changeField("nombreFamille", e.target.value)} />
              <select value={form.marie} onChange={e=>changeField("marie", e.target.value)}>
                <option value="">Marié?</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
              <textarea placeholder="Description" value={form.description} onChange={e=>changeField("description", e.target.value)} style={{gridColumn:"1 / -1"}} />
            </div>

            <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:12}}>
              <button type="button" onClick={closeAddModal} style={{padding:"8px 12px"}} disabled={submitting}>Annuler</button>
              <button type="submit" style={{padding:"8px 12px", background:"#4f46e5", color:"white", borderRadius:8, border:"none"}} disabled={submitting}>
                {submitting ? "En cours..." : "Créer la demande"}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          0% { transform: translateY(12px) scale(.95); opacity: 0; }
          60% { transform: translateY(-6px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        input, select, textarea, button { font-size:14px; padding:8px; border:1px solid #d1d5db; border-radius:6px; }
        textarea { min-height:80px; resize:vertical; }
        form input::placeholder, form textarea::placeholder { color:#9ca3af; }
        @media (max-width: 600px) {
          form div[style*="grid"] { grid-template-columns: 1fr !important; }
        }
        /* subtle floating pulse for Add button */
        button[aria-label="Ajouter une demande"] {
          animation: pulseShadow 3s infinite;
        }
        @keyframes pulseShadow {
          0% { box-shadow: 0 8px 24px rgba(124,58,237,0.18); transform: translateY(0); }
          50% { box-shadow: 0 22px 48px rgba(124,58,237,0.12); transform: translateY(-2px); }
          100% { box-shadow: 0 8px 24px rgba(124,58,237,0.18); transform: translateY(0); }
        }
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