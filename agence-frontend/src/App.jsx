import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/ui/Header";
import Home from "./pages/client/Home";
import Contact from "./pages/client/Contact";
import Annonces from "./pages/client/Annonces";
import ListingDetail from "./pages/client/ListingDetail";
import StickyWhatsApp from "./components/ui/StickyWhatsApp";

// admin
import AdminCreateOffer from "./components/admin/AdminCreateOffer";
import AdminLogin from "./components/admin/AdminLogin";
import AdminGuard from "./components/admin/AdminGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import EditOffer from "./components/admin/EditOffer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes: no client Header */}
        <Route path="/admin/login" element={<AdminLayout><AdminLogin /></AdminLayout>} />
        <Route path="/admin/dashboard" element={<AdminGuard><AdminLayout><AdminDashboard/></AdminLayout></AdminGuard>} />
        <Route path="/admin/offres/create" element={<AdminGuard><AdminLayout><AdminCreateOffer/></AdminLayout></AdminGuard>} />
        <Route path="/admin/offres/:id/edit" element={<AdminGuard><AdminLayout><EditOffer/></AdminLayout></AdminGuard>} />

        {/* Public routes (with client Header) */}
        <Route path="/*" element={
          <>
            <Header />
            <main className="pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/annonces" element={<Annonces />} />
                <Route path="/annonces/:id" element={<ListingDetail />} />
                <Route path="/contact" element={<Contact />} />
                {/* other public routes */}
              </Routes>
            </main>
            <StickyWhatsApp />
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}