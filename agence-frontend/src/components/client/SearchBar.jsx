import React, { useEffect, useRef, useState } from "react";
import { useSearch } from "../../context/SearchContext";

function debounce(fn, wait = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

export default function SearchBar({ placeholder = "Rechercher par ville, type ou prix..." }) {
  const { query, setQuery, triggerNow, updateFilter } = useSearch();
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Recherche auto dès modif, sans bouton ni enter
  const fetchSuggest = useRef(debounce(async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); triggerNow(""); return; }
    try {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
      if (!res.ok) { setSuggestions([]); triggerNow(q); return; }
      const json = await res.json();
      setSuggestions(Array.isArray(json) ? json : []);
      setOpen(true);
      triggerNow(q); // <-- lancer la recherche automatiquement dès que le user tape
    } catch {
      setSuggestions([]);
      triggerNow(q);
    }
  }, 250)).current;

  function onChange(e) {
    const v = e.target.value;
    setQuery(v);
    fetchSuggest(v);
  }

  function onSelectSuggestion(s) {
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
      <input
        type="search"
        value={query}
        onChange={onChange}
        placeholder={placeholder}
        aria-label="Recherche d'annonces"
        className="input-field"
        style={{
          flex: 1,
          background: "#fff",
          border: "1px solid #ddd",
          color: "#222",
          padding: "12px 15px",
          borderRadius: "8px",
          fontSize: "16px",
          outline: "none",
          boxShadow: "0 1px 4px #0001"
        }}
        autoComplete="off"
        onFocus={() => { if (suggestions.length) setOpen(true); }}
      />
      {open && suggestions.length > 0 && (
        <ul className="suggestions-list" role="listbox" style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff",
          boxShadow: "0 8px 20px rgba(0,0,0,0.12)", borderRadius: 8, zIndex: 80, listStyle: "none", margin: 0, padding: 8, border: "1px solid #eee"
        }}>
          {suggestions.map((s, idx) => {
            const label = typeof s === "string" ? s : (s.label || s.city || s.text || JSON.stringify(s));
            return (
              <li key={idx} role="option"
                onMouseDown={(e) => { e.preventDefault(); onSelectSuggestion(s); }}
                style={{
                  padding: "10px 14px", cursor: "pointer", borderRadius: 6,
                  fontWeight: 500, color: "#333",
                  transition: "background 0.2s",
                  marginBottom: "2px"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
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