const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Logout l'admin et nettoie les données
 */
export async function logout() {
  try {
    const response = await fetch(`${API}/api/admin/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });

    if (! response.ok) {
      throw new Error("Erreur lors de la déconnexion");
    }

    // Nettoie le localStorage
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    
    // Nettoie le sessionStorage
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_email");

    // Redirige vers la page de login
    window.location.href = "/admin/login";
    
    return true;
  } catch (error) {
    console.error("Erreur logout:", error);
    // Même en cas d'erreur, on redirige
    window.location.href = "/admin/login";
  }
}

/**
 * Vérifie si l'admin est connecté
 */
export async function isAdminLogged() {
  try {
    const response = await fetch(`${API}/api/admin/me`, {
      credentials: "include"
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return !!data.email;
  } catch (error) {
    return false;
  }
}