"use client";

import { useState, useEffect } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { UserPlus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Staff {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  active: boolean;
  createdAt: number;
}

export default function StaffManager() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const staffRef = ref(db, "staff");
    const unsubscribe = onValue(staffRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: [string, unknown]) => ({
          id: key,
          ...(val as Omit<Staff, "id">),
        }));
        setStaff(list);
      } else {
        setStaff([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", email: "", password: "", phone: "" });
    setModalOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditId(s.id);
    setForm({ name: s.name, email: s.email, password: s.password, phone: s.phone });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await update(ref(db, `staff/${editId}`), form);
        toast.success("Staff updated successfully");
      } else {
        await push(ref(db, "staff"), {
          ...form,
          active: true,
          createdAt: Date.now(),
        });
        toast.success("Staff added successfully");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save staff");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await update(ref(db, `staff/${id}`), { active: !active });
      toast.success(`Staff ${!active ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      await remove(ref(db, `staff/${id}`));
      toast.success("Staff deleted");
    } catch {
      toast.error("Failed to delete staff");
    }
  };

  return (
    <div>
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-red-600" />
            Staff Management
          </CardTitle>
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No staff members yet. Add your first staff member.
            </p>
          ) : (
            <div className="space-y-3">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{s.name}</p>
                      {s.active ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-200 text-gray-600 hover:bg-gray-200 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.email} • {s.phone || "No phone"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Active</Label>
                      <Switch
                        checked={s.active}
                        onCheckedChange={() => toggleActive(s.id, s.active)}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(s)}
                      className="cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {s.name} from the system. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteStaff(s.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Staff" : "Add New Staff"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update staff member details" : "Add a new staff member to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="Staff member name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="staff@example.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="text"
                placeholder="Login password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white cursor-pointer"
            >
              {loading ? "Saving..." : editId ? "Update Staff" : "Add Staff"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
