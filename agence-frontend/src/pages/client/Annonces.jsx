import React, { useEffect, useState } from "react";
import { fetchProperties } from "../../services/annonces";
import ListingCard from "../../components/client/ListingCard";

// Barre de recherche intelligente
function SearchBar({ placeholder, value, onChange }) {
  return (
    <input
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full border rounded-lg px-4 py-2 text-base shadow-sm outline-none"
      style={{
        background: "#fff",
        maxWidth: 420
      }}
      autoComplete="off"
    />
  );
}

// Sélecteur du type d'offre
function TypeFilter({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border rounded-lg px-3 py-2 text-base bg-white shadow-sm outline-none"
      style={{ minWidth: 120 }}
    >
      <option value="">Tous types</option>
      <option value="À louer">Location</option>
      <option value="À vendre">Vente</option>
    </select>
  );
}

export default function Annonces() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Etat pour le filtre RECHERCHE et TYPE d'offre
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  // Refiltrage local (éventuellement filtrage serveur si tu modifies fetchProperties)
  const filterListings = (original) => {
    let filtered = original;
    // Filtre par type
    if (type) {
      filtered = filtered.filter(
        (item) =>
          (item.type && item.type.toLowerCase() === type.toLowerCase())
      );
    }
    // Filtre par recherche intelligente (ville/titre/type/prix)
    if (search && search.length > 1) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        item =>
          (item.adresse && item.adresse.toLowerCase().includes(q)) ||
          (item.titre && item.titre.toLowerCase().includes(q)) ||
          (item.type && item.type.toLowerCase().includes(q)) ||
          (item.price && String(item.price).toLowerCase().includes(q))
      );
    }
    return filtered;
  };

  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        const data = await fetchProperties(100, 1); // change si besoin
        setListings(data || []);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des annonces:", err);
        setError("Erreur lors du chargement des annonces");
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  const filteredListings = filterListings(listings);

  return (
    <div style={{ paddingTop: "80px" }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
        <div className="mb-10 flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-end">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">Annonces Publiées</h1>
            <p className="text-gray-600">Découvrez tous les biens immobiliers disponibles</p>
          </div>
          <div className="flex flex-col gap-3 sm:gap-4 w-full sm:w-auto sm:flex-row">
            <TypeFilter value={type} onChange={setType} />
            <SearchBar
              placeholder="Recherche par ville, prix, description..."
              value={search}
              onChange={setSearch}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">⏳ Chargement des annonces...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 text-lg">❌ {error}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">📭 Aucune annonce disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard key={listing._id || listing.id} item={listing} />
            ))}
          </div>
        )}
      </div>
      {/* Mini responsive pour le padding mobile */}
      <style>{`
        @media (max-width: 640px) {
          .max-w-7xl {
            padding-left: 2vw !important;
            padding-right: 2vw !important;
          }
        }
      `}</style>
    </div>
  );
}