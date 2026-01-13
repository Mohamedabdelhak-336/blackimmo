import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Visible filters & sort
  const [filters, setFilters] = useState({
    type: "",        // e.g. "a_louer" | "a_vendre"
    city: "",        // city string
    priceMin: "",    // numbers as strings
    priceMax: "",
    rooms: "",       // number or empty
  });
  const [sort, setSort] = useState("date_desc"); // default sort
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);

  // debounce main text query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // immediate trigger (Enter or selecting suggestion)
  const triggerNow = useCallback((value) => {
    setQuery(value);
    setDebouncedQuery(value);
    setPage(1);
  }, []);

  // helper: update a single filter and reset page
  const updateFilter = useCallback((patch) => {
    setFilters(f => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  return (
    <SearchContext.Provider value={{
      query, setQuery, debouncedQuery, triggerNow,
      filters, setFilters, updateFilter,
      sort, setSort, page, setPage, limit, setLimit
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside SearchProvider");
  return ctx;
}