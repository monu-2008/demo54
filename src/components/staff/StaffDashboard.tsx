"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ref, onChildAdded, onValue, update, set, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { rtdbToArray } from "@/lib/rtdbHelpers";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
  ArrowLeft, LogOut, Wrench, CheckCircle, Clock,
  User, Phone, MapPin, Bell, BellRing, Zap,
  Briefcase, TrendingUp, AlertTriangle, X,
  Navigation, Calendar,
} from "lucide-react";

import type { ServiceRequest } from "@/lib/adminTypes";
import { formatDate } from "@/lib/adminTypes";

// ── FORMAT TIME ──
function formatTime(ts: number) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── STATUS BADGES ──
const StatusBadge = ({ status }: { status: string }) => {
  const s = status || "pending";
  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
    accepted: "bg-blue-50 text-blue-600 border-blue-200",
    completed: "bg-green-50 text-green-600 border-green-200",
  };
  const cls = styles[s] || styles.pending;
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {s.toUpperCase()}
    </span>
  );
};

export default function StaffDashboard() {
  const { staffUser, staffLogout } = useAppStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [allRequests, setAllRequests] = useState<ServiceRequest[]>([]);
  const [alertRequest, setAlertRequest] = useState<ServiceRequest | null>(null);
  const [isAlerting, setIsAlerting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const knownRequestIds = useRef<Set<string>>(new Set());
  const isAlertingRef = useRef(false);
  const locationWatchIdRef = useRef<number | null>(null);
  const lastFirebaseUpdateRef = useRef<number>(0);

  // Date filter
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quickDate, setQuickDate] = useState("all");

  // Listen to all service requests
  useEffect(() => {
    const reqRef = ref(db, "serviceRequests");
    const unsub = onValue(reqRef, (snap) => {
      const reqs = rtdbToArray<ServiceRequest>(snap, "createdAt");
      console.log(`[Firebase] StaffDashboard serviceRequests loaded: ${reqs.length} items`);
      setAllRequests(reqs);
    });

    // Listen for NEW requests (onChildAdded)
    const childUnsub = onChildAdded(reqRef, (snap) => {
      const id = snap.key;
      const data = snap.val();
      if (!id || !data) return;

      if (knownRequestIds.current.has(id)) return;
      knownRequestIds.current.add(id);

      if (data.status === "pending") {
        const req: ServiceRequest = { id, ...data };
        setAlertRequest(req);
        setIsAlerting(true);
        isAlertingRef.current = true;
        startAlertSound();
        speakAlert(req.name || "Unknown Customer");
      }
    });

    return () => { unsub(); childUnsub(); };
  }, []);

  // Stop location tracking on unmount
  useEffect(() => {
    return () => { stopLocationTracking(); };
  }, []);

  // Stop location tracking when staff has no more active jobs
  useEffect(() => {
    const myActiveJobs = allRequests.filter(
      (r) => r.status === "accepted" && r.acceptedBy === staffUser?.name
    );
    if (isLocationSharing && myActiveJobs.length === 0) {
      stopLocationTracking();
    }
  }, [allRequests, staffUser, isLocationSharing]);

  const startLocationTracking = useCallback((req: ServiceRequest) => {
    if (!staffUser) return;
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", { description: "Your browser does not support location tracking." });
      return;
    }

    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
    }

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();

        if (now - lastFirebaseUpdateRef.current < 5000) return;
        lastFirebaseUpdateRef.current = now;

        const locationData = {
          lat: latitude,
          lng: longitude,
          staffName: staffUser.name,
          staffId: staffUser.id,
          lastUpdated: now,
          activeRequestId: req.id,
          activeRequestName: req.name,
          activeRequestService: req.serviceType,
        };

        set(ref(db, `staffLocations/${staffUser.id}`), locationData).catch((err) => {
          console.warn("Failed to update location:", err);
        });
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location access denied", { description: "Please enable location permissions to share your live location." });
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    setIsLocationSharing(true);
    toast.success("Location sharing started", { description: "Admin can now track your live location." });
  }, [staffUser]);

  const stopLocationTracking = useCallback(() => {
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
    if (staffUser) {
      remove(ref(db, `staffLocations/${staffUser.id}`)).catch((err) => {
        console.warn("Failed to remove location:", err);
      });
    }
    setIsLocationSharing(false);
  }, [staffUser]);

  const speakAlert = useCallback((customerName: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`New order from ${customerName}`);
        utterance.lang = 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech not available:", e);
    }
  }, []);

  const startAlertSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);

      let beepCount = 0;

      alertIntervalRef.current = setInterval(() => {
        if (!isAlertingRef.current) {
          if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
          return;
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = beepCount % 2 === 0 ? 880 : 660;
        osc.type = "sine";
        gain.gain.value = 0.3;

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);

        beepCount++;
      }, 300);
    } catch (e) {
      console.warn("Audio not available:", e);
    }
  }, []);

  const dismissAlert = () => {
    setIsAlerting(false);
    isAlertingRef.current = false;
    setAlertRequest(null);
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) { /* ignore */ }
  };

  const acceptRequest = async (req: ServiceRequest) => {
    if (!staffUser) return;
    if (req.status !== "pending") {
      toast.error("This request is no longer available");
      return;
    }
    await update(ref(db, `serviceRequests/${req.id}`), {
      status: "accepted",
      acceptedBy: staffUser.name,
      acceptedById: staffUser.id,
      acceptedAt: Date.now(),
    });
    toast.success("Request accepted!", { description: `You will handle ${req.name}'s ${req.serviceType} request.` });
    dismissAlert();
    startLocationTracking(req);
  };

  const completeRequest = async (req: ServiceRequest) => {
    await update(ref(db, `serviceRequests/${req.id}`), {
      status: "completed",
      completedAt: Date.now(),
    });
    toast.success("Job marked as completed!");

    const myOtherJobs = allRequests.filter(
      (r) => r.status === "accepted" && r.acceptedBy === staffUser?.name && r.id !== req.id
    );
    if (myOtherJobs.length === 0) {
      stopLocationTracking();
    }
  };

  const handleLogout = () => {
    stopLocationTracking();
    staffLogout();
    window.location.href = '/';
  };

  const pendingRequests = allRequests.filter((r) => r.status === "pending");
  const myJobs = allRequests.filter((r) => r.status === "accepted" && r.acceptedBy === staffUser?.name);
  const myCompleted = allRequests.filter((r) => r.status === "completed" && r.acceptedBy === staffUser?.name);

  // Date filtering helper
  const getDateRange = (qd: string): { from: number; to: number } | null => {
    if (qd === "all") return null;
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    let from: number;
    switch (qd) {
      case "today":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
        break;
      case "yesterday": {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0).getTime();
        const yto = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();
        return { from, to: yto };
      }
      case "7days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0).getTime();
        break;
      case "30days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0).getTime();
        break;
      case "thisMonth":
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
        break;
      case "lastMonth": {
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
        const lmTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
        return { from, to: lmTo };
      }
      default: return null;
    }
    return { from, to };
  };

  const filterByDate = (items: ServiceRequest[]) => {
    if (dateFrom || dateTo) {
      return items.filter((item) => {
        const ts = item.createdAt || 0;
        if (dateFrom && ts < new Date(dateFrom).getTime()) return false;
        if (dateTo && ts > new Date(dateTo).getTime() + 86400000 - 1) return false;
        return true;
      });
    }
    const range = getDateRange(quickDate);
    if (!range) return items;
    return items.filter((item) => {
      const ts = item.createdAt || 0;
      return ts >= range.from && ts <= range.to;
    });
  };

  const filteredCompleted = filterByDate(myCompleted);

  const QUICK_DATE_OPTIONS = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7days", label: "Last 7 Days" },
    { id: "30days", label: "Last 30 Days" },
    { id: "thisMonth", label: "This Month" },
    { id: "lastMonth", label: "Last Month" },
  ];

  // Tab config
  const tabs = [
    { id: "dashboard", icon: Zap, label: "Dashboard" },
    { id: "pending", icon: Clock, label: "Pending", count: pendingRequests.length },
    { id: "myjobs", icon: Briefcase, label: "My Jobs", count: myJobs.length },
    { id: "completed", icon: CheckCircle, label: "Completed", count: myCompleted.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* LOUD ALERT OVERLAY */}
      {isAlerting && alertRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full text-center space-y-4 border-2 border-red-500" style={{ animation: "flashBorder 0.5s infinite alternate" }}>
            <style>{`
              @keyframes flashBorder {
                from { border-color: #ef4444; box-shadow: 0 0 30px rgba(239,68,68,0.4); }
                to { border-color: #f97316; box-shadow: 0 0 50px rgba(249,115,22,0.4); }
              }
            `}</style>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto animate-bounce">
              <BellRing className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-extrabold text-red-600 animate-pulse">
              NEW SERVICE REQUEST!
            </h2>
            <p className="text-xs text-red-500 font-medium">Alert will keep sounding until you dismiss</p>
            <div className="bg-red-50 rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-red-500" /><span className="font-semibold text-gray-800">{alertRequest.name}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-red-500" /><a href={`tel:${alertRequest.phone}`} className="text-red-600 hover:underline">{alertRequest.phone}</a></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /><span className="text-sm text-gray-600">{alertRequest.address}</span></div>
              {alertRequest.customerLat && alertRequest.customerLng && (
                <a href={`https://www.google.com/maps?q=${alertRequest.customerLat},${alertRequest.customerLng}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors w-fit">
                  <Navigation className="w-3.5 h-3.5" /> Navigate to Customer
                </a>
              )}
              <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-red-500" /><span className="font-semibold text-gray-700">{alertRequest.serviceType}</span></div>
              {alertRequest.problemDescription && <p className="text-xs text-gray-500 mt-1 italic">&quot;{alertRequest.problemDescription}&quot;</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => acceptRequest(alertRequest)}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
                <CheckCircle className="w-5 h-5" /> ACCEPT
              </button>
              <button onClick={dismissAlert}
                className="flex-1 px-4 py-3 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm transition-all cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/">
              <button className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-xs font-medium">
                <ArrowLeft className="w-4 h-4" /> Site
              </button>
            </a>
            <div className="h-5 w-px bg-gray-200" />
            <span className="font-bold text-sm text-gray-800">Staff Panel</span>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-50 text-red-600 text-xs font-bold">
                {staffUser?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{staffUser?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLocationSharing && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-green-600">LIVE</span>
              </div>
            )}
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full animate-pulse">
                {pendingRequests.length} New
              </span>
            )}
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-medium">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 text-[9px] rounded-full font-bold ${
                    tab.id === "pending" ? "bg-red-500 text-white" : "bg-red-100 text-red-600"
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-5">
            {/* Welcome */}
            {showWelcome && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Welcome, {staffUser?.name}!</h2>
                    <p className="text-sm text-gray-500 mt-1">Ready to handle service requests? Check pending requests below.</p>
                  </div>
                  <button onClick={() => setShowWelcome(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Active Jobs", value: myJobs.length, icon: Briefcase, color: "blue" },
                { label: "Pending", value: pendingRequests.length, icon: Clock, color: "yellow" },
                { label: "Completed", value: myCompleted.length, icon: CheckCircle, color: "green" },
                { label: "Total Earnings", value: `₹${myCompleted.length * 500}`, icon: TrendingUp, color: "violet" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                    stat.color === "blue" ? "bg-blue-500" : stat.color === "yellow" ? "bg-yellow-500" : stat.color === "green" ? "bg-green-500" : "bg-purple-500"
                  }`} />
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stat.color === "blue" ? "bg-blue-50" : stat.color === "yellow" ? "bg-yellow-50" : stat.color === "green" ? "bg-green-50" : "bg-purple-50"
                    }`}>
                      <stat.icon className={`w-5 h-5 ${
                        stat.color === "blue" ? "text-blue-500" : stat.color === "yellow" ? "text-yellow-500" : stat.color === "green" ? "text-green-500" : "text-purple-500"
                      }`} />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Location sharing indicator */}
            {isLocationSharing && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <div className="relative">
                  <Navigation className="w-5 h-5 text-green-600" />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-green-700">Location sharing active</div>
                  <div className="text-xs text-green-600">Admin is tracking your live location while you have active jobs</div>
                </div>
              </div>
            )}

            {/* Pending requests preview */}
            {pendingRequests.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-sm font-bold text-red-600">{pendingRequests.length} New Request{pendingRequests.length > 1 ? "s" : ""} Waiting!</span>
                </div>
                <div className="space-y-2.5">
                  {pendingRequests.slice(0, 3).map((req) => (
                    <div key={req.id} className="bg-white border border-red-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{req.name}</p>
                        <p className="text-xs text-gray-500 truncate">{req.serviceType} · {req.address?.substring(0, 40)}...</p>
                      </div>
                      <button onClick={() => acceptRequest(req)}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all cursor-pointer shrink-0 ml-3">
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My active jobs preview */}
            {myJobs.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold text-blue-600">My Active Jobs</span>
                </div>
                <div className="space-y-2.5">
                  {myJobs.map((req) => (
                    <div key={req.id} className="bg-white border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{req.name}</p>
                        <p className="text-xs text-gray-500">{req.serviceType} · <a href={`tel:${req.phone}`} className="text-red-600 hover:underline">{req.phone}</a></p>
                      </div>
                      <button onClick={() => completeRequest(req)}
                        className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all cursor-pointer shrink-0 ml-3">
                        Complete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PENDING REQUESTS ── */}
        {activeTab === "pending" && (
          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No pending requests right now</p>
                <p className="text-xs text-gray-400 mt-1">New requests will appear with a loud alert!</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status="pending" />
                        <span className="text-[10px] text-gray-400">{formatTime(req.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800 text-sm">{req.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <a href={`tel:${req.phone}`} className="text-sm text-red-600 hover:underline">{req.phone}</a>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{req.address}</span>
                      </div>
                      {req.customerLat && req.customerLng && (
                        <a href={`https://www.google.com/maps?q=${req.customerLat},${req.customerLng}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors">
                          <Navigation className="w-3.5 h-3.5" /> Navigate to Customer
                        </a>
                      )}
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium text-blue-600">{req.serviceType}</span>
                      </div>
                      {req.problemDescription && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 italic">&quot;{req.problemDescription}&quot;</p>
                      )}
                    </div>
                    <button onClick={() => acceptRequest(req)}
                      className="px-4 py-2.5 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all cursor-pointer shrink-0">
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MY JOBS ── */}
        {activeTab === "myjobs" && (
          <div className="space-y-3">
            {myJobs.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No active jobs</p>
                <p className="text-xs text-gray-400 mt-1">Accept pending requests to start working</p>
              </div>
            ) : (
              myJobs.map((req) => (
                <div key={req.id} className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status="accepted" />
                        <span className="text-[10px] text-gray-400">Accepted {req.acceptedAt ? formatTime(req.acceptedAt) : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800 text-sm">{req.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <a href={`tel:${req.phone}`} className="text-sm text-red-600 hover:underline">{req.phone}</a>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{req.address}</span>
                      </div>
                      {req.customerLat && req.customerLng && (
                        <a href={`https://www.google.com/maps?q=${req.customerLat},${req.customerLng}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors">
                          <Navigation className="w-3.5 h-3.5" /> Navigate to Customer
                        </a>
                      )}
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium text-blue-600">{req.serviceType}</span>
                      </div>
                      {req.problemDescription && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 italic">&quot;{req.problemDescription}&quot;</p>
                      )}
                      {isLocationSharing && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 w-fit">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-green-600 font-medium">Location sharing active</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => completeRequest(req)}
                      className="px-4 py-2.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all cursor-pointer shrink-0">
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── COMPLETED ── */}
        {activeTab === "completed" && (
          <div className="space-y-4">
            {/* Date Filter */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date Filter
              </div>
              <div className="flex gap-2 flex-wrap">
                {QUICK_DATE_OPTIONS.map((opt) => (
                  <button key={opt.id} onClick={() => { setQuickDate(opt.id); setDateFrom(""); setDateTo(""); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      quickDate === opt.id && !dateFrom && !dateTo ? "bg-red-50 border-red-300 text-red-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-gray-500 font-medium">From:</label>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setQuickDate("all"); }}
                    className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-red-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-gray-500 font-medium">To:</label>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setQuickDate("all"); }}
                    className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-red-400" />
                </div>
                {(dateFrom || dateTo || quickDate !== "all") && (
                  <button onClick={() => { setDateFrom(""); setDateTo(""); setQuickDate("all"); }}
                    className="px-2.5 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-all">Clear</button>
                )}
              </div>
              <div className="text-[10px] text-gray-400">Showing {filteredCompleted.length} of {myCompleted.length} completed jobs</div>
            </div>

            {filteredCompleted.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No completed jobs yet</p>
                <p className="text-xs text-gray-400 mt-1">Completed jobs will appear here</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredCompleted.map((req) => (
                  <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm opacity-90">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status="completed" />
                        <span className="text-[10px] text-gray-400">{req.completedAt ? formatTime(req.completedAt) : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-800 text-sm">{req.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">{req.serviceType}</span>
                      </div>
                      {req.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${req.phone}`} className="text-xs text-red-600 hover:underline">{req.phone}</a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
