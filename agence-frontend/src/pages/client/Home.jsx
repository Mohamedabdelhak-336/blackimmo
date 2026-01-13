import React from "react";
import Hero from "../../components/client/Hero";
import CompanyInfo from "../../components/client/CompanyInfo";
import ListingsPreview from "../../components/client/ListingsPreview";
import FiltersBar from "../../components/client/FiltersBar";

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Hero />

      {/* main container */
      /* NOTE: on enlève l'usage agressif de -mt-8 ici et on gère le chevauchement via .filters-card */ }
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Filters card: blanc, ombre, chevauche légèrement le hero */}
        <div className="mb-6">
          <div className="max-w-7xl mx-auto px-6">
            <div className="filters-card">
              <FiltersBar />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ListingsPreview />
          </div>

          <aside className="lg:col-span-1">
            <div className="aside-sticky">
              <CompanyInfo />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}