"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

// Fallback defaults when Firebase has no data
const DEFAULT_TICKER_ITEMS = [
  "ASUS AUTHORIZED DEALER",
  "LAPTOP & PC REPAIR",
  "HOME SERVICE AVAILABLE",
  "25+ YEARS TRUST",
  "ASUS VIVOBOOK",
  "GAMING RIGS",
  "CUSTOM PC BUILD",
  "PRINTER SOLUTIONS",
  "NETWORKING",
  "AMC SUPPORT",
  "SANGANER BAZAR · JAIPUR",
  "4★ GOOGLE RATED",
];

export default function TickerBar() {
  const [tickerItems, setTickerItems] = useState<string[]>(DEFAULT_TICKER_ITEMS);

  // Firebase listener for settings/site.tickerItems
  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.tickerItems && Array.isArray(data.tickerItems) && data.tickerItems.length > 0) {
          setTickerItems(data.tickerItems.filter((item: unknown) => typeof item === "string" && item.trim()));
        }
      }
    });
    return () => { unsub(); };
  }, []);

  const items = [...tickerItems, ...tickerItems]; // Duplicate for seamless scroll

  return (
    <div
      className="relative z-10 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #080f2e 0%, #0a1540 50%, #0d0a2e 100%)",
        padding: "11px 0",
        boxShadow: "0 4px 24px rgba(0,20,80,0.15)",
      }}
    >
      {/* Color overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, rgba(0,85,255,0.12), rgba(124,58,255,0.08), rgba(0,85,255,0.12))",
          animation: "raceSlide 3s ease-in-out infinite alternate",
        }}
      />
      <div className="flex whitespace-nowrap" style={{ animation: "tickScroll 28s linear infinite" }}>
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3.5 font-mono text-[0.62rem] tracking-[3px] px-8"
            style={{ color: i % 2 === 0 ? "rgba(255,255,255,0.75)" : "rgba(180,200,255,0.65)", fontWeight: 500 }}
          >
            <span
              className="w-1 h-1 rounded-full shrink-0"
              style={{
                background: "linear-gradient(135deg, #0055ff, #7c3aff)",
                boxShadow: "0 0 6px rgba(0,85,255,0.5)",
              }}
            />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
