"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { ServiceRequest } from "./types";

interface ServiceRequestsTabProps {
  filteredRequests: ServiceRequest[];
  requestFilter: string;
  setRequestFilter: (f: string) => void;
  masterVerified: boolean;
  formatDate: (ts: number) => string;
  markCompleted: (id: string) => void;
  deleteRequest: (id: string) => void;
}

export default function ServiceRequestsTab({
  filteredRequests, requestFilter, setRequestFilter,
  masterVerified, formatDate, markCompleted, deleteRequest,
}: ServiceRequestsTabProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["all", "pending", "accepted", "completed"].map((f) => (
          <Button key={f} variant={requestFilter === f ? "default" : "outline"} size="sm" onClick={() => setRequestFilter(f)} className={requestFilter === f ? "bg-red-600" : ""}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
        <span className="text-xs text-gray-400 ml-2">{filteredRequests.length} results</span>
      </div>

      <Card className={masterVerified ? "aqerionx-card border-0" : "border border-gray-100 shadow-sm bg-white"}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={masterVerified ? "" : "bg-gray-50/50"} style={masterVerified ? { background: "rgba(15,15,40,0.5)" } : {}}>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Address</TableHead>
                  <TableHead className="text-xs">Service</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Accepted By</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">No requests found</TableCell></TableRow>
                ) : (
                  filteredRequests.map((r) => (
                    <TableRow key={r.id} className="hover:bg-red-50/30">
                      <TableCell className="text-sm font-medium">{r.name}</TableCell>
                      <TableCell className="text-sm">{r.phone}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{r.address}</TableCell>
                      <TableCell className="text-sm">{r.serviceType}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-sm">{r.acceptedBy || "—"}</TableCell>
                      <TableCell className="text-xs text-gray-400">{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {r.status !== "completed" && (
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 text-[10px] h-7" onClick={() => markCompleted(r.id)}>
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 text-[10px] h-7" onClick={() => deleteRequest(r.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
