import React, { useEffect, useRef, useState } from "react";
import { useSearch } from "../../context/SearchContext";

function debounce(fn, wait = 300){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
}

export default function SearchBar({ placeholder = "Rechercher par ville, type ou prix..." }) {
  const { query, setQuery, triggerNow, updateFilter } = useSearch();
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e){
      if (ref.current && !ref.current. contains(e.target)) {
        setOpen(false);
      }
    }
    document. addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const fetchSuggest = useRef(debounce(async (q) => {
    if (! q || q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
      if (! res.ok) return setSuggestions([]);
      const json = await res.json();
      setSuggestions(Array.isArray(json) ? json : []);
      setOpen(true);
    } catch (err) {
      setSuggestions([]);
    }
  }, 250)). current;

  function onChange(e){
    const v = e.target.value;
    setQuery(v);
    fetchSuggest(v);
  }

  function onKeyDown(e){
    if (e.key === "Enter") {
      e.preventDefault();
      triggerNow(query);
      setOpen(false);
    }
  }

  function onSelectSuggestion(s){
    const val = typeof s === "string" ? s : (s.label || s.city || s.text || "");
    setQuery(val);
    triggerNow(val);
    if (s && typeof s === "object") {
      if (s.city) updateFilter({ city: s.city });
      if (s.type) updateFilter({ type: s.type });
    }
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", width: "100%" }}>
       <input
  type="search"
  value={query}
  onChange={onChange}
  onKeyDown={onKeyDown}
  placeholder={placeholder}
  aria-label="Recherche d'annonces"
  className="input-field"
  style={{ 
    flex: 1, 
    background: "#ffffff", 
    border: "none",
    color: "#000000",  /* texte en noir */
    padding: "10px 12px",
    borderRadius: "6px"
  }}
/>
        <button
          type="button"
          onClick={() => { triggerNow(query); setOpen(false); }}
          className="btn-back-outline"
        >
          Rechercher
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="suggestions-list" role="listbox" style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff",
          boxShadow: "0 8px 20px rgba(0,0,0,0.12)", borderRadius: 8, zIndex: 80, listStyle: "none", margin: 0, padding: 8
        }}>
          {suggestions.map((s, idx) => {
            const label = typeof s === "string" ? s : (s.label || s.city || s.text || JSON.stringify(s));
            return (
              <li key={idx} role="option"
                onMouseDown={(e)=>{ e.preventDefault(); onSelectSuggestion(s); }}
                style={{ padding: "8px 12px", cursor: "pointer", borderRadius: 6 }}
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}