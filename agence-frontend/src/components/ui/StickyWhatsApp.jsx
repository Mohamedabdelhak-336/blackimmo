import React from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

/*
  Floating button now leads to /contact (so the user reaches the contact page).
  If you prefer a direct WhatsApp link, replace <Link> with an <a href="https://wa.me/...">.
*/
export default function StickyWhatsApp() {
  return (
    <Link to="/contact" className="fixed right-6 bottom-6 z-50" aria-label="Contact">
      <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg whatsapp-pulse">
        <FaWhatsapp size={20} />
      </div>
    </Link>
  );
}