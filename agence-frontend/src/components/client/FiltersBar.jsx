import React, { useEffect, useState } from "react";
import { useSearch } from "../../context/SearchContext";

export default function FiltersBar() {
  const { filters, updateFilter, sort, setSort, setPage } = useSearch();
  const [local, setLocal] = useState(filters);

  useEffect(() => { setLocal(filters); }, [filters]);

  function applyAndSearch(patch) {
    updateFilter(patch);
    setPage(1);
  }

  return (
    <div
      className="filters-bar glass p-3 rounded-md"
      style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
    >
      {/* Type d'offre */}
      <select
        value={local.type || ""}
        onChange={e => {
          setLocal(l => ({ ...l, type: e.target.value }));
          applyAndSearch({ type: e.target.value });
        }}
      >
        <option value="">Tous types</option>
        <option value="À louer">Location</option>
        <option value="À vendre">Vente</option>
      </select>

      {/* Tri */}
      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 14, color: "#555" }}>Trier :</label>
        <select
          value={sort}
          onChange={e => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="date_desc">Date (récent)</option>
          <option value="date_asc">Date (ancien)</option>
          <option value="price_asc">Prix (croissant)</option>
          <option value="price_desc">Prix (décroissant)</option>
        </select>
      </div>
    </div>
  );
}