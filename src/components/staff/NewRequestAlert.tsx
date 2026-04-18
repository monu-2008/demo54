"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onChildAdded, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Bell, X, MapPin, Wrench } from "lucide-react";

interface NewRequest {
  id: string;
  name: string;
  phone: string;
  address: string;
  serviceType: string;
  problemDescription: string;
  createdAt: number;
}

export default function NewRequestAlert() {
  const { staffUser } = useAppStore();
  const [newRequests, setNewRequests] = useState<NewRequest[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isBeeping, setIsBeeping] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTimeRef = useRef<number>(Date.now());

  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;

      // Play a series of beeps
      const playBeepSequence = () => {
        const beepCount = 3;
        for (let i = 0; i < beepCount; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = i % 2 === 0 ? 880 : 660;
          osc.type = "square";
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.2);
          osc.start(ctx.currentTime + i * 0.3);
          osc.stop(ctx.currentTime + i * 0.3 + 0.25);
        }
      };

      playBeepSequence();
    } catch {
      // Audio context not available
    }
  }, []);

  const startBeeping = useCallback(() => {
    if (isBeeping) return;
    setIsBeeping(true);
    playBeep();
    beepIntervalRef.current = setInterval(() => {
      playBeep();
    }, 2000);
  }, [isBeeping, playBeep]);

  const stopBeeping = useCallback(() => {
    setIsBeeping(false);
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // ignore
      }
      oscillatorRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Listen for new service requests
    const reqRef = ref(db, "serviceRequests");
    
    const unsubscribe = onChildAdded(reqRef, (snapshot) => {
      const data = snapshot.val();
      const id = snapshot.key;
      
      if (!data || !id) return;
      
      // Only alert for requests created after the staff logged in
      if (data.createdAt > lastRequestTimeRef.current && data.status === "pending") {
        const newReq: NewRequest = {
          id,
          name: data.name,
          phone: data.phone,
          address: data.address,
          serviceType: data.serviceType,
          problemDescription: data.problemDescription || "",
          createdAt: data.createdAt,
        };
        
        setNewRequests((prev) => {
          if (prev.find((r) => r.id === id)) return prev;
          return [newReq, ...prev];
        });
        
        // Start beeping
        startBeeping();
      }
    });

    return () => {
      unsubscribe();
      stopBeeping();
    };
  }, [startBeeping, stopBeeping]);

  const dismissRequest = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    const remaining = newRequests.filter((r) => !dismissed.has(r.id) && r.id !== id);
    if (remaining.length === 0) {
      stopBeeping();
    }
  };

  const dismissAll = () => {
    const allIds = newRequests.map((r) => r.id);
    setDismissed(allIds);
    stopBeeping();
  };

  const activeAlerts = newRequests.filter((r) => !dismissed.has(r.id));

  if (activeAlerts.length === 0) return null;

  return (
    <>
      {/* Full-screen flashing overlay */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <div className="absolute inset-0 bg-race-red/10 animate-flash" />
      </div>

      {/* Alert Banner */}
      <div className="fixed top-0 left-0 right-0 z-[101] animate-flash">
        <div className="bg-gradient-to-r from-race-red to-race-red-light text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {activeAlerts.length}
                </span>
              </div>
              <div>
                <p className="font-bold text-lg">NEW SERVICE REQUEST!</p>
                <p className="text-sm text-white/80">
                  {activeAlerts.length} new request{activeAlerts.length > 1 ? "s" : ""} waiting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={dismissAll}
                className="bg-white/20 text-white hover:bg-white/30 border-white/30 cursor-pointer"
              >
                <X className="w-4 h-4 mr-1" />
                Dismiss All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Details Cards */}
      <div className="fixed top-16 left-0 right-0 z-[101] p-4 pointer-events-none">
        <div className="max-w-lg mx-auto space-y-2">
          {activeAlerts.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl shadow-2xl border-2 border-race-red p-4 pointer-events-auto"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-4 h-4 text-race-red" />
                    <span className="font-bold text-race-red">{req.serviceType}</span>
                  </div>
                  <p className="font-semibold">{req.name}</p>
                  <p className="text-sm text-muted-foreground">{req.phone}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{req.address}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissRequest(req.id)}
                  className="cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
