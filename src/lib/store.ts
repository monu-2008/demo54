import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppView = "main" | "fullProducts";
export type AdminType = "none" | "admin" | "master";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AdminUser {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

interface AppState {
  view: AppView;
  adminLoggedIn: boolean;
  adminType: AdminType;
  adminUser: AdminUser | null;
  staffLoggedIn: boolean;
  staffUser: StaffUser | null;
  bookingModalOpen: boolean;
  setView: (view: AppView) => void;
  setAdminLoggedIn: (val: boolean) => void;
  setAdminType: (type: AdminType) => void;
  setAdminUser: (user: AdminUser | null) => void;
  setStaffLoggedIn: (val: boolean) => void;
  setStaffUser: (user: StaffUser | null) => void;
  setBookingModalOpen: (val: boolean) => void;
  adminLogout: () => void;
  staffLogout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: "main",
      adminLoggedIn: false,
      adminType: "none",
      adminUser: null,
      staffLoggedIn: false,
      staffUser: null,
      bookingModalOpen: false,
      setView: (view) => set({ view }),
      setAdminLoggedIn: (val) => set({ adminLoggedIn: val }),
      setAdminType: (type) => set({ adminType: type }),
      setAdminUser: (adminUser) => set({ adminUser }),
      setStaffLoggedIn: (val) => set({ staffLoggedIn: val }),
      setStaffUser: (staffUser) => set({ staffUser }),
      setBookingModalOpen: (val) => set({ bookingModalOpen: val }),
      adminLogout: () => set({ adminLoggedIn: false, adminType: "none", adminUser: null }),
      staffLogout: () => set({ staffUser: null, staffLoggedIn: false }),
    }),
    {
      name: "race-computer-store", // localStorage key
      partialize: (state) => ({
        // Only persist these fields (not modal states etc.)
        adminLoggedIn: state.adminLoggedIn,
        adminType: state.adminType,
        adminUser: state.adminUser,
        staffLoggedIn: state.staffLoggedIn,
        staffUser: state.staffUser,
      }),
    }
  )
);
