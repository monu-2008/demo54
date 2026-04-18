"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense, Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users, Wrench, ArrowRight, Building2, Award, Headphones, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

// Dynamic import — SSR disabled because Three.js needs browser
const Race3DObject = dynamic(() => import("@/components/website/Race3DObject"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        <div className="w-32 h-24 rounded-lg border-2 border-blue-400/50 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <div className="text-blue-400 font-mono text-xs tracking-widest">RACE</div>
        </div>
        <div className="w-8 h-1 bg-blue-400/30 mx-auto" />
        <div className="w-16 h-1 bg-blue-400/20 mx-auto rounded" />
        <div className="absolute inset-0 -m-8 border border-cyan-400/20 rounded-full animate-spin" style={{ animationDuration: "8s" }} />
        <div className="absolute inset-0 -m-14 border border-purple-400/10 rounded-full animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
      </div>
    </div>
  ),
});

// Error boundary for 3D component
class ThreeJSErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("Three.js component error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative">
            <div className="w-40 h-28 rounded-xl border-2 border-blue-400/40 bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <div className="text-center">
                <div className="text-blue-400 font-bold text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>RACE</div>
                <div className="text-purple-400/60 font-mono text-[8px] tracking-widest">COMPUTER</div>
              </div>
            </div>
            <div className="w-10 h-1 bg-blue-400/30 mx-auto" />
            <div className="w-20 h-1.5 bg-blue-400/20 mx-auto rounded" />
            <div className="absolute inset-0 -m-10 border border-cyan-400/20 rounded-full animate-spin" style={{ animationDuration: "6s" }} />
            <div className="absolute inset-0 -m-16 border border-purple-400/15 rounded-full animate-spin" style={{ animationDuration: "10s", animationDirection: "reverse" }} />
            <div className="absolute inset-0 -m-22 border border-red-400/10 rounded-full animate-spin" style={{ animationDuration: "14s" }} />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ICON_MAP: Record<string, any> = { Award, Wrench, Building2, Headphones, Clock: Clock, Star, Users, MapPin };

export default function Hero() {
  const { setView, setBookingModalOpen } = useAppStore();
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.val());
    });
    return () => { unsub; };
  }, []);

  const storeName = siteSettings.storeName || "RACE COMPUTER";
  const nameParts = storeName.split(" ");
  const heroSubtitle = siteSettings.heroSubtitle || "// NEXT-GEN TECH HUB · JAIPUR";
  const heroTagline = siteSettings.heroTagline || "Jaipur's most trusted tech destination since 2001. Laptops, PCs, printers and expert home repair service — all under one roof.";
  const heroEyebrow = siteSettings.heroEyebrow || "Sanganer, Jaipur · Est. 2001";
  const heroCtaPrimary = siteSettings.heroCtaPrimary || "Book Home Service";
  const heroCtaSecondary = siteSettings.heroCtaSecondary || "Explore Products";
  const heroTrustStars = siteSettings.heroTrustStars || "★★★★☆";
  const heroTrustReviews = siteSettings.heroTrustReviews || "213+ Google Reviews";
  const heroTrustLocation = siteSettings.heroTrustLocation || "Sanganer Bazar, Jaipur";
  const stats = siteSettings.stats || {};

  // Dynamic hero pills
  const heroPills = Array.isArray(siteSettings.heroPills) && siteSettings.heroPills.length > 0
    ? siteSettings.heroPills
    : [
        { label: stats.years || "Since 2001", dotColor: "primary" },
        { label: stats.rating || "4★ Rating", dotColor: "yellow" },
        { label: "ASUS Partner", dotColor: "green" },
        { label: "Home Service", dotColor: "accent" },
        { label: stats.customers || "9000+ Customers", dotColor: "secondary" },
      ];

  // Dynamic hero chips
  const heroChips = Array.isArray(siteSettings.heroChips) && siteSettings.heroChips.length > 0
    ? siteSettings.heroChips
    : [
        { icon: "Award", text: "ASUS AUTHORIZED", color: "primary" },
        { icon: "Wrench", text: "HOME SERVICE", color: "accent" },
        { icon: "Building2", text: "2+ BRANCHES", color: "green" },
        { icon: "Headphones", text: "EXPERT SUPPORT", color: "secondary" },
      ];

  // Dynamic stat numbers for desktop stats bar
  const desktopStats = [
    { num: stats.numYears || "25+", label: "YEARS", icon: Clock },
    { num: stats.numReviews || "213+", label: "REVIEWS", icon: Star },
    { num: stats.numRating || "4★", label: "RATING", icon: Award },
    { num: stats.numCustomers || "9K+", label: "CUSTOMERS", icon: Users },
  ];

  // Mobile stats
  const mobileStats = [
    { num: stats.numYears || "25+", label: "YRS", icon: Clock },
    { num: stats.numReviews || "213+", label: "REV", icon: Star },
    { num: stats.numRating || "4★", label: "RATE", icon: Award },
    { num: stats.numCustomers || "9K+", label: "CUST", icon: Users },
  ];

  const getDotColor = (dotColor: string) => {
    switch (dotColor) {
      case "primary": return "var(--theme-primary)";
      case "yellow": return "#f5a623";
      case "green": return "#00d68f";
      case "accent": return "var(--theme-accent)";
      case "secondary": return "var(--theme-secondary)";
      default: return dotColor || "var(--theme-primary)";
    }
  };

  const getChipColor = (color: string) => {
    switch (color) {
      case "primary": return "var(--theme-primary)";
      case "accent": return "var(--theme-accent)";
      case "green": return "#00d68f";
      case "secondary": return "var(--theme-secondary)";
      default: return color || "var(--theme-primary)";
    }
  };

  return (
    <section id="hero" className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-screen flex items-center overflow-hidden overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] rounded-full blur-3xl animate-pulse" style={{ background: "color-mix(in srgb, var(--theme-primary) 12%, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] rounded-full blur-3xl animate-pulse" style={{ background: "color-mix(in srgb, var(--theme-secondary) 8%, transparent)", animationDelay: "1s" }} />
        <div className="absolute top-1/3 left-1/3 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] rounded-full blur-3xl animate-pulse" style={{ background: "color-mix(in srgb, var(--theme-accent) 6%, transparent)", animationDelay: "2s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[150px] sm:w-[300px] h-[150px] sm:h-[300px] rounded-full blur-3xl animate-pulse" style={{ background: "color-mix(in srgb, var(--theme-primary) 6%, transparent)", animationDelay: "3s" }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(color-mix(in srgb, var(--theme-primary) 2.5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--theme-primary) 2.5%, transparent) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-10 lg:pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-12 items-center">
          {/* Left content */}
          <div className="space-y-4 sm:space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm" style={{ animation: "fadeUp 0.7s 0.2s both", borderColor: "var(--theme-primary-10)" }}>
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full animate-pulse" style={{ background: "var(--theme-primary)", boxShadow: "0 0 8px color-mix(in srgb, var(--theme-primary) 50%, transparent)" }} />
              <span className="text-[10px] sm:text-xs font-medium tracking-wider uppercase font-mono" style={{ color: "var(--theme-primary)" }}>{heroEyebrow}</span>
            </div>

            {/* Title */}
            <div className="space-y-1 sm:space-y-2" style={{ animation: "fadeUp 0.8s 0.3s both" }}>
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight race-title-gradient" style={{ fontFamily: "'Syne', sans-serif", lineHeight: 0.9, letterSpacing: "-1px" }}>
                {nameParts[0] || "RACE"}
              </h1>
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900" style={{ fontFamily: "'Syne', sans-serif", lineHeight: 0.9, letterSpacing: "-1px" }}>
                {nameParts.slice(1).join(" ") || "COMPUTER"}
              </h1>
              <div className="font-mono text-[10px] sm:text-[clamp(0.48rem,1.1vw,0.68rem)] tracking-[4px] sm:tracking-[6px] text-gray-400 mt-2 sm:mt-3 uppercase">
                {heroSubtitle}
              </div>
            </div>

            {/* Tagline */}
            <p className="text-sm sm:text-lg text-gray-600 max-w-lg leading-relaxed pl-4 sm:pl-5" style={{ borderLeft: "2px solid var(--theme-primary)", animation: "fadeUp 0.7s 0.5s both" }}>
              {heroTagline}
            </p>

            {/* Stats pills — dynamic from Firebase */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2" style={{ animation: "fadeUp 0.7s 0.6s both" }}>
              {heroPills.map((stat: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2 bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-full px-2.5 sm:px-4 py-1 sm:py-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                  <span className="w-[4px] sm:w-[5px] h-[4px] sm:h-[5px] rounded-full shrink-0" style={{ background: getDotColor(stat.dotColor), boxShadow: `0 0 6px color-mix(in srgb, ${getDotColor(stat.dotColor)} 25%, transparent)` }} />
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-700 tracking-wide">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-4" style={{ animation: "fadeUp 0.7s 0.88s both" }}>
              <Button size="lg" className="text-white shadow-lg rounded-xl px-4 sm:px-8 h-10 sm:h-13 text-sm sm:text-base relative overflow-hidden group hover:brightness-110 transition-all" style={{ background: "var(--theme-gradient-r)" }} onClick={() => setBookingModalOpen(true)}>
                <Wrench className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2" /> {heroCtaPrimary}
              </Button>
              <Button size="lg" variant="outline" className="border-2 text-gray-700 rounded-xl px-4 sm:px-8 h-10 sm:h-13 text-sm sm:text-base bg-white/50 backdrop-blur-md hover:brightness-110 transition-all" style={{ borderColor: "var(--theme-primary-20)", color: "var(--theme-primary)" }} onClick={() => setView("fullProducts")}>
                {heroCtaSecondary} <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4 ml-1.5 sm:ml-2" />
              </Button>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500" style={{ animation: "fadeUp 0.7s 1.05s both" }}>
              <div className="flex text-yellow-400">{heroTrustStars}</div>
              <span className="w-px h-3 sm:h-4 bg-gray-300" />
              <span>{heroTrustReviews}</span>
              <span className="w-px h-3 sm:h-4 bg-gray-300" />
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {heroTrustLocation}</span>
            </div>
          </div>

          {/* Right visual — 3D Tech Showcase (Desktop only) */}
          <div className="hidden lg:flex flex-col items-center justify-center relative" style={{ animation: "fadeUp 1s 0.4s both" }}>
            <div className="w-[480px] h-[300px] relative">
              <ThreeJSErrorBoundary>
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="relative">
                      <div className="w-32 h-24 rounded-lg border-2 border-blue-400/50 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <div className="text-blue-400 font-mono text-xs tracking-widest">RACE</div>
                      </div>
                      <div className="w-8 h-1 bg-blue-400/30 mx-auto" />
                      <div className="w-16 h-1 bg-blue-400/20 mx-auto rounded" />
                      <div className="absolute inset-0 -m-8 border border-cyan-400/20 rounded-full animate-spin" style={{ animationDuration: "8s" }} />
                      <div className="absolute inset-0 -m-14 border border-purple-400/10 rounded-full animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
                    </div>
                  </div>
                }>
                  <Race3DObject />
                </Suspense>
              </ThreeJSErrorBoundary>
            </div>

            {/* Floating service chips — dynamic from Firebase */}
            {heroChips.map((chip: any, i: number) => {
              const ChipIcon = ICON_MAP[chip.icon] || Award;
              return (
                <div key={i} className="absolute bg-white/92 backdrop-blur-md border rounded-xl px-3 py-2 shadow-lg" style={{
                  top: i === 0 ? "2%" : i === 1 ? "32%" : i === 2 ? undefined : undefined,
                  bottom: i === 2 ? "22%" : i === 3 ? "2%" : undefined,
                  right: i === 0 || i === 2 ? "-2%" : undefined,
                  left: i === 1 ? "-6%" : i === 3 ? "6%" : undefined,
                  animation: "fadeUp 3s ease-in-out infinite",
                  animationDelay: `${i * 0.5}s`,
                  borderColor: `color-mix(in srgb, ${getChipColor(chip.color)} 12%, transparent)`,
                }}>
                  <div className="flex items-center gap-2">
                    <ChipIcon className="w-3.5 h-3.5" style={{ color: getChipColor(chip.color) }} />
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: getChipColor(chip.color) }}>{chip.text}</span>
                  </div>
                </div>
              );
            })}

            {/* Vertical Stats below — dynamic */}
            <div className="mt-6 flex gap-0 border border-gray-200/60 bg-white rounded-xl overflow-hidden shadow-sm" style={{ animation: "fadeUp 0.7s 0.72s both" }}>
              {desktopStats.map((stat, i) => (
                <div key={stat.label} className={`px-5 py-3.5 text-center relative ${i < 3 ? 'border-r border-gray-200/60' : ''} theme-hover-bg transition-colors`}>
                  <stat.icon className="w-3.5 h-3.5 mx-auto mb-1 text-gray-300" />
                  <div className="text-lg font-extrabold race-title-gradient" style={{ fontFamily: "'Syne', sans-serif" }}>{stat.num}</div>
                  <div className="text-[10px] text-gray-400 tracking-[2px] uppercase font-mono mt-0.5">{stat.label}</div>
                </div>
              ))}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "var(--theme-gradient-h)", backgroundSize: "200% 100%", animation: "raceSlide 2s linear infinite" }} />
            </div>
          </div>

          {/* Mobile-only: Stats row */}
          <div className="lg:hidden mt-2" style={{ animation: "fadeUp 0.7s 0.5s both" }}>
            <div className="grid grid-cols-4 gap-0 border border-gray-200/60 bg-white rounded-xl overflow-hidden shadow-sm">
              {mobileStats.map((stat, i) => (
                <div key={stat.label} className={`px-1 py-2 text-center ${i < 3 ? 'border-r border-gray-200/60' : ''}`}>
                  <stat.icon className="w-3 h-3 mx-auto mb-0.5 text-gray-300" />
                  <div className="text-sm font-extrabold race-title-gradient" style={{ fontFamily: "'Syne', sans-serif" }}>{stat.num}</div>
                  <div className="text-[8px] text-gray-400 tracking-[1px] uppercase font-mono">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
