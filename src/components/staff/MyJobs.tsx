"use client";

import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, CheckCircle2, Clock, MapPin, User, Phone, Wrench } from "lucide-react";
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
  completedAt: number | null;
}

export default function MyJobs() {
  const { staffUser } = useAppStore();
  const [acceptedJobs, setAcceptedJobs] = useState<ServiceRequest[]>([]);
  const [completedJobs, setCompletedJobs] = useState<ServiceRequest[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("accepted");

  useEffect(() => {
    if (!staffUser) return;
    const reqRef = ref(db, "serviceRequests");
    const unsubscribe = onValue(reqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const all = Object.entries(data).map(([key, val]: [string, unknown]) => ({
          id: key,
          ...(val as Omit<ServiceRequest, "id">),
        }));

        const myAccepted = all
          .filter((r) => r.status === "accepted" && r.acceptedBy === staffUser.name)
          .sort((a, b) => (b.acceptedAt || 0) - (a.acceptedAt || 0));

        const myCompleted = all
          .filter((r) => r.status === "completed" && r.acceptedBy === staffUser.name)
          .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

        setAcceptedJobs(myAccepted);
        setCompletedJobs(myCompleted);
      }
    });
    return () => unsubscribe();
  }, [staffUser]);

  const markComplete = async (req: ServiceRequest) => {
    setCompleting(req.id);
    try {
      await update(ref(db, `serviceRequests/${req.id}`), {
        status: "completed",
        completedAt: Date.now(),
      });
      toast.success(`Job from ${req.name} marked as completed!`);
    } catch {
      toast.error("Failed to mark as complete");
    } finally {
      setCompleting(null);
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

  const renderRequestCard = (req: ServiceRequest, showComplete: boolean) => (
    <div
      key={req.id}
      className={`p-4 rounded-lg border ${
        showComplete
          ? "bg-purple-50 border-purple-200"
          : "bg-emerald-50 border-emerald-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              className={`text-xs ${
                showComplete
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <Wrench className="w-3 h-3 mr-1" />
              {req.serviceType}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {showComplete ? `Accepted: ${formatDate(req.acceptedAt!)}` : `Completed: ${formatDate(req.completedAt!)}`}
            </span>
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
        {showComplete && (
          <Button
            size="sm"
            onClick={() => markComplete(req)}
            disabled={completing === req.id}
            className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex-shrink-0"
          >
            {completing === req.id ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Complete
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="w-5 h-5 text-red-600" />
          My Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="accepted" className="gap-1.5">
              <Clock className="w-4 h-4" />
              Active ({acceptedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Completed ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accepted">
            {acceptedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active jobs. Accept a request from the pending list.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {acceptedJobs.map((req) => renderRequestCard(req, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No completed jobs yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedJobs.map((req) => renderRequestCard(req, false))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
