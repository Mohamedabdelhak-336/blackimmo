import React, { useEffect, useState } from "react";
import { useSearch } from "../../context/SearchContext";

export default function FiltersBar() {
  const { filters, updateFilter, sort, setSort, setPage } = useSearch();
  const [local, setLocal] = useState(filters);

  useEffect(() => { setLocal(filters); }, [filters]);

  function applyAndSearch(patch) {
    console.log("Applying filter:", patch);
    updateFilter(patch);
    setPage(1);
  }

  function onPriceChange(e) {
    const { name, value } = e.target;
    setLocal(l => ({ ...l, [name]: value }));
  }

  function onPriceBlur() {
    applyAndSearch({ priceMin: local.priceMin, priceMax: local.priceMax });
  }

  return (
    <div className="filters-bar glass p-3 rounded-md" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <select value={local.type || ""} onChange={(e)=> { setLocal(l=>({...l,type:e.target.value})); applyAndSearch({ type: e.target.value }); }} >
        <option value="">Tous types</option>
        <option value="a_louer">Location</option>
        <option value="a_vendre">Vente</option>
      </select>

      <input
        type="text"
        placeholder="Ville"
        value={local.city || ""}
        onChange={(e)=> setLocal(l=>({...l, city:e.target.value}))}
        onBlur={()=> applyAndSearch({ city: local.city })}
      />

      <input
        type="number"
        name="priceMin"
        placeholder="Prix min"
        value={local. priceMin || ""}
        onChange={onPriceChange}
        onBlur={onPriceBlur}
        style={{ width: 100 }}
      />
      <input
        type="number"
        name="priceMax"
        placeholder="Prix max"
        value={local.priceMax || ""}
        onChange={onPriceChange}
        onBlur={onPriceBlur}
        style={{ width: 100 }}
      />

      <select value={local.rooms || ""} onChange={(e)=> { setLocal(l=>({...l,rooms:e.target.value})); applyAndSearch({ rooms: e.target.value }); }} >
        <option value="">Toutes pièces</option>
        <option value="1">S+0 / Studio</option>
        <option value="2">S+1</option>
        <option value="3">S+2</option>
        <option value="4">3+</option>
      </select>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 14, color: "#555" }}>Trier :</label>
        <select value={sort} onChange={(e)=> { setSort(e.target.value); setPage(1); }}>
          <option value="date_desc">Date (récent)</option>
          <option value="date_asc">Date (ancien)</option>
          <option value="price_asc">Prix (croissant)</option>
          <option value="price_desc">Prix (décroissant)</option>
        </select>
      </div>
    </div>
  );
}