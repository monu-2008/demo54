"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Award, Users, Building2, Navigation, Phone } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

// ─── Fallback defaults (used when Firebase has no data) ───

const DEFAULT_STATS = [
  { icon: Clock, label: "Years Active", value: "25+", color: "blue" },
  { icon: Users, label: "Customers", value: "9000+", color: "green" },
  { icon: Award, label: "Rating", value: "4★", color: "yellow" },
  { icon: MapPin, label: "Branches", value: "2+", color: "red" },
];

const DEFAULT_BRANCHES = [
  {
    name: "Race Computer",
    tag: "BRANCH 01",
    badge: "RETAIL STORE",
    isMain: false,
    address: "S. No 1, Opposite Gosala, Sheopur Road, Pratapnagar, Sanganer Bazar, Jaipur — 302029",
    phone: "+91 XXXXX XXXXX",
    whatsapp: "",
    email: "",
    hours: "Mon – Sat: 10:00 AM – 8:00 PM | Sunday: Closed",
    mapUrl: "https://maps.google.com/?q=Race+Computer+Sanganer+Jaipur",
    order: 0,
  },
  {
    name: "Race Computer Services",
    tag: "BRANCH 02",
    badge: "MAIN BRANCH",
    isMain: true,
    address: "Race Computer Services Head Office, Jaipur, Rajasthan",
    phone: "+91 XXXXX XXXXX",
    whatsapp: "",
    email: "",
    hours: "",
    mapUrl: "https://maps.google.com/?q=Race+Computer+Services+Jaipur",
    order: 1,
  },
];

const DEFAULT_STORY: string[] = [
  "<strong class='text-blue-600'>Race Computer Services</strong> was founded in 2001 with a vision to provide quality technology solutions in Jaipur. What started as a small service center has now grown into one of Rajasthan's most trusted technology brands.",
  "In 2010, we opened our <strong class='text-red-500'>Race Computer Retail Store at Sanganer Bazar</strong>, which became our main customer-facing hub. As an <strong class='text-blue-600'>authorized ASUS dealer</strong>, we guarantee genuine products with full manufacturer warranty. Our certified technicians provide expert repair for all major brands — now available as home service!",
  "From a single shop to <strong class='text-red-500'>multiple branches across Jaipur</strong>, with 9000+ happy customers and counting. Today we are <strong class='text-red-500'>Jaipur's No.1 tech destination</strong> with home service, product delivery, and staff management.",
];

const DEFAULT_TIMELINE = [
  { year: "2001", title: "Race Computer Services Founded", desc: "Started our journey in Jaipur" },
  { year: "2010", title: "Sanganer Retail Store Opened", desc: "Race Computer retail store at Sanganer Bazar" },
  { year: "2014", title: "ASUS Authorization", desc: "Official ASUS authorized dealer" },
  { year: "2019", title: "Service Center Launch", desc: "Dedicated repair & AMC services" },
  { year: "2025", title: "Home Service Platform", desc: "Online booking & staff management system" },
];

// ─── Firebase branch type ───

interface FirebaseBranch {
  id?: string;
  tag: string;
  name: string;
  badge: string;
  isMain: boolean;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  mapUrl: string;
  order: number;
  [key: string]: unknown;
}

// ─── Component ───

export default function About() {
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});
  const [firebaseBranches, setFirebaseBranches] = useState<FirebaseBranch[]>([]);

  // ─── Firebase listeners ───

  useEffect(() => {
    // Listen to settings/site for stats, story, and timeline
    const unsubSite = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.val());
    });

    // Listen to branches node
    const unsubBranches = onValue(ref(db, "branches"), (snap) => {
      if (snap.exists()) {
        const list: FirebaseBranch[] = [];
        snap.forEach((child) => {
          list.push({ id: child.key || "", ...(child.val() as Omit<FirebaseBranch, "id">) });
        });
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setFirebaseBranches(list);
      }
    });

    return () => {
      unsubSite();
      unsubBranches();
    };
  }, []);

  // ─── Derive STATS from Firebase with fallbacks ───

  const stats = siteSettings.stats || {};
  const STATS = [
    {
      icon: Clock,
      label: "Years Active",
      value: stats.years || DEFAULT_STATS[0].value,
      color: "blue" as const,
    },
    {
      icon: Users,
      label: "Customers",
      value: stats.customers || DEFAULT_STATS[1].value,
      color: "green" as const,
    },
    {
      icon: Award,
      label: "Rating",
      value: stats.rating || DEFAULT_STATS[2].value,
      color: "yellow" as const,
    },
    {
      icon: MapPin,
      label: "Branches",
      value: stats.branches || DEFAULT_STATS[3].value,
      color: "red" as const,
    },
  ];

  // ─── Derive BRANCHES from Firebase with fallbacks ───

  const BRANCHES =
    firebaseBranches.length > 0
      ? firebaseBranches.map((b) => ({
          name: b.name || "Branch",
          tag: b.tag || "",
          badge: b.badge || "STORE",
          isMain: !!b.isMain,
          address: b.address || "",
          phone: b.phone || "",
          whatsapp: b.whatsapp || "",
          email: b.email || "",
          hours: b.hours || "",
          mapUrl: b.mapUrl || "",
          since: deriveSince(b),
        }))
      : DEFAULT_BRANCHES.map((b) => ({
          ...b,
          since: b.name === "Race Computer Services" ? "2001" : "2010",
        }));

  // ─── Derive "since" year from timeline or branch name heuristics ───

  function deriveSince(branch: FirebaseBranch): string {
    // Try to find a matching timeline entry for this branch
    const timeline: { year: string; title: string; desc: string }[] =
      siteSettings.aboutTimeline || DEFAULT_TIMELINE;

    const branchName = (branch.name || "").toLowerCase();

    // Match timeline entry whose title or desc mentions the branch name
    const match = timeline.find(
      (t) =>
        branchName.includes(t.title.toLowerCase().split(" ").slice(0, 2).join(" ")) ||
        t.title.toLowerCase().includes(branchName.split(" ")[0])
    );

    if (match) return match.year;

    // Fallback: isMain branches typically get the founding year
    if (branch.isMain) {
      const firstEntry = timeline[0];
      if (firstEntry) return firstEntry.year;
    }

    // Default
    return "2010";
  }

  // ─── Derive story paragraphs from Firebase ───

  const rawStory: unknown = siteSettings.aboutStory;
  let storyParagraphs: string[] = DEFAULT_STORY;

  if (rawStory) {
    if (Array.isArray(rawStory)) {
      storyParagraphs = rawStory.filter((s: unknown) => typeof s === "string" && s.trim());
    } else if (typeof rawStory === "string" && rawStory.trim()) {
      // If it's a single string with \n separators, split it
      storyParagraphs = rawStory.split("\n").filter((s) => s.trim());
    }
    // Only override if we got actual content
    if (storyParagraphs.length === 0) storyParagraphs = DEFAULT_STORY;
  }

  // ─── Derive timeline from Firebase ───

  const rawTimeline: unknown = siteSettings.aboutTimeline;
  let timeline: { year: string; title: string; desc: string }[] = DEFAULT_TIMELINE;

  if (Array.isArray(rawTimeline) && rawTimeline.length > 0) {
    timeline = rawTimeline
      .filter(
        (item: any) =>
          item &&
          (item.year || item.title)
      )
      .map((item: any) => ({
        year: String(item.year || ""),
        title: String(item.title || ""),
        desc: String(item.desc || ""),
      }));
  }

  // ─── Helper: build Google Maps embed URL from a plain maps URL ───

  function buildMapEmbedUrl(mapUrl: string): string {
    if (!mapUrl) return "";
    // If it's already an embed URL, use as-is
    if (mapUrl.includes("/embed")) return mapUrl;
    // Extract query from a place/search URL
    try {
      const url = new URL(mapUrl);
      const q = url.searchParams.get("q") || url.searchParams.get("destination") || "";
      if (q) {
        return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(q)}`;
      }
    } catch {
      // Not a valid URL — try as a plain query
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mapUrl)}`;
    }
    return mapUrl;
  }

  function buildDirectionsUrl(mapUrl: string): string {
    if (!mapUrl) return "#";
    // If it's already a directions URL, use as-is
    if (mapUrl.includes("dir/?api=1")) return mapUrl;
    // Extract query for directions
    try {
      const url = new URL(mapUrl);
      const q = url.searchParams.get("q") || url.searchParams.get("destination") || "";
      if (q) {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
      }
    } catch {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapUrl)}`;
    }
    return mapUrl;
  }

  // ─── Render ───

  return (
    <section id="about" className="py-12 sm:py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 sm:px-4 py-2 mb-4">
            <span className="text-xs font-semibold text-green-600 tracking-wider uppercase">{siteSettings.aboutHeader || "// Who We Are"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>{siteSettings.aboutTitle || "About RACE COMPUTER"}</h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm sm:text-base">
            {siteSettings.aboutSubtitle || "Since 2001, thousands of satisfied customers, and Jaipur's most trusted tech partner."}
          </p>
          <div className="w-14 h-1 bg-gradient-to-r from-blue-600 to-red-500 rounded-full mx-auto mt-4" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {STATS.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-md hover:shadow-lg transition-shadow text-center group hover:-translate-y-1 transition-transform">
              <CardContent className="p-6">
                <div className={`w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center ${
                  stat.color === "blue" ? "bg-blue-100" : stat.color === "green" ? "bg-green-100" : stat.color === "yellow" ? "bg-yellow-100" : "bg-red-100"
                }`}>
                  <stat.icon className={`w-5 h-5 ${stat.color === "blue" ? "text-blue-600" : stat.color === "green" ? "text-green-600" : stat.color === "yellow" ? "text-yellow-600" : "text-red-500"}`} />
                </div>
                <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-xs text-gray-400 font-medium tracking-wider uppercase mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Story + Journey */}
        <div className="grid md:grid-cols-2 gap-10 mb-16">
          <div className="space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Our Story</h3>
            {storyParagraphs.map((paragraph, idx) => (
              <p key={idx} className="text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Our Journey</h3>
            {timeline.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${item.year === "2001" ? "bg-red-500 border-red-200" : item.year === "2010" ? "bg-blue-500 border-blue-200" : "bg-blue-500 border-blue-200"}`} />
                  {idx < timeline.length - 1 && <div className="w-0.5 h-full bg-blue-200 mt-1" />}
                </div>
                <div className="pb-4">
                  <div className={`text-xs font-mono tracking-wider ${item.year === "2001" ? "text-red-500" : "text-blue-500"}`}>{item.year}</div>
                  <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branches Section */}
        <div className="mb-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-4">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">&#47;&#47; Our Branches</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Syne', sans-serif" }}>Visit Us</h3>
            <p className="text-gray-500 max-w-md mx-auto mt-2">Multiple locations to serve you better across Jaipur</p>
            <div className="w-14 h-1 bg-gradient-to-r from-blue-600 to-red-500 rounded-full mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {BRANCHES.map((branch, idx) => {
              const mapEmbedUrl = buildMapEmbedUrl(branch.mapUrl);
              const directionsUrl = buildDirectionsUrl(branch.mapUrl);

              return (
                <Card key={idx} className={`border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden ${branch.isMain ? "ring-2 ring-blue-500/30" : "ring-2 ring-purple-500/20"}`}>
                  <CardContent className="p-0">
                    {/* Branch header */}
                    <div className={`p-5 ${branch.isMain ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gradient-to-r from-red-500 to-orange-500"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-white" />
                            <h4 className="font-bold text-white text-lg">{branch.name}</h4>
                          </div>
                          <span className="inline-block mt-2 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">
                            {branch.badge}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-white/60 text-[10px] font-mono tracking-wider uppercase">Since</div>
                          <div className="text-white font-extrabold text-xl">{branch.since}</div>
                        </div>
                      </div>
                    </div>

                    {/* Branch details */}
                    <div className="p-5 space-y-3">
                      {branch.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-gray-600">{branch.address}</p>
                        </div>
                      )}
                      {branch.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-green-500 shrink-0" />
                          <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="text-sm text-gray-600 hover:text-blue-600 transition">{branch.phone}</a>
                        </div>
                      )}
                      {branch.hours && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-gray-500">{branch.hours}</p>
                        </div>
                      )}

                      {/* Mini Map */}
                      {mapEmbedUrl && (
                        <div className="rounded-lg overflow-hidden border border-gray-200 mt-3">
                          <iframe
                            src={mapEmbedUrl}
                            width="100%"
                            height="140"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={branch.name}
                          />
                        </div>
                      )}

                      {/* Get Directions Button */}
                      {directionsUrl && directionsUrl !== "#" && (
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                        >
                          <Navigation className="w-4 h-4" />
                          Get Directions
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
