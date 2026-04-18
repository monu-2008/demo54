"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ref, onChildAdded, onValue, update, set, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
  ArrowLeft, LogOut, Wrench, CheckCircle, Clock,
  User, Phone, MapPin, Bell, BellRing, Zap,
  Briefcase, TrendingUp, AlertTriangle, X,
  Navigation,
} from "lucide-react";

import type { ServiceRequest } from "@/lib/adminTypes";
import { formatDate } from "@/lib/adminTypes";
import StatusBadge from "@/components/admin/StatusBadge";

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

  // Listen to all service requests
  useEffect(() => {
    const reqRef = ref(db, "serviceRequests");
    const unsub = onValue(reqRef, (snap) => {
      if (snap.exists()) {
        const reqs: ServiceRequest[] = [];
        snap.forEach((child) => reqs.push({ id: child.key || "", ...child.val() }));
        reqs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setAllRequests(reqs);
      } else {
        setAllRequests([]);
      }
    });

    // Listen for NEW requests (onChildAdded)
    const childUnsub = onChildAdded(reqRef, (snap) => {
      const id = snap.key;
      const data = snap.val();
      if (!id || !data) return;

      // Only alert for truly new requests (not already known)
      if (knownRequestIds.current.has(id)) return;
      knownRequestIds.current.add(id);

      // Only alert for pending requests
      if (data.status === "pending") {
        const req: ServiceRequest = { id, ...data };
        setAlertRequest(req);
        setIsAlerting(true);
        isAlertingRef.current = true;
        startAlertSound();
        // Speak "New order from [name]"
        speakAlert(req.name || "Unknown Customer");
      }
    });

    return () => { unsub(); childUnsub(); };
  }, []);

  // Stop location tracking and remove from Firebase on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Stop location tracking when staff has no more active jobs
  useEffect(() => {
    const myActiveJobs = allRequests.filter(
      (r) => r.status === "accepted" && r.acceptedBy === staffUser?.name
    );
    // If we were sharing location but no longer have active jobs, stop
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

    // Clear any existing watch
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
    }

    // Request permission and start watching
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();

        // Throttle Firebase updates to every 5 seconds
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
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    setIsLocationSharing(true);
    toast.success("Location sharing started", { description: "Admin can now track your live location." });
  }, [staffUser]);

  const stopLocationTracking = useCallback(() => {
    // Clear the geolocation watch
    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }

    // Remove location from Firebase
    if (staffUser) {
      remove(ref(db, `staffLocations/${staffUser.id}`)).catch((err) => {
        console.warn("Failed to remove location:", err);
      });
    }

    setIsLocationSharing(false);
  }, [staffUser]);

  // Speak "New order from [name]" using Web Speech API
  const speakAlert = useCallback((customerName: string) => {
    try {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
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

  // Keep repeating the alert sound until dismissed — no limit
  const startAlertSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);

      let beepCount = 0;

      alertIntervalRef.current = setInterval(() => {
        // Only stop if the staff dismissed the alert
        if (!isAlertingRef.current) {
          if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);
          return;
        }

        // Create a beep sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = beepCount % 2 === 0 ? 880 : 660; // Alternate frequencies
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
    // Stop any ongoing speech
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      // ignore
    }
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

    // Start location tracking
    startLocationTracking(req);
  };

  const completeRequest = async (req: ServiceRequest) => {
    await update(ref(db, `serviceRequests/${req.id}`), {
      status: "completed",
      completedAt: Date.now(),
    });
    toast.success("Job marked as completed!");

    // Check if staff has other active jobs
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





  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 30%, #1a0a2e 60%, #0a0a1a 100%)" }}>
      {/* AQERIONX bar at top */}
      <div className="aqerionx-bar" />

      {/* LOUD ALERT OVERLAY — keeps showing until staff dismisses */}
      {isAlerting && alertRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center space-y-4 border-4" style={{ animation: "flashBorder 0.5s infinite alternate", borderColor: "#ef4444" }}>
            <style>{`
              @keyframes flashBorder {
                from { border-color: #ef4444; box-shadow: 0 0 30px rgba(239,68,68,0.5); }
                to { border-color: #f97316; box-shadow: 0 0 60px rgba(249,115,22,0.5); }
              }
              @keyframes pulseText {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
              }
              @keyframes livePulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.5; }
              }
            `}</style>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto animate-bounce">
              <BellRing className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-red-600" style={{ animation: "pulseText 1s ease-in-out infinite" }}>
              NEW SERVICE REQUEST!
            </h2>
            <p className="text-sm text-red-500 font-medium animate-pulse">Alert will keep sounding until you dismiss</p>
            <div className="bg-red-50 rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-red-500" /><span className="font-semibold">{alertRequest.name}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-red-500" /><span>{alertRequest.phone}</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /><span className="text-sm">{alertRequest.address}</span></div>
              {alertRequest.customerLat && alertRequest.customerLng && (
                <a href={`https://www.google.com/maps?q=${alertRequest.customerLat},${alertRequest.customerLng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                  <Navigation className="w-3.5 h-3.5" /> Navigate to Customer
                </a>
              )}
              <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-red-500" /><span className="font-semibold">{alertRequest.serviceType}</span></div>
              {alertRequest.problemDescription && <p className="text-xs text-gray-600 mt-1 italic">&quot;{alertRequest.problemDescription}&quot;</p>}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => acceptRequest(alertRequest)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-base gap-2">
                <CheckCircle className="w-5 h-5" /> ACCEPT
              </Button>
              <Button onClick={dismissAlert} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50 h-12 font-bold">
                Dismiss Alert
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Staff header — AQERIONX gradient */}
      <header className="border-b sticky top-0 z-40" style={{ background: "rgba(10,10,30,0.9)", backdropFilter: "blur(20px)", borderColor: "rgba(0,229,255,0.1)" }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <a href="/">
              <Button variant="ghost" size="sm" className="gap-1 text-gray-400 hover:text-cyan-400">
                <ArrowLeft className="w-4 h-4" /> Back to Site
              </Button>
            </a>
            <div className="h-6 w-px" style={{ background: "rgba(0,229,255,0.2)" }} />
            <span className="font-bold text-sm aqerionx-text">Staff Panel</span>
            <div className="h-6 w-px" style={{ background: "rgba(0,229,255,0.2)" }} />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(124,58,255,0.2))" }}>
                <span className="text-xs font-bold aqerionx-text">{staffUser?.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-300">{staffUser?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Location sharing indicator */}
            {isLocationSharing && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)" }}>
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400" style={{ animation: "livePulse 1.5s ease-in-out infinite" }} />
                </div>
                <span className="text-[10px] font-semibold text-cyan-400">LIVE</span>
              </div>
            )}
            {pendingRequests.length > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse gap-1">
                <Bell className="w-3 h-3" /> {pendingRequests.length} New
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-red-400 hover:text-red-300 hover:bg-red-900/20">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border shadow-sm mb-6 flex-wrap h-auto gap-1 p-1" style={{ background: "rgba(15,15,40,0.7)", borderColor: "rgba(0,229,255,0.15)" }}>
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs data-[state=active]:text-white" style={{}}><Zap className="w-3.5 h-3.5" /> Dashboard</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5 text-xs data-[state=active]:text-white"><Clock className="w-3.5 h-3.5" /> Pending {pendingRequests.length > 0 && <Badge className="bg-red-500 text-white text-[9px] ml-1 px-1.5">{pendingRequests.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="myjobs" className="gap-1.5 text-xs data-[state=active]:text-white"><Briefcase className="w-3.5 h-3.5" /> My Jobs {myJobs.length > 0 && <Badge className="text-white text-[9px] ml-1 px-1.5" style={{ background: "linear-gradient(135deg, #00e5ff, #7c3aff)" }}>{myJobs.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5 text-xs data-[state=active]:text-white"><CheckCircle className="w-3.5 h-3.5" /> Completed</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard">
            {/* Welcome Card */}
            {showWelcome && (
              <div className="mb-6 aqerionx-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl aqerionx-blob" style={{ background: "rgba(0,229,255,0.1)" }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl aqerionx-blob" style={{ background: "rgba(124,58,255,0.1)", animationDelay: "2s" }} />
                <div className="relative flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold aqerionx-text">Welcome, {staffUser?.name}!</h2>
                    <p className="text-gray-400 text-sm mt-1">Ready to handle service requests? Check pending requests below.</p>
                  </div>
                  <button onClick={() => setShowWelcome(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Profile Card */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Name", value: staffUser?.name || "Staff", icon: User, color: "cyan" },
                { label: "Active Jobs", value: myJobs.length, icon: Briefcase, color: "purple" },
                { label: "Completed", value: myCompleted.length, icon: CheckCircle, color: "green" },
                { label: "Total Earnings", value: `₹${myCompleted.length * 500}`, icon: TrendingUp, color: "violet" },
              ].map((stat) => (
                <Card key={stat.label} className="aqerionx-card border-0 shadow-md" style={{ borderColor: "rgba(0,229,255,0.1)" }}>
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{
                      background: stat.color === "cyan" ? "rgba(0,229,255,0.15)" : stat.color === "purple" ? "rgba(124,58,255,0.15)" : stat.color === "green" ? "rgba(16,185,129,0.15)" : "rgba(224,64,251,0.15)"
                    }}>
                      <stat.icon className="w-6 h-6" style={{ color: stat.color === "cyan" ? "#00e5ff" : stat.color === "purple" ? "#7c3aff" : stat.color === "green" ? "#10b981" : "#e040fb" }} />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                      <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Location sharing status card */}
            {isLocationSharing && (
              <Card className="aqerionx-card border-0 shadow-md mb-6" style={{ borderColor: "rgba(0,229,255,0.1)" }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="relative">
                    <Navigation className="w-5 h-5 text-cyan-400" />
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400" style={{ animation: "livePulse 1.5s ease-in-out infinite" }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-cyan-400">Location sharing active</div>
                    <div className="text-xs text-gray-500">Admin is tracking your live location while you have active jobs</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending requests preview */}
            {pendingRequests.length > 0 && (
              <Card className="border-2 shadow-lg mb-6" style={{ background: "rgba(15,15,40,0.7)", borderColor: "rgba(239,68,68,0.3)" }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4 animate-pulse" /> {pendingRequests.length} New Request{pendingRequests.length > 1 ? "s" : ""} Waiting!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 3).map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <div>
                          <div className="font-semibold text-gray-200">{req.name}</div>
                          <div className="text-xs text-gray-500">{req.serviceType} · {req.address?.substring(0, 40)}...</div>
                        </div>
                        <Button size="sm" className="text-white gap-1" style={{ background: "linear-gradient(135deg, #00e5ff, #7c3aff)" }} onClick={() => acceptRequest(req)}>
                          <CheckCircle className="w-3.5 h-3.5" /> Accept
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My active jobs */}
            {myJobs.length > 0 && (
              <Card className="aqerionx-card border-0 shadow-md" style={{ borderColor: "rgba(0,229,255,0.1)" }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-cyan-400"><Briefcase className="w-4 h-4" /> My Active Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myJobs.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)" }}>
                        <div>
                          <div className="font-semibold text-gray-200">{req.name}</div>
                          <div className="text-xs text-gray-500">{req.serviceType} · {req.phone}</div>
                        </div>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => completeRequest(req)}>
                          <CheckCircle className="w-3.5 h-3.5" /> Complete
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PENDING REQUESTS */}
          <TabsContent value="pending">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No pending requests right now</p>
                <p className="text-xs text-gray-600 mt-1">New requests will appear with a loud alert that keeps sounding!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <Card key={req.id} className="aqerionx-card border-l-4" style={{ borderLeftColor: "#facc15" }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status="pending" />
                            <span className="text-xs text-gray-500">{formatDate(req.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /><span className="font-semibold text-gray-200">{req.name}</span></div>
                          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-400">{req.phone}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-400">{req.address}</span></div>
                          {req.customerLat && req.customerLng && (
                            <a href={`https://www.google.com/maps?q=${req.customerLat},${req.customerLng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-0.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                              <Navigation className="w-3.5 h-3.5" /> View Customer Location
                            </a>
                          )}
                          <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-cyan-400" /><span className="text-sm font-medium aqerionx-text">{req.serviceType}</span></div>
                          {req.problemDescription && <p className="text-xs text-gray-500 p-2 rounded-lg italic mt-1" style={{ background: "rgba(255,255,255,0.05)" }}>&quot;{req.problemDescription}&quot;</p>}
                        </div>
                        <Button className="text-white gap-2 shrink-0" style={{ background: "linear-gradient(135deg, #00e5ff, #7c3aff)" }} onClick={() => acceptRequest(req)}>
                          <CheckCircle className="w-4 h-4" /> Accept
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* MY JOBS */}
          <TabsContent value="myjobs">
            {myJobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No active jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((req) => (
                  <Card key={req.id} className="aqerionx-card border-l-4" style={{ borderLeftColor: "#00e5ff" }}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status="accepted" />
                            <span className="text-xs text-gray-500">Accepted {req.acceptedAt ? formatDate(req.acceptedAt) : ""}</span>
                          </div>
                          <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /><span className="font-semibold text-gray-200">{req.name}</span></div>
                          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-400">{req.phone}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-400">{req.address}</span></div>
                          {req.customerLat && req.customerLng && (
                            <a href={`https://www.google.com/maps?q=${req.customerLat},${req.customerLng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-0.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                              <Navigation className="w-3.5 h-3.5" /> Navigate to Customer
                            </a>
                          )}
                          <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-cyan-400" /><span className="text-sm font-medium aqerionx-text">{req.serviceType}</span></div>
                          {req.problemDescription && <p className="text-xs text-gray-500 p-2 rounded-lg italic mt-1" style={{ background: "rgba(255,255,255,0.05)" }}>&quot;{req.problemDescription}&quot;</p>}
                          {/* Location sharing indicator for this job */}
                          {isLocationSharing && (
                            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)" }}>
                              <div className="relative">
                                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400" style={{ animation: "livePulse 1.5s ease-in-out infinite" }} />
                              </div>
                              <span className="text-[11px] text-cyan-400 font-medium">Location sharing active</span>
                            </div>
                          )}
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 shrink-0" onClick={() => completeRequest(req)}>
                          <CheckCircle className="w-4 h-4" /> Mark Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* COMPLETED */}
          <TabsContent value="completed">
            {myCompleted.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No completed jobs yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myCompleted.map((req) => (
                  <Card key={req.id} className="aqerionx-card border-l-4 opacity-80" style={{ borderLeftColor: "#10b981" }}>
                    <CardContent className="p-5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status="completed" />
                          <span className="text-xs text-gray-500">{req.completedAt ? formatDate(req.completedAt) : ""}</span>
                        </div>
                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /><span className="font-semibold text-gray-200">{req.name}</span></div>
                        <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-green-400" /><span className="text-sm text-green-400">{req.serviceType}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
