import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import 'leaflet/dist/leaflet.css';
import { SearchProvider } from "./context/SearchContext";
import Annonces from "./pages/client/Annonces";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SearchProvider>
      <App />
    </SearchProvider>
  </React.StrictMode>
);