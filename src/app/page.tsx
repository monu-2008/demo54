"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import Navbar from "@/components/website/Navbar";
import ServiceBooking from "@/components/website/ServiceBooking";
import Services from "@/components/website/Services";
import Products from "@/components/website/Products";
import Gallery from "@/components/website/Gallery";
import About from "@/components/website/About";
import Contact from "@/components/website/Contact";
import Footer from "@/components/website/Footer";
import FloatingButtons from "@/components/website/FloatingButtons";
import TickerBar from "@/components/website/TickerBar";
import FullProducts from "@/components/website/FullProducts";
import IntroSplash from "@/components/website/IntroSplash";

// Lazy load heavy components — only after splash completes
const BackgroundAnimation = dynamic(() => import("@/components/website/BackgroundAnimation"), { ssr: false });
const Hero = dynamic(() => import("@/components/website/Hero"), { ssr: false });

export default function Home() {
  const { view, bookingModalOpen } = useAppStore();
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    // Small delay to ensure DOM is ready then scroll to hero
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, 100);
  }, []);

  // Also ensure scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Full Products View (still on same page)
  if (view === "fullProducts") {
    return <FullProducts />;
  }

  // Main Customer Website (default)
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Intro splash screen */}
      {!introComplete && <IntroSplash onComplete={handleIntroComplete} />}

      {/* Race color-shifting bar at top */}
      <div className="race-color-bar" />

      {/* Only render heavy animations after splash is done */}
      {introComplete && <BackgroundAnimation />}
      <Navbar />
      <main className="flex-1 relative z-10">
        {/* Ticker bar below hero */}
        <div className="pt-16">
          {introComplete && <Hero />}
          <TickerBar />
        </div>
        <Services />
        <Products />
        <Gallery />
        <About />
        <Contact />
      </main>
      <Footer />

      {/* Floating Buttons — Book Service + WhatsApp + Send Enquiry */}
      <FloatingButtons />

      {/* Booking Modal (triggered from Hero CTA) */}
      {bookingModalOpen && <ServiceBooking />}
    </div>
  );
}
