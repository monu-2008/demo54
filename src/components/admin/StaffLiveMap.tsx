"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface StaffLocation {
  staffId: string;
  staffName: string;
  lat: number;
  lng: number;
  lastUpdated: number;
  activeRequestId: string;
  activeRequestName: string;
  activeRequestService: string;
}

interface CustomerLocation {
  id: string;
  name: string;
  phone: string;
  address: string;
  serviceType: string;
  lat: number;
  lng: number;
  createdAt: number;
}

interface StaffLiveMapProps {
  staffLocations: StaffLocation[];
  customerLocations?: CustomerLocation[];
  isDark?: boolean;
}

// Custom marker icons using SVG data URIs (no external files needed)
function createStaffIcon(name: string, isDark: boolean): L.DivIcon {
  const initial = name.charAt(0).toUpperCase();
  const mainBg = isDark
    ? "linear-gradient(135deg, #00e5ff, #7c3aff)"
    : "linear-gradient(135deg, #ef4444, #dc2626)";
  const pulseBg = isDark
    ? "rgba(0,229,255,0.2)"
    : "rgba(239,68,68,0.2)";
  const arrowColor = "#7c3aff";

  return L.divIcon({
    className: "custom-staff-marker",
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <div style="position:absolute;inset:-4px;border-radius:50%;background:${pulseBg};animation:markerPulse 2s ease-out infinite;"></div>
        <div style="position:absolute;inset:0;border-radius:50%;background:${mainBg};display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
          <span style="color:white;font-weight:800;font-size:16px;font-family:sans-serif;">${initial}</span>
        </div>
        <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid ${arrowColor};"></div>
      </div>
    `,
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -56],
  });
}

// Customer location marker icon (orange/yellow)
function createCustomerIcon(name: string, isDark: boolean): L.DivIcon {
  const initial = name.charAt(0).toUpperCase();
  const mainBg = "linear-gradient(135deg, #f97316, #eab308)";
  const pulseBg = "rgba(249,115,22,0.25)";

  return L.divIcon({
    className: "custom-customer-marker",
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="position:absolute;inset:-4px;border-radius:50%;background:${pulseBg};animation:markerPulse 2s ease-out infinite;"></div>
        <div style="position:absolute;inset:0;border-radius:50%;background:${mainBg};display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
          <span style="color:white;font-weight:800;font-size:14px;font-family:sans-serif;">${initial}</span>
        </div>
        <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #eab308;"></div>
      </div>
    `,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
  });
}

export default function StaffLiveMap({ staffLocations, customerLocations = [], isDark = true }: StaffLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const getTimeSince = (ts: number) => {
    const diff = Date.now() - ts;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [26.85, 75.8], // Jaipur, Rajasthan default
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = isDark
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);

    mapInstanceRef.current = map;
    queueMicrotask(() => setMapReady(true));

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, [isDark]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    // Add staff location markers
    staffLocations.forEach((loc) => {
      if (loc.lat === 0 && loc.lng === 0) return;

      const icon = createStaffIcon(loc.staffName, isDark);
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);

      const mainBg = isDark
        ? "linear-gradient(135deg,#00e5ff,#7c3aff)"
        : "linear-gradient(135deg,#ef4444,#dc2626)";
      const textColor = isDark ? "#e2e8f0" : "#1a1a2e";
      const subTextColor = isDark ? "#94a3b8" : "#64748b";
      const linkColor = isDark ? "#00e5ff" : "#ef4444";
      const serviceBg = isDark ? "rgba(0,229,255,0.1)" : "rgba(239,68,68,0.08)";
      const serviceBorder = isDark ? "rgba(0,229,255,0.15)" : "rgba(239,68,68,0.15)";

      const popupContent = `
        <div style="min-width:200px;font-family:system-ui,sans-serif;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:32px;height:32px;border-radius:50%;background:${mainBg};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;">${loc.staffName.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:700;font-size:14px;color:${textColor};">${loc.staffName}</div>
              <div style="display:flex;align-items:center;gap:4px;">
                <span style="width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block;"></span>
                <span style="font-size:11px;color:#10b981;font-weight:600;">LIVE STAFF</span>
              </div>
            </div>
          </div>
          ${loc.activeRequestName ? `
          <div style="background:${serviceBg};border-radius:8px;padding:8px;margin-bottom:8px;border:1px solid ${serviceBorder};">
            <div style="font-size:11px;color:${subTextColor};margin-bottom:2px;">Active Service</div>
            <div style="font-size:13px;font-weight:600;color:${textColor};">${loc.activeRequestName} - ${loc.activeRequestService}</div>
          </div>
          ` : ""}
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:10px;color:${subTextColor};">Updated ${getTimeSince(loc.lastUpdated)}</span>
            <a href="https://www.google.com/maps?q=${loc.lat},${loc.lng}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:${linkColor};text-decoration:none;font-weight:600;">Open in Maps</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: isDark ? "dark-popup" : "",
        maxWidth: 280,
      });

      bounds.extend([loc.lat, loc.lng]);
      markersRef.current.push(marker);
    });

    // Add customer location markers
    customerLocations.forEach((cust) => {
      if (cust.lat === 0 && cust.lng === 0) return;

      const icon = createCustomerIcon(cust.name, isDark);
      const marker = L.marker([cust.lat, cust.lng], { icon }).addTo(map);

      const textColor = isDark ? "#e2e8f0" : "#1a1a2e";
      const subTextColor = isDark ? "#94a3b8" : "#64748b";
      const linkColor = isDark ? "#f97316" : "#f97316";
      const serviceBg = isDark ? "rgba(249,115,22,0.1)" : "rgba(249,115,22,0.08)";
      const serviceBorder = isDark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.15)";

      const popupContent = `
        <div style="min-width:200px;font-family:system-ui,sans-serif;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f97316,#eab308);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;">${cust.name.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:700;font-size:14px;color:${textColor};">${cust.name}</div>
              <div style="display:flex;align-items:center;gap:4px;">
                <span style="width:6px;height:6px;border-radius:50%;background:#f97316;display:inline-block;"></span>
                <span style="font-size:11px;color:#f97316;font-weight:600;">CUSTOMER</span>
              </div>
            </div>
          </div>
          <div style="background:${serviceBg};border-radius:8px;padding:8px;margin-bottom:8px;border:1px solid ${serviceBorder};">
            <div style="font-size:11px;color:${subTextColor};margin-bottom:2px;">Service: ${cust.serviceType}</div>
            <div style="font-size:12px;font-weight:500;color:${textColor};">${cust.address}</div>
          </div>
          <div style="font-size:11px;color:${subTextColor};margin-bottom:6px;">
            <a href="tel:${cust.phone}" style="color:${linkColor};text-decoration:none;font-weight:600;">${cust.phone}</a>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:10px;color:${subTextColor};">${getTimeSince(cust.createdAt)}</span>
            <a href="https://www.google.com/maps?q=${cust.lat},${cust.lng}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:${linkColor};text-decoration:none;font-weight:600;">Open in Maps</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: isDark ? "dark-popup" : "",
        maxWidth: 280,
      });

      bounds.extend([cust.lat, cust.lng]);
      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [staffLocations, customerLocations, mapReady, isDark]);

  // Auto-refresh: fit bounds when locations update
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    const allPoints: [number, number][] = [];

    staffLocations.forEach((l) => {
      if (l.lat !== 0 && l.lng !== 0) allPoints.push([l.lat, l.lng]);
    });
    customerLocations.forEach((c) => {
      if (c.lat !== 0 && c.lng !== 0) allPoints.push([c.lat, c.lng]);
    });

    if (allPoints.length === 0) return;

    const bounds = L.latLngBounds(allPoints);
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [staffLocations, customerLocations, mapReady]);

  return (
    <div className="relative">
      <style>{`
        @keyframes markerPulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .custom-staff-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-customer-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
          ${isDark ? "background: rgba(15,15,40,0.95) !important;" : ""}
          ${isDark ? "border: 1px solid rgba(0,229,255,0.15) !important;" : ""}
          ${isDark ? "backdrop-filter: blur(20px) !important;" : ""}
        }
        .leaflet-popup-tip {
          ${isDark ? "background: rgba(15,15,40,0.95) !important;" : ""}
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
        }
        .dark-popup .leaflet-popup-content-wrapper {
          background: rgba(15,15,40,0.95) !important;
          border: 1px solid rgba(0,229,255,0.15) !important;
          color: #e2e8f0 !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: rgba(15,15,40,0.95) !important;
        }
        .leaflet-control-zoom a {
          ${isDark ? "background: rgba(15,15,40,0.9) !important;" : ""}
          ${isDark ? "color: #e2e8f0 !important;" : ""}
          ${isDark ? "border-color: rgba(0,229,255,0.15) !important;" : ""}
        }
        .leaflet-control-zoom a:hover {
          ${isDark ? "background: rgba(0,229,255,0.15) !important;" : ""}
        }
        .leaflet-control-attribution {
          ${isDark ? "background: rgba(15,15,40,0.8) !important;" : ""}
          ${isDark ? "color: #64748b !important;" : ""}
        }
        .leaflet-control-attribution a {
          ${isDark ? "color: #00e5ff !important;" : ""}
        }
      `}</style>

      {/* Map container - always rendered */}
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden"
        style={{
          height: "500px",
          border: isDark ? "1px solid rgba(0,229,255,0.15)" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 0 30px rgba(0,229,255,0.08)" : "0 4px 20px rgba(0,0,0,0.08)",
        }}
      />

      {/* Map legend overlay */}
      <div
        className="absolute bottom-4 left-4 z-[1000] rounded-lg p-3"
        style={{
          background: isDark ? "rgba(15,15,40,0.9)" : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          border: isDark ? "1px solid rgba(0,229,255,0.15)" : "1px solid #e2e8f0",
        }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
          Live Tracking
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: isDark ? "linear-gradient(135deg, #00e5ff, #7c3aff)" : "linear-gradient(135deg, #ef4444, #dc2626)" }} />
          <span className="text-xs" style={{ color: isDark ? "#e2e8f0" : "#1a1a2e" }}>Staff ({staffLocations.length})</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(135deg, #f97316, #eab308)" }} />
          <span className="text-xs" style={{ color: isDark ? "#e2e8f0" : "#1a1a2e" }}>Customer Location ({customerLocations.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: isDark ? "rgba(100,100,120,0.3)" : "#d1d5db" }} />
          <span className="text-xs" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>Inactive Staff</span>
        </div>
      </div>

      {/* Staff & Customer count badge overlay */}
      {(staffLocations.length > 0 || customerLocations.length > 0) && (
        <div
          className="absolute top-4 right-4 z-[1000] flex items-center gap-3 rounded-full px-3 py-1.5"
          style={{
            background: isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)",
            border: isDark ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(16,185,129,0.3)",
          }}
        >
          {staffLocations.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold" style={{ color: "#10b981" }}>
                {staffLocations.length} Staff
              </span>
            </span>
          )}
          {customerLocations.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-xs font-semibold" style={{ color: "#f97316" }}>
                {customerLocations.length} Customer
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
