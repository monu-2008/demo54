"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { ServiceRequest, ProductOrder, StaffMember, Product, StaffLocation } from "./adminTypes";

export interface AdminData {
  serviceRequests: ServiceRequest[];
  productOrders: ProductOrder[];
  staff: StaffMember[];
  products: Product[];
  staffLocations: StaffLocation[];
  adminSettings: { email: string; password: string };
  pendingRequests: ServiceRequest[];
  acceptedRequests: ServiceRequest[];
  completedRequests: ServiceRequest[];
}

export function useAdminData(): AdminData {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffLocations, setStaffLocations] = useState<StaffLocation[]>([]);
  const [adminSettings, setAdminSettings] = useState({ email: "admin@racecomputer.in", password: "admin123" });

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
      } else setStaffLocations([]);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); };
  }, []);

  const pendingRequests = serviceRequests.filter((r) => r.status === "pending");
  const acceptedRequests = serviceRequests.filter((r) => r.status === "accepted");
  const completedRequests = serviceRequests.filter((r) => r.status === "completed");

  return {
    serviceRequests,
    productOrders,
    staff,
    products,
    staffLocations,
    adminSettings,
    pendingRequests,
    acceptedRequests,
    completedRequests,
  };
}
