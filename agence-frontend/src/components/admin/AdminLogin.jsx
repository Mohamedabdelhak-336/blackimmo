import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/*
  AdminLogin :
  - Utilise VITE_API_URL pour requêtes backend (compatible prod Vercel/Railway)
  - show/hide password
  - message d'erreur animé
  - bouton état de chargement
  - envoie POST /api/admin/login (credentials include)
*/

const API_URL = import.meta.env.VITE_API_URL; // Dépend de ta variable d’environnement

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@tonsite.com");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        credentials: "include", // important pour le cookie JWT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }
      // success
      setLoading(false);
      nav("/admin/dashboard");
    } catch (err) {
      setError("Erreur réseau — réessayez");
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrapper flex items-center justify-center min-h-[calc(100vh-64px)]">
      <form
        onSubmit={handleSubmit}
        className="admin-login-card w-full max-w-md bg-white rounded-lg shadow-lg p-8 animate-fade-in"
        aria-label="Formulaire de connexion admin"
      >
        <h2 className="text-2xl font-semibold mb-6">Connexion Admin</h2>

        {error && (
          <div role="alert" className="error-alert mb-4" aria-live="assertive">
            {error}
          </div>
        )}

        <label className="block mb-3">
          <div className="text-sm text-gray-600 mb-2">Adresse email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field w-full"
            placeholder="admin@tonsite.com"
            autoComplete="username"
          />
        </label>

        <label className="block mb-4 relative">
          <div className="text-sm text-gray-600 mb-2">Mot de passe</div>
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field w-full pr-12"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="show-toggle absolute right-3 top-[38px] text-sm text-gray-600"
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {show ? "Cacher" : "Voir"}
          </button>
        </label>

        <button
          type="submit"
          className={`btn-submit w-full py-3 rounded-md font-semibold ${loading ? "loading" : ""}`}
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
          {loading && <span className="spinner" aria-hidden="true"></span>}
        </button>

        <p className="mt-4 text-sm text-gray-500">
          Seul le compte admin peut accéder au tableau de bord.
        </p>
      </form>
    </div>
  );
}