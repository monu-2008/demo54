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
