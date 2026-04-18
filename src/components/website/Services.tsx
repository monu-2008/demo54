"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Printer, Wrench, Wifi, Shield, Cpu } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

const ICON_MAP: Record<string, any> = { "💻": Monitor, "📱": Monitor, "🖨️": Printer, "🔧": Wrench, "🌐": Wifi, "🛡️": Shield, "🖥️": Cpu, "🎮": Cpu, "🔋": Shield, "🆕": Monitor };

const DEFAULT_SERVICES = [
  { icon: "💻", title: "Desktop & Laptops", desc: "Latest PCs, gaming rigs and laptops from top brands. Custom assembled systems tailored to your budget.", color: "blue" },
  { icon: "🖥️", title: "Custom PC Build", desc: "Dream rig, built your way. Handpicked components, expert assembly, and benchmarked perfection.", color: "purple" },
  { icon: "🖨️", title: "Printers & Peripherals", desc: "Inkjet, laser, multifunction printers. Keyboards, mice, headphones — all in one place.", color: "green" },
  { icon: "🔧", title: "Repair & Service", desc: "Expert hardware & software repair for laptops & PCs. Home service available across Jaipur.", color: "red" },
  { icon: "🌐", title: "Networking Solutions", desc: "WiFi routers, switches, LAN cables and complete network setup for homes & businesses.", color: "cyan" },
  { icon: "🛡️", title: "AMC & Support", desc: "Annual Maintenance Contracts for offices. On-site & remote support to keep systems running.", color: "indigo" },
];

interface ServiceItem {
  id?: string;
  icon?: string;
  title: string;
  desc: string;
  num?: string;
  order?: number;
}

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [servicesHeader, setServicesHeader] = useState("// What We Offer");
  const [servicesTitle, setServicesTitle] = useState("Our Services");
  const [servicesSubtitle, setServicesSubtitle] = useState("Sanganer's most complete tech service hub — hardware to software, purchase to repair.");

  useEffect(() => {
    const unsub = onValue(ref(db, "services"), (snap) => {
      if (snap.exists()) {
        const list: ServiceItem[] = [];
        snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        if (list.length > 0) setServices(list);
      }
    });
    return () => { unsub; };
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.servicesHeader !== undefined) setServicesHeader(data.servicesHeader);
        if (data.servicesTitle !== undefined) setServicesTitle(data.servicesTitle);
        if (data.servicesSubtitle !== undefined) setServicesSubtitle(data.servicesSubtitle);
      }
    });
    return () => { unsub; };
  }, []);
  return (
    <section id="services" className="py-12 sm:py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 sm:px-4 py-2 mb-4">
            <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase">{servicesHeader}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-3">{servicesTitle}</h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm sm:text-base">
            {servicesSubtitle}
          </p>
          <div className="w-14 h-1 bg-gradient-to-r from-blue-600 to-red-500 rounded-full mx-auto mt-4" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {services.map((service, idx) => {
            const IconComponent = ICON_MAP[service.icon || "💻"] || Monitor;
            const colors = ["blue", "purple", "green", "red", "cyan", "indigo"];
            const color = colors[idx % colors.length];
            return (
            <Card
              key={service.id || idx}
              className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden cursor-default"
            >
              <CardContent className="p-4 sm:p-6 relative">
                <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 rounded-bl-full opacity-5 group-hover:opacity-10 transition-opacity"
                  style={{ background: color === "blue" ? "#2563eb" : color === "red" ? "#ef4444" : color === "green" ? "#16a34a" : color === "purple" ? "#7c3aed" : color === "cyan" ? "#06b6d4" : "#4f46e5" }}
                />
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${
                  color === "blue" ? "bg-blue-100 text-blue-600" :
                  color === "red" ? "bg-red-100 text-red-500" :
                  color === "green" ? "bg-green-100 text-green-600" :
                  color === "purple" ? "bg-purple-100 text-purple-600" :
                  color === "cyan" ? "bg-cyan-100 text-cyan-600" :
                  "bg-indigo-100 text-indigo-600"
                }`} style={color === "purple" ? { background: "linear-gradient(135deg, rgba(124,58,255,0.1), rgba(0,229,255,0.1))" } : {}}>
                  {service.icon ? <span className="text-lg">{service.icon}</span> : <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                <div className="text-[10px] font-mono text-gray-300 tracking-widest mb-1.5 sm:mb-2">{service.num || `0${idx + 1}`}</div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1.5 sm:mb-2">{service.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{service.desc}</p>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
