import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AdminGuard({ children }) {
  const [isAuth, setIsAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch(`${API}/api/admin/me`, {
          credentials: "include",
          method: "GET"
        });

        if (! response.ok) {
          setIsAuth(false);
        } else {
          const data = await response.json();
          setIsAuth(!! data.email);
        }
      } catch (error) {
        console. error("Auth check error:", error);
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f9fafb"
      }}>
        <div style={{
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "16px"
          }}>⏳</div>
          <p style={{
            fontSize: "16px",
            color: "#6b7280"
          }}>Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}