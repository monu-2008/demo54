// Shared types for Admin and Staff dashboards

export interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  address: string;
  serviceType: string;
  problemDescription: string;
  status: "pending" | "accepted" | "completed";
  acceptedBy: string | null;
  acceptedById?: string;
  acceptedAt: number | null;
  createdAt: number;
  completedAt: number | null;
  customerLat?: number;
  customerLng?: number;
  customerLocationTime?: number;
}

export interface ProductOrder {
  id: string;
  productName: string;
  productPrice: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: "pending" | "confirmed";
  createdAt: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  active: boolean;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  type?: string;
  variant?: string;
  order: number;
}

export interface StaffLocation {
  staffId: string;
  staffName: string;
  lat: number;
  lng: number;
  lastUpdated: number;
  activeRequestId: string;
  activeRequestName: string;
  activeRequestService: string;
}

// Utility functions
export const formatDate = (ts: number) =>
  new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const getTimeSince = (ts: number) => {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
  return `${seconds}s ago`;
};
