"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Menu, X, Package } from "lucide-react";
import Image from "next/image";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function Navbar() {
  const { view, setView } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.val());
    });
    return () => { unsub(); };
  }, []);

  const storeName = siteSettings.storeName || "RACE COMPUTER";

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (view !== "main") {
      setView("main");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (view !== "main") return null;

  // Dynamic nav links from Firebase
  const navLinks: { label: string; action: () => void }[] = [
    { label: "Home", action: () => scrollTo("hero") },
    { label: "Services", action: () => scrollTo("services") },
    { label: "Products", action: () => setView("fullProducts") },
    { label: "Book Service", action: () => { useAppStore.getState().setBookingModalOpen(true); } },
    { label: "Gallery", action: () => scrollTo("gallery") },
    { label: "About", action: () => scrollTo("about") },
    { label: "Contact", action: () => scrollTo("contact") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b shadow-sm" style={{ borderColor: "var(--theme-primary-10)" }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Image + Text */}
          <button
            onClick={() => scrollTo("hero")}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer"
          >
            <Image
              src="/race-logo.jpg"
              alt={storeName}
              width={32}
              height={32}
              className="rounded-lg shadow-sm w-8 h-8 sm:w-9 sm:h-9"
              priority
            />
            <span className="font-extrabold text-base sm:text-lg tracking-wide race-title-gradient" style={{ fontFamily: "'Syne', sans-serif" }}>
              {storeName}
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <button key={link.label} onClick={link.action} className="text-sm font-medium text-gray-600 theme-hover transition flex items-center gap-1">
                {link.label === "Products" && <Package className="w-3.5 h-3.5" />}
                {link.label}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-2xl border-t shadow-lg" style={{ borderColor: "var(--theme-primary-10)" }}>
          <div className="px-3 py-2 space-y-0.5">
            {navLinks.map((link) => (
              <button key={link.label} onClick={() => { setMobileOpen(false); link.action(); }} className="block w-full text-left py-3 px-3 text-sm font-medium text-gray-700 theme-hover-bg theme-hover rounded-lg flex items-center gap-2">
                {link.label === "Products" && <Package className="w-3.5 h-3.5" />}
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
