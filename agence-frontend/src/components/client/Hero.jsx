import React from "react";
import heroImg from "../../assets/hero.jpg";
import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section
      className="hero bg-center bg-cover"
      style={{ backgroundImage: `url(${heroImg})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Mr Black Immobilier — Trouvez votre future chez‑vous</h1>
          <p className="mt-4 text-white/80">Ventes et locations à Tunis et partout en Tunisie.  Photos, vidéos et contact direct avec l'agence. </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/annonces" className="px-5 py-3 rounded-md text-white font-medium" style={{background: "linear-gradient(90deg,var(--brand),var(--brand-2))"}}>Voir les annonces</a>
            
          </div>

          {/* SearchBar connecté au SearchContext */}
          <div className="mt-8 max-w-xl glass p-3 rounded-md">
            <SearchBar placeholder="Rechercher par ville, type ou prix..." />
          </div>
        </div>
      </div>
    </section>
  );
}