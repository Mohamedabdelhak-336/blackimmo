import React, { useEffect, useState } from "react";
import { fetchProperties } from "../../services/annonces";
import ListingCard from "../../components/client/ListingCard";

export default function Annonces() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        const data = await fetchProperties(100, 1);
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

  return (
    <div style={{ paddingTop: "80px" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Annonces Publiées</h1>
          <p className="text-gray-600">Découvrez tous les biens immobiliers disponibles</p>
        </div>

        {loading ?  (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">⏳ Chargement des annonces...</p>
          </div>
        ) : error ?  (
          <div className="text-center py-16">
            <p className="text-red-600 text-lg">❌ {error}</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">📭 Aucune annonce disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing._id || listing.id} item={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}