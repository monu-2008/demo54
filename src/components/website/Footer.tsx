"use client";

import { useRef, useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function Footer() {
  // 5-tap detection for Master Admin — redirects to /mastermonu
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});

  // Firebase listener for dynamic footer content
  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.val());
    });
    return () => { unsub(); };
  }, []);

  const handleTap = () => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000); // Reset after 2 seconds of no taps

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      // Redirect to Master Admin page
      window.location.href = "/mastermonu";
    }
  };

  // Dynamic values with fallbacks
  const storeName = siteSettings.storeName || "RACE COMPUTER";
  const address = siteSettings.address || "SANGANER, JAIPUR";
  const copyrightYear = new Date().getFullYear();
  const asusPartnerText = siteSettings.asusPartnerText || "AUTHORIZED ASUS PARTNER";

  // Dynamic footer links from Firebase
  const defaultFooterLinks = ["Home", "Services", "Products", "Gallery", "About", "Contact"];
  const footerLinks: string[] = Array.isArray(siteSettings.footerLinks) ? siteSettings.footerLinks : defaultFooterLinks;

  // Map link names to section anchors
  const footerLinkHrefMap: Record<string, string> = {
    Home: "#hero",
    Services: "#services",
    Products: "#products",
    Gallery: "#gallery",
    About: "#about",
    Contact: "#contact",
  };

  return (
    <footer className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #080f2e 0%, #0a1540 50%, #0d0a2e 100%)" }}>
      {/* Color-shifting top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: "var(--theme-gradient-h)",
          backgroundSize: "200% 100%",
          animation: "raceSlide 3s linear infinite",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Store Name — 5-tap for Master Admin */}
          <button
            onClick={handleTap}
            className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
            aria-label={storeName}
          >
            <span
              className="font-extrabold text-lg tracking-wide"
              style={{
                fontFamily: "'Syne', sans-serif",
                background: "var(--theme-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {storeName}
            </span>
          </button>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
            {footerLinks.map((link) => (
              <a
                key={link}
                href={footerLinkHrefMap[link] || `#${link.toLowerCase()}`}
                className="hover:text-white transition"
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {copyrightYear} {storeName} &middot; {address} &middot; ALL RIGHTS RESERVED</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--theme-primary)", boxShadow: "0 0 8px color-mix(in srgb, var(--theme-primary) 50%, transparent)" }} />
              <span>{asusPartnerText}</span>
            </div>
          </div>
        </div>

        {/* Powered by AQERIONX — color-changing gradient */}
        <div className="mt-6 pt-4 border-t border-gray-800/50 text-center">
          <p className="text-xs tracking-widest uppercase font-medium">
            Powered by{" "}
            <span className="aqerionx-powered font-extrabold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
              AQERIONX
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
