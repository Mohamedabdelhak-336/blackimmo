import React, { useEffect, useState } from "react";
import ListingCard from "./ListingCard";
import { useSearch } from "../../context/SearchContext";
import { fetchProperties } from "../../services/annonces";

function parseQuery(text = "") {
  const normalized = String(text || "").toLowerCase();
  const result = { q: "", type: "", priceMin: "", priceMax: "", city: "", rooms: "" };
  const range = normalized.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) { result.priceMin = range[1]; result.priceMax = range[2]; }
  const num = normalized.match(/(\d{2,}([.,]?\d{0,3})?)/);
  if (num && ! range) result.priceMax = num[0]. replace(",",".");
  if (/\blocat/i.test(normalized) || /\blouer/i.test(normalized)) result.type = "a_louer";
  if (/\bvent/i.test(normalized) || /\bvendre\b/i.test(normalized)) result.type = "a_vendre";
  result.q = normalized.replace(/(\b\d+[-–]?\d*\b)/g,""). replace(/\blocat(ion)?\b/g,""). replace(/\blouer\b/g,""). trim();
  return result;
}

export default function ListingsPreview() {
  const { debouncedQuery, filters, sort, page, limit } = useSearch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const parsed = parseQuery(debouncedQuery || "");
        const opts = {};
        if (parsed.q) opts.q = parsed.q;
        opts.type = filters.type || parsed.type || "";
        opts.city = filters.city || parsed.city || "";
        opts.priceMin = filters.priceMin || parsed.priceMin || "";
        opts.priceMax = filters.priceMax || parsed.priceMax || "";
        if (filters.rooms) opts.rooms = filters.rooms;
        opts.page = page;
        opts.limit = limit;
        opts.sort = sort;
        const data = await fetchProperties(limit, page, opts);
        setItems(data || []);
      } catch (err) {
        console.error("Error loading properties", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [debouncedQuery, filters, sort, page, limit]);

  return (
    <div>
      {loading ?  <div className="p-6">Chargement des annonces…</div> : items.length === 0 ? <div className="p-6 text-gray-600">Aucune annonce trouvée. </div> : (
        <div className="space-y-6">
          {items.map(it => <ListingCard key={it. id || it._id} item={it} />)}
        </div>
      )}
    </div>
  );
}