"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue, update, remove, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { ServiceRequest, ProductOrder, StaffMember, Product, StaffLocation } from "./types";

export function useAdminData() {
  const { adminLogout, adminType } = useAppStore();
  const { toast } = useToast();
  const masterVerified = adminType === "master";

  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffLocations, setStaffLocations] = useState<StaffLocation[]>([]);
  const [adminSettings, setAdminSettings] = useState({ email: "admin@racecomputer.in", password: "admin123" });

  // Staff form state
  const [staffFormOpen, setStaffFormOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Product form state
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", price: "", category: "Accessories", image: "", description: "", type: "", variant: "" });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firebase listeners
  useEffect(() => {
    const unsub1 = onValue(ref(db, "serviceRequests"), (snap) => {
      if (snap.exists()) {
        const reqs: ServiceRequest[] = [];
        snap.forEach((child) => reqs.push({ id: child.key || "", ...child.val() }));
        reqs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setServiceRequests(reqs);
      } else setServiceRequests([]);
    });

    const unsub2 = onValue(ref(db, "productOrders"), (snap) => {
      if (snap.exists()) {
        const ords: ProductOrder[] = [];
        snap.forEach((child) => ords.push({ id: child.key || "", ...child.val() }));
        ords.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setProductOrders(ords);
      } else setProductOrders([]);
    });

    const unsub3 = onValue(ref(db, "staff"), (snap) => {
      if (snap.exists()) {
        const s: StaffMember[] = [];
        snap.forEach((child) => s.push({ id: child.key || "", ...child.val() }));
        setStaff(s);
      } else setStaff([]);
    });

    const unsub4 = onValue(ref(db, "products"), (snap) => {
      if (snap.exists()) {
        const p: Product[] = [];
        snap.forEach((child) => p.push({ id: child.key || "", ...child.val() }));
        setProducts(p);
      } else setProducts([]);
    });

    const unsub5 = onValue(ref(db, "settings/admin"), (snap) => {
      if (snap.exists()) setAdminSettings(snap.val());
    });

    const unsub6 = onValue(ref(db, "staffLocations"), (snap) => {
      if (snap.exists()) {
        const locs: StaffLocation[] = [];
        snap.forEach((child) => {
          const data = child.val();
          if (data) {
            locs.push({
              staffId: child.key || "",
              staffName: data.staffName || "Unknown",
              lat: data.lat || 0,
              lng: data.lng || 0,
              lastUpdated: data.lastUpdated || 0,
              activeRequestId: data.activeRequestId || "",
              activeRequestName: data.activeRequestName || "",
              activeRequestService: data.activeRequestService || "",
            });
          }
        });
        setStaffLocations(locs);
      } else {
        setStaffLocations([]);
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); };
  }, []);

  // Derived data
  const pendingRequests = serviceRequests.filter((r) => r.status === "pending");
  const acceptedRequests = serviceRequests.filter((r) => r.status === "accepted");
  const completedRequests = serviceRequests.filter((r) => r.status === "completed");

  // Helper functions
  const formatDate = (ts: number) => new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const getTimeSince = (ts: number) => {
    const diff = Date.now() - ts;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
    return `${seconds}s ago`;
  };

  const getStaffStats = (staffName: string) => {
    const completed = serviceRequests.filter(r => r.acceptedBy === staffName && r.status === "completed").length;
    const active = serviceRequests.filter(r => r.acceptedBy === staffName && r.status === "accepted").length;
    return { completed, active };
  };

  // Actions - Service Requests
  const markCompleted = async (id: string) => {
    await update(ref(db, `serviceRequests/${id}`), { status: "completed", completedAt: Date.now() });
    toast({ title: "Marked as completed" });
  };

  const deleteRequest = async (id: string) => {
    await remove(ref(db, `serviceRequests/${id}`));
    toast({ title: "Request deleted" });
  };

  // Actions - Product Orders
  const confirmOrder = async (id: string) => {
    await update(ref(db, `productOrders/${id}`), { status: "confirmed" });
    toast({ title: "Order confirmed" });
  };

  const deleteOrder = async (id: string) => {
    await remove(ref(db, `productOrders/${id}`));
    toast({ title: "Order deleted" });
  };

  // Actions - Staff CRUD
  const saveStaff = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    if (editingStaffId) {
      await update(ref(db, `staff/${editingStaffId}`), staffForm);
      toast({ title: "Staff updated" });
    } else {
      await push(ref(db, "staff"), { ...staffForm, active: true, createdAt: Date.now() });
      toast({ title: "Staff added" });
    }
    setStaffFormOpen(false);
    setStaffForm({ name: "", email: "", password: "", phone: "" });
    setEditingStaffId(null);
  };

  const editStaff = (s: StaffMember) => {
    setStaffForm({ name: s.name, email: s.email, password: s.password, phone: s.phone || "" });
    setEditingStaffId(s.id);
    setStaffFormOpen(true);
  };

  const deleteStaff = async (id: string) => {
    await remove(ref(db, `staff/${id}`));
    toast({ title: "Staff removed" });
  };

  const toggleStaffActive = async (s: StaffMember) => {
    await update(ref(db, `staff/${s.id}`), { active: !s.active });
  };

  // Actions - Product CRUD
  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 600;
          let w = img.width;
          let h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w > h) { h = (h / w) * maxSize; w = maxSize; }
            else { w = (w / h) * maxSize; h = maxSize; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setProductForm((prev) => ({ ...prev, image: dataUrl }));
          setImageUploading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Image upload failed", variant: "destructive" });
      setImageUploading(false);
    }
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    if (editingProductId) {
      await update(ref(db, `products/${editingProductId}`), productForm);
      toast({ title: "Product updated" });
    } else {
      await push(ref(db, "products"), { ...productForm, order: products.length });
      toast({ title: "Product added" });
    }
    setProductFormOpen(false);
    setProductForm({ name: "", price: "", category: "Accessories", image: "", description: "", type: "", variant: "" });
    setEditingProductId(null);
  };

  const editProduct = (p: Product) => {
    setProductForm({ name: p.name, price: p.price, category: p.category, image: p.image || "", description: p.description || "", type: p.type || "", variant: p.variant || "" });
    setEditingProductId(p.id);
    setProductFormOpen(true);
  };

  const deleteProduct = async (id: string) => {
    await remove(ref(db, `products/${id}`));
    toast({ title: "Product deleted" });
  };

  // Actions - Master Admin
  const updateAdminCredentials = async () => {
    await set(ref(db, "settings/admin"), adminSettings);
    toast({ title: "Admin credentials updated!" });
  };

  const handleLogout = () => {
    adminLogout();
    window.location.href = '/';
  };

  return {
    // State
    masterVerified,
    serviceRequests, productOrders, staff, products, staffLocations,
    pendingRequests, acceptedRequests, completedRequests,
    adminSettings, setAdminSettings,
    // Staff form
    staffFormOpen, setStaffFormOpen, staffForm, setStaffForm,
    editingStaffId, setEditingStaffId,
    // Product form
    productFormOpen, setProductFormOpen, productForm, setProductForm,
    editingProductId, setEditingProductId,
    imageUploading, fileInputRef,
    // Helpers
    formatDate, getTimeSince, getStaffStats,
    // Actions
    markCompleted, deleteRequest,
    confirmOrder, deleteOrder,
    saveStaff, editStaff, deleteStaff, toggleStaffActive,
    saveProduct, editProduct, deleteProduct, handleImageUpload,
    updateAdminCredentials, handleLogout,
  };
}
