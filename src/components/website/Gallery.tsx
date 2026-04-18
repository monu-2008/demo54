"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X, ChevronLeft, ChevronRight, Maximize2, Image as ImageIcon } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: string;
  description?: string;
  order?: number;
}

// Default gallery images (fallback when Firebase has no data)
const DEFAULT_GALLERY: Omit<GalleryImage, "id">[] = [
  { url: "", title: "Gaming PC Setup", category: "Custom Builds", description: "High-performance gaming rig with RGB" },
  { url: "", title: "ASUS VivoBook Display", category: "Laptops", description: "Latest ASUS VivoBook series" },
  { url: "", title: "Printer Station", category: "Printers", description: "HP & Epson multi-function printers" },
  { url: "", title: "Networking Setup", category: "Networking", description: "Complete office network installation" },
  { url: "", title: "Repair Workshop", category: "Repairs", description: "Expert repair in action" },
  { url: "", title: "Desktop Assembly", category: "Custom Builds", description: "Custom PC build for client" },
  { url: "", title: "Laptop Repair", category: "Repairs", description: "Motherboard-level repair" },
  { url: "", title: "Accessories Wall", category: "Accessories", description: "Keyboards, mice & more" },
];

export default function Gallery() {
  const [allImages, setAllImages] = useState<GalleryImage[]>(() =>
    DEFAULT_GALLERY.map((g, i) => ({ ...g, id: `default-${i}` }))
  );
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});

  // Firebase listener for settings/site (section headers)
  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.val());
    });
    return () => { unsub(); };
  }, []);

  // Firebase listener for gallery node
  useEffect(() => {
    const galleryRef = ref(db, "gallery");

    const unsubscribe = onValue(
      galleryRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data && typeof data === "object") {
          // Parse Firebase gallery items
          const items: GalleryImage[] = Object.entries(data)
            .map(([key, value]: [string, any]) => ({
              id: key,
              url: value?.url || "",
              title: value?.title || "Untitled",
              category: value?.category || "Uncategorized",
              description: value?.description || "",
              order: value?.order ?? 0,
            }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          setAllImages(items);
        } else {
          // Fallback to DEFAULT_GALLERY when Firebase has no data
          setAllImages(
            DEFAULT_GALLERY.map((g, i) => ({ ...g, id: `default-${i}` }))
          );
        }
      },
      (error) => {
        console.error("Firebase gallery listener error:", error);
        // Fallback to defaults on error
        setAllImages(
          DEFAULT_GALLERY.map((g, i) => ({ ...g, id: `default-${i}` }))
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // Extract unique categories dynamically from gallery items
  const categories = [
    "All",
    ...Array.from(new Set(allImages.map((img) => img.category))).sort(),
  ];

  const filtered = activeCategory === "All"
    ? allImages
    : allImages.filter((img) => img.category === activeCategory);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  // Color mapping for placeholder backgrounds
  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    "Custom Builds": { bg: "from-blue-100/80 to-indigo-100/80", text: "text-blue-600", border: "border-blue-200/50" },
    "Laptops": { bg: "from-purple-100/80 to-pink-100/80", text: "text-purple-600", border: "border-purple-200/50" },
    "Printers": { bg: "from-green-100/80 to-emerald-100/80", text: "text-green-600", border: "border-green-200/50" },
    "Networking": { bg: "from-cyan-100/80 to-teal-100/80", text: "text-cyan-600", border: "border-cyan-200/50" },
    "Repairs": { bg: "from-red-100/80 to-orange-100/80", text: "text-red-500", border: "border-red-200/50" },
    "Accessories": { bg: "from-amber-100/80 to-yellow-100/80", text: "text-amber-600", border: "border-amber-200/50" },
  };

  const getColor = (cat: string) => categoryColors[cat] || categoryColors["Custom Builds"];

  return (
    <section id="gallery" className="py-12 sm:py-20 bg-gradient-to-b from-white via-blue-50/20 to-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-50/80 backdrop-blur-md border border-amber-200/50 rounded-full px-4 py-2 mb-4">
            <Camera className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600 tracking-wider uppercase">{siteSettings.galleryHeader || "// Our Work"}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{siteSettings.galleryTitle || "Gallery"}</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            {siteSettings.gallerySubtitle || "A glimpse into our workspace, builds, and repairs — see the RACE COMPUTER difference."}
          </p>
          <div className="w-14 h-1 bg-gradient-to-r from-blue-600 to-red-500 rounded-full mx-auto mt-4" />
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-10 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={
                activeCategory === cat
                  ? "bg-gradient-to-r from-blue-600 to-red-500 text-white shadow-md"
                  : "bg-white/60 backdrop-blur-md border-gray-200/50"
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Gallery Grid — Masonry-like layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {filtered.map((img, idx) => {
            const colors = getColor(img.category);
            // Make some items span 2 rows for visual interest
            const isLarge = idx === 0 || idx === 3;

            return (
              <Card
                key={img.id}
                className={`group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white/60 backdrop-blur-lg cursor-pointer relative ${isLarge ? "row-span-2" : ""}`}
                onClick={() => openLightbox(idx)}
              >
                {/* Image / Placeholder */}
                <div className={`relative h-full min-h-[140px] sm:min-h-[180px] ${isLarge ? "sm:min-h-[380px]" : ""} bg-gradient-to-br ${colors.bg} flex items-center justify-center overflow-hidden`}>
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <ImageIcon className={`w-10 h-10 ${colors.text}`} />
                      <span className="text-xs font-medium text-gray-400">{img.title}</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Expand icon on hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-lg bg-white/80 backdrop-blur-md flex items-center justify-center shadow-md">
                      <Maximize2 className="w-4 h-4 text-gray-700" />
                    </div>
                  </div>

                  {/* Title & category on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <h4 className="text-white font-bold text-sm">{img.title}</h4>
                    {img.description && (
                      <p className="text-white/70 text-xs mt-0.5">{img.description}</p>
                    )}
                  </div>
                </div>

                {/* Bottom info bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-white/30 group-hover:opacity-0 transition-opacity">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 truncate">{img.title}</span>
                    <Badge className={`bg-white/60 ${colors.text} ${colors.border} text-[9px]`}>
                      {img.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Camera className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No images in this category</h3>
            <p className="text-gray-300 mt-1">Check back soon for updates!</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="sm:max-w-3xl bg-black/90 backdrop-blur-2xl border-white/10 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-white/80" />
                <div>
                  <span className="text-white font-bold text-sm">
                    {filtered[currentIndex]?.title}
                  </span>
                  <span className="text-white/50 text-xs ml-2">
                    {filtered[currentIndex]?.category}
                  </span>
                </div>
              </div>
              <span className="text-white/40 text-xs">
                {currentIndex + 1} / {filtered.length}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="relative min-h-[400px] flex items-center justify-center">
            {filtered[currentIndex]?.url ? (
              <img
                src={filtered[currentIndex]?.url}
                alt={filtered[currentIndex]?.title}
                className="w-full h-full object-contain max-h-[70vh]"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ImageIcon className="w-20 h-20 text-white/20" />
                <p className="text-white/30 text-sm">{filtered[currentIndex]?.title}</p>
                {filtered[currentIndex]?.description && (
                  <p className="text-white/20 text-xs">{filtered[currentIndex]?.description}</p>
                )}
              </div>
            )}

            {/* Navigation */}
            {filtered.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {filtered.length > 1 && (
            <div className="flex gap-2 p-3 bg-black/50 overflow-x-auto">
              {filtered.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentIndex
                      ? "border-blue-500 ring-2 ring-blue-500/30"
                      : "border-white/20 opacity-50 hover:opacity-80"
                  }`}
                >
                  {img.url ? (
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
