"use client";

import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Phone, Wrench, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  address: string;
  serviceType: string;
  problemDescription: string;
  status: "pending" | "accepted" | "completed";
  acceptedBy: string | null;
  acceptedAt: number | null;
  createdAt: number;
}

export default function PendingRequests() {
  const { staffUser } = useAppStore();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    const reqRef = ref(db, "serviceRequests");
    const unsubscribe = onValue(reqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([key, val]: [string, unknown]) => ({
            id: key,
            ...(val as Omit<ServiceRequest, "id">),
          }))
          .filter((r) => r.status === "pending")
          .sort((a, b) => b.createdAt - a.createdAt);
        setRequests(list);
      } else {
        setRequests([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const acceptRequest = async (req: ServiceRequest) => {
    if (!staffUser) return;
    setAccepting(req.id);
    try {
      await update(ref(db, `serviceRequests/${req.id}`), {
        status: "accepted",
        acceptedBy: staffUser.name,
        acceptedAt: Date.now(),
      });
      toast.success(`Request from ${req.name} accepted!`);
    } catch {
      toast.error("Failed to accept request");
    } finally {
      setAccepting(null);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-amber-500" />
          Pending Requests
          {requests.length > 0 && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
              {requests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No pending requests right now
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                        <Wrench className="w-3 h-3 mr-1" />
                        {req.serviceType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-medium">{req.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{req.phone}</span>
                      </div>
                      <div className="flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{req.address}</span>
                      </div>
                      {req.problemDescription && (
                        <p className="text-xs text-muted-foreground mt-1 bg-white/60 p-2 rounded">
                          {req.problemDescription}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => acceptRequest(req)}
                    disabled={accepting === req.id}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white cursor-pointer flex-shrink-0"
                  >
                    {accepting === req.id ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Accepting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
