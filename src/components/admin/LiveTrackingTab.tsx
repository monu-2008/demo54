"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Minimize2, MapPin, Users, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import type { StaffLocation } from "./types";

const StaffLiveMap = dynamic(() => import("@/components/admin/StaffLiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-xl flex items-center justify-center bg-gray-100" style={{ height: "500px" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading Map...</p>
      </div>
    </div>
  ),
});

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

interface LiveTrackingTabProps {
  staffLocations: StaffLocation[];
  customerLocations?: CustomerLocation[];
  masterVerified: boolean;
  mapExpanded: boolean;
  setMapExpanded: (v: boolean) => void;
  getTimeSince: (ts: number) => string;
}

export default function LiveTrackingTab({ staffLocations, customerLocations = [], masterVerified, mapExpanded, setMapExpanded, getTimeSince }: LiveTrackingTabProps) {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50 border border-red-100">
            <MapPin className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className={`font-bold text-base ${masterVerified ? "text-gray-200" : "text-gray-900"}`}>Live Tracking</h3>
            <p className={`text-xs ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>
              Real-time staff & customer locations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {staffLocations.length > 0 && (
            <Badge className="bg-emerald-500 text-white text-[10px] animate-pulse gap-1 px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              {staffLocations.length} Staff
            </Badge>
          )}
          {customerLocations.length > 0 && (
            <Badge className="bg-orange-500 text-white text-[10px] gap-1 px-2.5 py-1">
              <Navigation className="w-2.5 h-2.5" />
              {customerLocations.length} Customer
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => setMapExpanded(!mapExpanded)} className="gap-1">
            {mapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {mapExpanded ? "Minimize" : "Expand"}
          </Button>
        </div>
      </div>

      {/* Map - Always visible */}
      <div className={mapExpanded ? "fixed inset-0 z-50 p-4 bg-white" : ""}>
        <div className={mapExpanded ? "w-full h-full" : ""}>
          <StaffLiveMap staffLocations={staffLocations} customerLocations={customerLocations} isDark={masterVerified} />
        </div>
      </div>

      {/* Staff Location Cards */}
      {staffLocations.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <span className={`text-sm font-semibold ${masterVerified ? "text-gray-200" : "text-gray-700"}`}>
              Active Staff ({staffLocations.length})
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffLocations.map((loc) => (
              <div
                key={loc.staffId}
                className="p-3 rounded-lg border bg-white border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  >
                    {loc.staffName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${masterVerified ? "text-gray-200" : "text-gray-900"}`}>
                      {loc.staffName}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-[10px] text-emerald-500 font-medium">LIVE STAFF</span>
                    </div>
                  </div>
                </div>
                {loc.activeRequestName && (
                  <div className="text-xs mb-2 text-red-600 bg-red-50 px-2 py-1 rounded">
                    <span className="font-medium">Service:</span> {loc.activeRequestName} — {loc.activeRequestService}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>
                    Updated {getTimeSince(loc.lastUpdated)}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-medium"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Location Cards */}
      {customerLocations.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="w-4 h-4 text-orange-500" />
            <span className={`text-sm font-semibold ${masterVerified ? "text-gray-200" : "text-gray-700"}`}>
              Customer Locations ({customerLocations.length})
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customerLocations.map((cust) => (
              <div
                key={cust.id}
                className="p-3 rounded-lg border bg-white border-orange-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: "linear-gradient(135deg, #f97316, #eab308)" }}
                  >
                    {cust.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${masterVerified ? "text-gray-200" : "text-gray-900"}`}>
                      {cust.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                      <span className="text-[10px] text-orange-500 font-medium">CUSTOMER</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs mb-1.5 text-orange-700 bg-orange-50 px-2 py-1 rounded">
                  <span className="font-medium">{cust.serviceType}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1.5 truncate">{cust.address}</div>
                <div className="flex items-center justify-between">
                  <a href={`tel:${cust.phone}`} className="text-[10px] text-blue-500 hover:underline font-medium">{cust.phone}</a>
                  <a
                    href={`https://www.google.com/maps?q=${cust.lat},${cust.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-orange-500 hover:text-orange-700 hover:underline font-medium"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no locations at all */}
      {staffLocations.length === 0 && customerLocations.length === 0 && (
        <div className={`mt-4 text-center py-6 rounded-lg border border-dashed ${masterVerified ? "border-gray-700" : "border-gray-200"}`}>
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className={`text-sm font-medium ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>
            No active locations right now
          </p>
          <p className={`text-xs mt-1 ${masterVerified ? "text-gray-600" : "text-gray-300"}`}>
            Staff and customer locations will appear here when service requests are active
          </p>
        </div>
      )}
    </>
  );
}
