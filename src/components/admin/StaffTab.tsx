"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Phone } from "lucide-react";
import type { StaffMember } from "./types";

interface StaffTabProps {
  staff: StaffMember[];
  masterVerified: boolean;
  getStaffStats: (name: string) => { completed: number; active: number };
  staffFormOpen: boolean;
  setStaffFormOpen: (v: boolean) => void;
  staffForm: { name: string; email: string; password: string; phone: string };
  setStaffForm: (f: { name: string; email: string; password: string; phone: string }) => void;
  editingStaffId: string | null;
  setEditingStaffId: (id: string | null) => void;
  saveStaff: () => void;
  editStaff: (s: StaffMember) => void;
  deleteStaff: (id: string) => void;
  toggleStaffActive: (s: StaffMember) => void;
}

export default function StaffTab({
  staff, masterVerified, getStaffStats,
  staffFormOpen, setStaffFormOpen, staffForm, setStaffForm,
  editingStaffId, setEditingStaffId,
  saveStaff, editStaff, deleteStaff, toggleStaffActive,
}: StaffTabProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold ${masterVerified ? "text-gray-200" : "text-gray-900"}`}>Staff Members ({staff.length})</h3>
        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white gap-1" onClick={() => { setStaffForm({ name: "", email: "", password: "", phone: "" }); setEditingStaffId(null); setStaffFormOpen(true); }}>
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((s) => {
          const stats = getStaffStats(s.name);
          return (
            <Card key={s.id} className={masterVerified ? "aqerionx-card border-0 hover:shadow-lg transition-shadow" : "border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${s.active !== false ? (masterVerified ? "" : "bg-red-600") : "bg-gray-400"}`} style={masterVerified && s.active !== false ? { background: "linear-gradient(135deg, #00e5ff, #7c3aff)" } : {}}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={`font-semibold text-sm ${masterVerified ? "text-gray-200" : "text-gray-900"}`}>{s.name}</div>
                      <div className={`text-xs ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>{s.email}</div>
                    </div>
                  </div>
                  <Badge className={s.active !== false ? (masterVerified ? "" : "bg-green-50 text-green-700 border-green-200") : (masterVerified ? "" : "bg-red-50 text-red-600 border-red-200")} variant="outline" style={masterVerified ? s.active !== false ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" } : { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" } : {}}>
                    {s.active !== false ? "Active" : "Disabled"}
                  </Badge>
                </div>
                {s.phone && <div className={`text-xs mb-2 flex items-center gap-1 ${masterVerified ? "text-gray-400" : "text-gray-500"}`}><Phone className="w-3 h-3" />{s.phone}</div>}
                <div className="flex gap-2 mb-3">
                  <Badge className={`${masterVerified ? "text-[9px]" : "bg-red-50 text-red-600 border-red-200 text-[9px]"}`} style={masterVerified ? { background: "rgba(0,229,255,0.15)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.2)" } : {}}>{stats.active} Active</Badge>
                  <Badge className={`${masterVerified ? "text-[9px]" : "bg-green-50 text-green-600 border-green-200 text-[9px]"}`} style={masterVerified ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" } : {}}>{stats.completed} Completed</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-[10px] h-7 flex-1" onClick={() => editStaff(s)}>Edit</Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-7 flex-1" onClick={() => toggleStaffActive(s)}>{s.active !== false ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 text-[10px] h-7" onClick={() => deleteStaff(s.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {staff.length === 0 && (
          <div className={`col-span-full text-center py-12 ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>No staff members yet. Add one!</div>
        )}
      </div>

      {/* Staff Add/Edit Dialog */}
      <Dialog open={staffFormOpen} onOpenChange={setStaffFormOpen}>
        <DialogContent className={masterVerified ? "aqerionx-card border-0" : ""}>
          <DialogHeader>
            <DialogTitle className={masterVerified ? "text-gray-200" : ""}>{editingStaffId ? "Edit Staff" : "Add New Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={masterVerified ? "text-gray-400" : ""}>Full Name *</Label>
              <Input placeholder="Staff name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className={masterVerified ? "bg-white/5 border-gray-700 text-white" : ""} />
            </div>
            <div className="space-y-2">
              <Label className={masterVerified ? "text-gray-400" : ""}>Email *</Label>
              <Input type="email" placeholder="staff@example.com" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className={masterVerified ? "bg-white/5 border-gray-700 text-white" : ""} />
            </div>
            <div className="space-y-2">
              <Label className={masterVerified ? "text-gray-400" : ""}>Password *</Label>
              <Input type="text" placeholder="Login password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} className={masterVerified ? "bg-white/5 border-gray-700 text-white" : ""} />
            </div>
            <div className="space-y-2">
              <Label className={masterVerified ? "text-gray-400" : ""}>Phone</Label>
              <Input type="tel" placeholder="Phone number" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} className={masterVerified ? "bg-white/5 border-gray-700 text-white" : ""} />
            </div>
            <Button onClick={saveStaff} className="w-full bg-red-600 hover:bg-red-700 text-white">{editingStaffId ? "Update Staff" : "Add Staff"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
