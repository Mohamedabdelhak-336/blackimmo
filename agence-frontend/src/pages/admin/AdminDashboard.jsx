import React, { useState } from "react";
import AdminNav from "../../components/admin/AdminNav";
import DemandesTable from "../../components/admin/DemandesTable";
import OffresTable from "../../components/admin/OffresTable";
import ContactsTable from "../../components/admin/ContactsTable";
import LogoutButton from "../../components/ui/LogoutButton";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [tab, setTab] = useState("demandes");
  const nav = useNavigate();

  function goCreate() {
    nav("/admin/offres/create");
  }

  return (
    <>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
        borderBottom: "1px solid #e2e8f0",
        padding: "16px 24px",
        marginBottom: "24px"
      }}>
        <div className="max-w-7xl mx-auto" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
              Bienvenue dans votre dashboard Admin
            </h1>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "0" }}>
              Gérez vos demandes, contacts et annonces
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={goCreate}
              style={{
                background: "linear-gradient(135deg, #4f46e5, #6150f3)",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(79, 70, 229, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style. transform = "translateY(0)";
                e.currentTarget. style.boxShadow = "0 4px 12px rgba(79, 70, 229, 0.3)";
              }}
            >
              + Ajouter annonce
            </button>

            <LogoutButton className="small" redirectTo="/admin/login" />
          </div>
        </div>
      </div>

      {/* Navigation Onglets */}
      <div style={{
        borderBottom: "2px solid #e5e7eb",
        background: "white"
      }}>
        <div className="max-w-7xl mx-auto" style={{ display: "flex", gap: "0", paddingLeft: "24px", paddingRight: "24px" }}>
          {[
            { id: "demandes", label: "📋 Demandes", icon: "" },
            { id: "contacts", label: "👥 Contacts", icon: "" },
            { id: "offres", label: "🏠 Offres", icon: "" }
          ].map(tab_item => (
            <button
              key={tab_item.id}
              onClick={() => setTab(tab_item.id)}
              style={{
                padding: "14px 20px",
                fontSize: "14px",
                fontWeight: "600",
                background: tab === tab_item.id ? "#4f46e5" : "transparent",
                color: tab === tab_item.id ? "white" : "#6b7280",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom: tab === tab_item.id ? "3px solid #4f46e5" : "none",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (tab !== tab_item.id) {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (tab !== tab_item.id) {
                  e.currentTarget. style.background = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }
              }}
            >
              {tab_item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        {tab === "demandes" && <DemandesTable />}
        {tab === "contacts" && <ContactsTable />}
        {tab === "offres" && <OffresTable />}
      </section>

      {/* Floating Action Button */}
      <button
        onClick={goCreate}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4f46e5, #6150f3)",
          color: "white",
          border: "none",
          fontSize: "28px",
          fontWeight: "700",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
          transition: "all 0.3s ease",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onMouseEnter={(e) => {
          e.currentTarget. style.transform = "scale(1.1)";
          e. currentTarget.style.boxShadow = "0 12px 32px rgba(79, 70, 229, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style. transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(79, 70, 229, 0.4)";
        }}
        title="Ajouter une annonce"
      >
        +
      </button>

      {/* CSS Responsive */}
      <style>{`
        @media (max-width: 1024px) {
          .max-w-7xl {
            flex-direction: column ! important;
            gap: 12px !important;
          }
        }

        @media (max-width: 768px) {
          /* Header */
          .admin-dashboard-header {
            flex-direction: column !important;
            gap: 12px !important;
            padding: 12px 16px !important;
          }

          . admin-dashboard-header h1 {
            font-size: 18px !important;
          }

          .admin-dashboard-header p {
            font-size: 12px !important;
          }

          /* Buttons */
          button {
            padding: 8px 16px !important;
            font-size: 13px !important;
          }

          /* Navigation Tabs */
          [style*="borderBottom: 2px solid #e5e7eb"] {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          [style*="borderBottom: 2px solid #e5e7eb"] button {
            padding: 12px 16px !important;
            font-size: 13px !important;
            white-space: nowrap;
          }

          /* Content */
          section {
            padding: 12px 16px !important;
          }

          /* FAB */
          button[style*="position: fixed"] {
            width: 48px !important;
            height: 48px !important;
            font-size: 24px !important;
            bottom: 16px !important;
            right: 16px !important;
          }
        }

        @media (max-width: 480px) {
          /* Header */
          .admin-dashboard-header {
            flex-direction: column !important;
            gap: 8px !important;
            padding: 8px 12px !important;
          }

          .admin-dashboard-header h1 {
            font-size: 16px !important;
          }

          .admin-dashboard-header p {
            font-size: 11px !important;
          }

          /* Buttons */
          button {
            padding: 6px 12px !important;
            font-size: 12px ! important;
          }

          /* Navigation Tabs */
          [style*="borderBottom: 2px solid #e5e7eb"] button {
            padding: 10px 12px !important;
            font-size: 12px ! important;
          }

          /* Content */
          section {
            padding: 8px 12px !important;
          }

          /* Table */
          table {
            font-size: 11px !important;
          }

          table th, table td {
            padding: 6px ! important;
          }

          /* FAB */
          button[style*="position: fixed"] {
            width: 44px !important;
            height: 44px !important;
            font-size: 20px ! important;
            bottom: 12px !important;
            right: 12px !important;
          }
        }
      `}</style>
    </>
  );
}