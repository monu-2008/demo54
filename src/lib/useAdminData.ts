"use client";

import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { rtdbToArray } from "@/lib/rtdbHelpers";
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
      setServiceRequests(rtdbToArray<ServiceRequest>(snap, "createdAt"));
    });

    const unsub2 = onValue(ref(db, "productOrders"), (snap) => {
      setProductOrders(rtdbToArray<ProductOrder>(snap, "createdAt"));
    });

    const unsub3 = onValue(ref(db, "staff"), (snap) => {
      setStaff(rtdbToArray<StaffMember>(snap, "createdAt"));
    });

    const unsub4 = onValue(ref(db, "products"), (snap) => {
      setProducts(rtdbToArray<Product>(snap, "order"));
    });

    const unsub5 = onValue(ref(db, "settings/admin"), (snap) => {
      if (snap.exists()) setAdminSettings(snap.val());
    });

    const unsub6 = onValue(ref(db, "staffLocations"), (snap) => {
      const locs: StaffLocation[] = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const data = child.val();
          if (data && data.lat && data.lng) {
            locs.push({
              staffId: child.key || "",
              staffName: data.staffName || "Unknown",
              lat: data.lat,
              lng: data.lng,
              lastUpdated: data.lastUpdated || 0,
              activeRequestId: data.activeRequestId || "",
              activeRequestName: data.activeRequestName || "",
              activeRequestService: data.activeRequestService || "",
            });
          }
        });
      }
      setStaffLocations(locs);
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
