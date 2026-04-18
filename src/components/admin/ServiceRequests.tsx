"use client";

import { useState, useEffect } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, Trash2, Clock, UserCheck } from "lucide-react";
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

export default function ServiceRequests({ compact = false }: { compact?: boolean }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const reqRef = ref(db, "serviceRequests");
    const unsubscribe = onValue(reqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: [string, unknown]) => ({
          id: key,
          ...(val as Omit<ServiceRequest, "id">),
        }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setRequests(list);
      } else {
        setRequests([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const filtered = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const displayList = compact ? filtered.slice(0, 5) : filtered;

  const markComplete = async (id: string) => {
    try {
      await update(ref(db, `serviceRequests/${id}`), {
        status: "completed",
        completedAt: Date.now(),
      });
      toast.success("Request marked as completed");
    } catch {
      toast.error("Failed to update request");
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await remove(ref(db, `serviceRequests/${id}`));
      toast.success("Request deleted");
    } catch {
      toast.error("Failed to delete request");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            <UserCheck className="w-3 h-3 mr-1" /> Accepted
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {!compact && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-semibold">Service Requests ({filtered.length})</h3>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {displayList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No requests found</p>
      ) : compact ? (
        <div className="space-y-3">
          {displayList.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{req.name}</p>
                <p className="text-xs text-muted-foreground">{req.serviceType}</p>
              </div>
              {getStatusBadge(req.status)}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Phone</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden md:table-cell">Address</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Service</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden lg:table-cell">Accepted By</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((req) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{req.name}</td>
                  <td className="py-3 px-2">{req.phone}</td>
                  <td className="py-3 px-2 hidden md:table-cell max-w-[200px] truncate">{req.address}</td>
                  <td className="py-3 px-2">
                    <span className="text-xs">{req.serviceType}</span>
                  </td>
                  <td className="py-3 px-2">{getStatusBadge(req.status)}</td>
                  <td className="py-3 px-2 hidden lg:table-cell text-xs">{req.acceptedBy || "—"}</td>
                  <td className="py-3 px-2 hidden sm:table-cell text-xs">{formatDate(req.createdAt)}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      {req.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markComplete(req.id)}
                          className="text-emerald-600 hover:text-emerald-700 h-8 w-8 p-0 cursor-pointer"
                          title="Mark Complete"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 h-8 w-8 p-0 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the service request from {req.name}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteRequest(req.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
