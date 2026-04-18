"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ref, update, remove, set, onValue, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { rtdbToArray } from "@/lib/rtdbHelpers";
import {
  LogOut, ArrowLeft, Settings, ExternalLink,
} from "lucide-react";
import LiveTrackingTab from "@/components/admin/LiveTrackingTab";
import type { StaffLocation } from "@/components/admin/types";

// ── PRESET THEMES ──
const PRESET_THEMES = [
  { id: 'cyber-blue', name: 'Cyber Blue', desc: 'Classic neon blue', cyan: '#00f5ff', blue: '#0080ff', purple: '#7b2fff' },
  { id: 'neon-green', name: 'Neon Matrix', desc: 'Hacker green glow', cyan: '#00ff88', blue: '#00cc55', purple: '#007733' },
  { id: 'crimson-fire', name: 'Crimson Fire', desc: 'Red hot energy', cyan: '#ff4455', blue: '#ff2200', purple: '#cc0033' },
  { id: 'gold-luxury', name: 'Gold Luxe', desc: 'Premium gold & black', cyan: '#ffd700', blue: '#ff9900', purple: '#cc7700' },
  { id: 'violet-haze', name: 'Violet Haze', desc: 'Deep purple dream', cyan: '#cc44ff', blue: '#8800ff', purple: '#5500cc' },
  { id: 'arctic-ice', name: 'Arctic Ice', desc: 'Cool white ice', cyan: '#aaeeff', blue: '#66ccff', purple: '#3399ee' },
  { id: 'solar-orange', name: 'Solar Flare', desc: 'Warm orange power', cyan: '#ff8800', blue: '#ff5500', purple: '#cc3300' },
  { id: 'rose-pink', name: 'Rose Gold', desc: 'Pink neon vibes', cyan: '#ff66cc', blue: '#ff2299', purple: '#cc0077' },
  { id: 'teal-mint', name: 'Teal Mint', desc: 'Fresh teal glow', cyan: '#00ffcc', blue: '#00cc99', purple: '#009966' },
  { id: 'white-stark', name: 'Stark White', desc: 'Clean & minimal', cyan: '#ffffff', blue: '#cccccc', purple: '#999999' },
  { id: 'lava-red', name: 'Lava Red', desc: 'Deep red inferno', cyan: '#ff3300', blue: '#cc1100', purple: '#990000' },
  { id: 'electric-lime', name: 'Electric Lime', desc: 'High voltage lime', cyan: '#ccff00', blue: '#99ee00', purple: '#66cc00' },
];

// ── BG ANIMATIONS ──
const BG_ANIMATIONS = [
  { id: 'particles', name: 'Particles', desc: 'Floating dots' },
  { id: 'grid', name: 'Cyber Grid', desc: 'Animated grid' },
  { id: 'waves', name: 'Waves', desc: 'Smooth waves' },
  { id: 'matrix', name: 'Matrix Rain', desc: 'Code falling' },
  { id: 'nebula', name: 'Nebula', desc: 'Space clouds' },
  { id: 'hexagon', name: 'Hexagons', desc: 'Hex grid pattern' },
  { id: 'aurora', name: 'Aurora', desc: 'Northern lights' },
  { id: 'starfield', name: 'Starfield', desc: 'Deep space stars' },
  { id: 'circuit', name: 'Circuit', desc: 'PCB traces' },
  { id: 'none', name: 'None', desc: 'Solid background' },
];

// ── CLOUDINARY CONFIG ──
const CLOUDINARY_CONFIG = { cloudName: "dbxfqh6zz", uploadPreset: "racecomp" };

// ── SETTINGS SUB-TABS ──
const SETTINGS_TABS = [
  { id: "appearance", icon: "🎨", label: "Theme & Colors" },
  { id: "hero", icon: "🏠", label: "Hero Section" },
  { id: "section-headers", icon: "📝", label: "Section Headers" },
  { id: "contact-info", icon: "📞", label: "Contact Info" },
  { id: "services", icon: "⚙️", label: "Services" },
  { id: "products", icon: "📦", label: "Products" },
  { id: "branches", icon: "🏪", label: "Branches" },
  { id: "gallery", icon: "🖼️", label: "Gallery" },
  { id: "about-section", icon: "📖", label: "About Section" },
  { id: "ticker", icon: "📢", label: "Ticker Bar" },
  { id: "footer", icon: "🔻", label: "Footer" },
  { id: "form-options", icon: "📋", label: "Form Options" },
];

// ── DEFAULT DATA ──
function getDefaultServices() {
  return [
    { icon: "💻", num: "01", title: "Desktop & Laptops", desc: "Latest PCs, gaming rigs and laptops from top brands.", order: 0 },
    { icon: "📱", num: "02", title: "Mobile Phones", desc: "Authorized ASUS dealer. Latest smartphones.", order: 1 },
    { icon: "🖨️", num: "03", title: "Printers & Peripherals", desc: "Inkjet, laser, multifunction printers.", order: 2 },
    { icon: "🔧", num: "04", title: "Repair & Service", desc: "Expert hardware & software repair.", order: 3 },
    { icon: "🌐", num: "05", title: "Networking Solutions", desc: "WiFi routers, switches, LAN cables.", order: 4 },
    { icon: "🛡️", num: "06", title: "AMC & Support", desc: "Annual Maintenance Contracts for offices.", order: 5 },
  ];
}

function getDefaultProducts() {
  return [
    { icon: "💻", badge: "ASUS", name: "ASUS Laptops", sub: "VivoBook, ROG, TUF Series", image: "", order: 0 },
    { icon: "🖥️", badge: "CUSTOM", name: "Assembled PCs", sub: "Gaming & workstation builds", image: "", order: 1 },
    { icon: "📱", badge: "ASUS", name: "Smartphones", sub: "Zenfone & ROG Phone series", image: "", order: 2 },
    { icon: "🖨️", badge: "HP · EPSON", name: "Printers", sub: "Laser, inkjet, multifunction", image: "", order: 3 },
    { icon: "⌨️", badge: "ALL BRANDS", name: "Peripherals", sub: "Keyboards, mice, monitors", image: "", order: 4 },
    { icon: "📡", badge: "NETWORKING", name: "Networking Gear", sub: "Routers, switches, cables", image: "", order: 5 },
    { icon: "🎮", badge: "GAMING", name: "Gaming Gear", sub: "Headsets, controllers, chairs", image: "", order: 6 },
    { icon: "🔋", badge: "ACCESSORIES", name: "Power & UPS", sub: "Inverters, UPS, power banks", image: "", order: 7 },
  ];
}

function getDefaultBranches() {
  return [
    { tag: "BRANCH 01", name: "Sanganer Store", badge: "RETAIL STORE", isMain: false, address: "S. No 1, Opposite Gosala, Sheopur Road, Pratapnagar, Sanganer Bazar, Jaipur — 302029", phone: "", whatsapp: "", email: "", hours: "Mon – Sat: 10:00 AM – 8:00 PM | Sunday: Closed", mapUrl: "https://maps.google.com/?q=Race+Computer+Sanganer+Jaipur", order: 0 },
    { tag: "BRANCH 02", name: "Main Branch", badge: "MAIN STORE", isMain: true, address: "— To be updated —", phone: "", whatsapp: "", email: "", hours: "— To be updated —", mapUrl: "", order: 1 },
  ];
}

// ── FORMAT TIME ──
function formatTime(ts: number) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ── TYPES ──
interface Enquiry {
  id: string;
  name: string;
  phone: string;
  type: string;
  category: string;
  message: string;
  status: string;
  timestamp: number;
  createdAt: number;
  [key: string]: unknown;
}

interface ProductOrder {
  id: string;
  orderId?: string;
  productName: string;
  productPrice: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: string;
  createdAt: number;
  customerLat?: number;
  customerLng?: number;
  customerLocationTime?: number;
  [key: string]: unknown;
}

interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  address: string;
  serviceType: string;
  problemDescription: string;
  status: string;
  acceptedBy: string;
  customerLat?: number;
  customerLng?: number;
  customerLocationTime?: number;
  createdAt: number;
  [key: string]: unknown;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  active: boolean;
  createdAt: number;
  [key: string]: unknown;
}

interface LocalService {
  id?: string;
  icon: string;
  num: string;
  title: string;
  desc: string;
  order: number;
  [key: string]: unknown;
}

interface LocalProduct {
  id?: string;
  icon: string;
  badge: string;
  name: string;
  sub: string;
  image: string;
  order: number;
  [key: string]: unknown;
}

interface LocalBranch {
  id?: string;
  tag: string;
  name: string;
  badge: string;
  isMain: boolean;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  mapUrl: string;
  order: number;
  [key: string]: unknown;
}

interface LocalGalleryItem {
  id?: string;
  url: string;
  title: string;
  category: string;
  description: string;
  order: number;
  [key: string]: unknown;
}

interface SiteSettings {
  storeName?: string;
  heroSubtitle?: string;
  heroTagline?: string;
  heroEyebrow?: string;
  heroCtaPrimary?: string;
  heroCtaSecondary?: string;
  heroTrustStars?: string;
  heroTrustReviews?: string;
  heroTrustLocation?: string;
  heroPills?: { label: string; dotColor: string }[];
  heroChips?: { icon: string; text: string; color: string }[];
  themeColor?: string;
  themeBlue?: string;
  themePurple?: string;
  themeId?: string;
  bgAnimation?: string;
  siteMode?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  hours?: string;
  mapUrl?: string;
  stats?: { years?: string; rating?: string; reviews?: string; customers?: string; branches?: string; numYears?: string; numReviews?: string; numRating?: string; numCustomers?: string };
  servicesHeader?: string;
  servicesTitle?: string;
  servicesSubtitle?: string;
  productsHeader?: string;
  productsTitle?: string;
  productsSubtitle?: string;
  productCategories?: string[];
  galleryHeader?: string;
  galleryTitle?: string;
  gallerySubtitle?: string;
  aboutHeader?: string;
  aboutTitle?: string;
  aboutSubtitle?: string;
  contactHeader?: string;
  contactTitle?: string;
  contactSubtitle?: string;
  aboutStory?: string[];
  aboutTimeline?: { year: string; title: string; desc: string }[];
  asusPartnerText?: string;
  footerLinks?: string[];
  tickerItems?: string[];
  serviceTypes?: string[];
  enquiryCategories?: string[];
  [key: string]: unknown;
}

// ── HELPER COMPONENTS (must be OUTSIDE AdminDashboard to prevent re-mount on every keystroke) ──

const StatusBadge = ({ status }: { status: string }) => {
  const s = status || "new";
  const styles: Record<string, string> = {
    new: "bg-blue-50 text-blue-600 border-blue-200",
    pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
    done: "bg-green-50 text-green-600 border-green-200",
  };
  const cls = styles[s] || styles.new;
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {s.toUpperCase()}
    </span>
  );
};

const ProductOrderStatusBadge = ({ status }: { status: string }) => {
  const s = status || "pending";
  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
    confirmed: "bg-green-50 text-green-600 border-green-200",
  };
  const cls = styles[s] || styles.pending;
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {s.toUpperCase()}
    </span>
  );
};

const ServiceReqStatusBadge = ({ status }: { status: string }) => {
  const s = status || "pending";
  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
    accepted: "bg-blue-50 text-blue-600 border-blue-200",
    completed: "bg-green-50 text-green-600 border-green-200",
  };
  const cls = styles[s] || styles.pending;
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>
      {s.toUpperCase()}
    </span>
  );
};

const FormField = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={`flex flex-col gap-1.5 ${full ? "col-span-1 sm:col-span-2" : ""}`}>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const FormInput = ({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input
    type={type}
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
  />
);

const FormTextarea = ({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-vertical min-h-[60px]"
  />
);

const SaveBtn = ({ onClick, loading, children }: { onClick: () => void; loading: boolean; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
  >
    {loading ? "Saving..." : children}
  </button>
);

const DelBtn = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all cursor-pointer font-medium"
  >
    ✕ Remove
  </button>
);

const AddBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all inline-flex items-center gap-2 cursor-pointer font-medium"
  >
    {children}
  </button>
);

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-5">
    {title && (
      <div className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-3 h-0.5 bg-red-500 rounded-full" /> {title}
      </div>
    )}
    {children}
  </div>
);

// ── ADMIN ACCESS CONTROL ──
const ALLOWED_ADMIN_EMAILS = [
  "racecomputer16000@gmail.com",
  "manmohansharma002008@gmail.com",
];
const MASTER_ADMIN_EMAIL = "manmohansharma002008@gmail.com";

export default function AdminDashboard() {
  const { adminLogout, adminUser, adminType, setAdminType } = useAppStore();
  const isMobile = useIsMobile();

  // ── ADMIN ACCESS CHECK ──
  const isAdminEmail = adminUser?.email ? ALLOWED_ADMIN_EMAILS.includes(adminUser.email.toLowerCase()) : false;
  const isMasterAdmin = adminUser?.email?.toLowerCase() === MASTER_ADMIN_EMAIL;

  // Update admin type based on email
  useEffect(() => {
    if (adminUser?.email) {
      if (isMasterAdmin) {
        setAdminType("master");
      } else if (isAdminEmail) {
        setAdminType("admin");
      }
    }
  }, [adminUser?.email, isMasterAdmin, isAdminEmail, setAdminType]);

  // ── NAV ──
  const [activePanel, setActivePanel] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("appearance");

  // ── ENQUIRIES ──
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiryFilter, setEnquiryFilter] = useState("all");
  const [enquiryDateFrom, setEnquiryDateFrom] = useState("");
  const [enquiryDateTo, setEnquiryDateTo] = useState("");
  const [enquiryQuickDate, setEnquiryQuickDate] = useState("all");
  const [enquiryDebugInfo, setEnquiryDebugInfo] = useState("");
  const [enquiryPage, setEnquiryPage] = useState(1);
  const ENQUIRIES_PER_PAGE = 50;

  // ── PRODUCT ORDERS ──
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [productOrderFilter, setProductOrderFilter] = useState("all");
  const [productOrderSearch, setProductOrderSearch] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [orderQuickDate, setOrderQuickDate] = useState("all");

  // ── SERVICE REQUESTS ──
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [serviceReqFilter, setServiceReqFilter] = useState("all");
  const [serviceDateFrom, setServiceDateFrom] = useState("");
  const [serviceDateTo, setServiceDateTo] = useState("");
  const [serviceQuickDate, setServiceQuickDate] = useState("all");

  // ── STAFF ──
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");

  // ── SETTINGS ──
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [selectedThemeId, setSelectedThemeId] = useState("cyber-blue");
  const [selectedBgAnim, setSelectedBgAnim] = useState("particles");
  const [selectedMode, setSelectedMode] = useState("dark");

  // ── SERVICES ──
  const [localServices, setLocalServices] = useState<LocalService[]>(getDefaultServices());

  // ── PRODUCTS ──
  const [localProducts, setLocalProducts] = useState<LocalProduct[]>(getDefaultProducts());
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // ── BRANCHES ──
  const [localBranches, setLocalBranches] = useState<LocalBranch[]>(getDefaultBranches());

  // ── GALLERY ──
  const [localGallery, setLocalGallery] = useState<LocalGalleryItem[]>([
    { url: "", title: "Gaming PC Setup", category: "Custom Builds", description: "High-performance gaming rig with RGB", order: 0 },
    { url: "", title: "ASUS VivoBook Display", category: "Laptops", description: "Latest ASUS VivoBook series", order: 1 },
    { url: "", title: "Printer Station", category: "Printers", description: "HP & Epson multi-function printers", order: 2 },
    { url: "", title: "Networking Setup", category: "Networking", description: "Complete office network installation", order: 3 },
    { url: "", title: "Repair Workshop", category: "Repairs", description: "Expert repair in action", order: 4 },
    { url: "", title: "Desktop Assembly", category: "Custom Builds", description: "Custom PC build for client", order: 5 },
    { url: "", title: "Laptop Repair", category: "Repairs", description: "Motherboard-level repair", order: 6 },
    { url: "", title: "Accessories Wall", category: "Accessories", description: "Keyboards, mice & more", order: 7 },
  ]);
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState<number | null>(null);

  // ── TICKER ──
  const [localTickerItems, setLocalTickerItems] = useState<string[]>([
    "ASUS AUTHORIZED DEALER",
    "LAPTOP & PC REPAIR",
    "HOME SERVICE AVAILABLE",
    "25+ YEARS TRUST",
    "ASUS VIVOBOOK",
    "GAMING RIGS",
    "CUSTOM PC BUILD",
    "PRINTER SOLUTIONS",
    "NETWORKING",
    "AMC SUPPORT",
    "SANGANER BAZAR · JAIPUR",
    "4★ GOOGLE RATED",
  ]);

  // ── LIVE TRACKING ──
  const [staffLocations, setStaffLocations] = useState<StaffLocation[]>([]);
  const [mapExpanded, setMapExpanded] = useState(false);

  // ── LOADING ──
  const [saving, setSaving] = useState<string | null>(null);

  // ═══════════════════════════════════════
  //  FIREBASE LISTENERS
  // ═══════════════════════════════════════

  // rtdbToArray is now imported from @/lib/rtdbHelpers — shared bullet-proof helper

  // ── ENQUIRIES: Real-time listener (onValue fires immediately with current data) ──
  useEffect(() => {
    const enquiriesRef = ref(db, "enquiries");
    const unsub = onValue(enquiriesRef, (snap) => {
      const list = rtdbToArray<Enquiry>(snap, "createdAt");
      console.log(`[Firebase] Enquiries loaded: ${list.length} items`);
      setEnquiries(list);
      setEnquiryDebugInfo(`onValue: ${list.length} enquiries`);
    }, (error) => {
      console.error("[Firebase] Enquiries error:", error);
    });
    return unsub;
  }, []);

  // ── PRODUCT ORDERS: Real-time listener ──
  useEffect(() => {
    const unsub = onValue(ref(db, "productOrders"), (snap) => {
      const list = rtdbToArray<ProductOrder>(snap, "createdAt");
      console.log(`[Firebase] Product Orders loaded: ${list.length} items`);
      setProductOrders(list);
    });
    return unsub;
  }, []);

  // ── SERVICE REQUESTS: Real-time listener ──
  useEffect(() => {
    const unsub = onValue(ref(db, "serviceRequests"), (snap) => {
      const list = rtdbToArray<ServiceRequest>(snap, "createdAt");
      console.log(`[Firebase] Service Requests loaded: ${list.length} items`);
      setServiceRequests(list);
    });
    return unsub;
  }, []);

  // ── STAFF: Real-time listener ──
  useEffect(() => {
    const unsub = onValue(ref(db, "staff"), (snap) => {
      const list = rtdbToArray<StaffMember>(snap, "createdAt");
      console.log(`[Firebase] Staff loaded: ${list.length} items`);
      setStaffList(list);
    });
    return unsub;
  }, []);

  // ── SETTINGS: Real-time listener ──
  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) {
        const d = snap.val() as SiteSettings;
        setSiteSettings(d);
        if (d.themeId) setSelectedThemeId(d.themeId);
        if (d.bgAnimation) setSelectedBgAnim(d.bgAnimation);
        if (d.siteMode) setSelectedMode(d.siteMode);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await get(ref(db, "services"));
        if (snap.exists()) {
          const list: LocalService[] = [];
          snap.forEach((child) => list.push({ id: child.key || "", ...child.val() as Omit<LocalService, 'id'> }));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setLocalServices(list.length ? list : getDefaultServices());
        }
      } catch { /* use defaults */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await get(ref(db, "products"));
        if (snap.exists()) {
          const list: LocalProduct[] = [];
          snap.forEach((child) => list.push({ id: child.key || "", ...child.val() as Omit<LocalProduct, 'id'> }));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setLocalProducts(list.length ? list : getDefaultProducts());
        }
      } catch { /* use defaults */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await get(ref(db, "branches"));
        if (snap.exists()) {
          const list: LocalBranch[] = [];
          snap.forEach((child) => list.push({ id: child.key || "", ...child.val() as Omit<LocalBranch, 'id'> }));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setLocalBranches(list.length ? list : getDefaultBranches());
        }
      } catch { /* use defaults */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await get(ref(db, "gallery"));
        if (snap.exists()) {
          const list: LocalGalleryItem[] = [];
          snap.forEach((child) => list.push({ id: child.key || "", ...child.val() as Omit<LocalGalleryItem, 'id'> }));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          if (list.length) setLocalGallery(list);
        }
      } catch { /* use defaults */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await get(ref(db, "settings/site/tickerItems"));
        if (snap.exists()) {
          const data = snap.val();
          if (Array.isArray(data) && data.length > 0) {
            setLocalTickerItems(data.filter((item: unknown) => typeof item === "string" && item.trim()));
          }
        }
      } catch { /* use defaults */ }
    })();
  }, []);

  // Listen for staff live locations
  useEffect(() => {
    const unsub = onValue(ref(db, "staffLocations"), (snap) => {
      const locs: StaffLocation[] = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const d = child.val();
          if (d && d.lat && d.lng) {
            locs.push({
              staffId: child.key || "",
              staffName: d.staffName || "Unknown",
              lat: d.lat,
              lng: d.lng,
              lastUpdated: d.lastUpdated || Date.now(),
              activeRequestId: d.activeRequestId || "",
              activeRequestName: d.activeRequestName || "",
              activeRequestService: d.activeRequestService || "",
            });
          }
        });
      }
      setStaffLocations(locs);
    });
    return unsub;
  }, []);

  // ═══════════════════════════════════════
  //  COMPUTED
  // ═══════════════════════════════════════

  // ── DATE FILTER HELPERS ──
  const getDateRange = (quickDate: string): { from: number; to: number } | null => {
    if (quickDate === "all") return null;
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    let from: number;
    switch (quickDate) {
      case "today":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
        break;
      case "yesterday": {
        const yd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        from = yd.getTime();
        const yto = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999).getTime();
        return { from, to: yto };
      }
      case "7days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0).getTime();
        break;
      case "30days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0).getTime();
        break;
      case "thisMonth":
        from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
        break;
      case "lastMonth": {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        from = lm.getTime();
        const lmTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
        return { from, to: lmTo };
      }
      default:
        return null;
    }
    return { from, to };
  };

  const filterByDateRange = (items: { createdAt?: number; timestamp?: number }[], dateFrom: string, dateTo: string, quickDate: string) => {
    // Custom date range takes priority
    if (dateFrom || dateTo) {
      return items.filter((item) => {
        const ts = item.createdAt || item.timestamp || 0;
        if (dateFrom) {
          const fromTs = new Date(dateFrom).getTime();
          if (ts < fromTs) return false;
        }
        if (dateTo) {
          const toTs = new Date(dateTo).getTime() + 86400000 - 1; // end of day
          if (ts > toTs) return false;
        }
        return true;
      });
    }
    // Quick date filter
    const range = getDateRange(quickDate);
    if (!range) return items;
    return items.filter((item) => {
      const ts = item.createdAt || item.timestamp || 0;
      return ts >= range.from && ts <= range.to;
    });
  };

  const QUICK_DATE_OPTIONS = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7days", label: "Last 7 Days" },
    { id: "30days", label: "Last 30 Days" },
    { id: "thisMonth", label: "This Month" },
    { id: "lastMonth", label: "Last Month" },
  ];

  const filteredEnquiries = filterByDateRange(
    enquiryFilter === "all"
      ? enquiries
      : enquiries.filter((e) => {
          if (enquiryFilter === "new") return !e.status || e.status === "new";
          return e.status === enquiryFilter;
        }),
    enquiryDateFrom,
    enquiryDateTo,
    enquiryQuickDate
  );

  // Pagination for enquiries
  const totalEnquiryPages = Math.max(1, Math.ceil(filteredEnquiries.length / ENQUIRIES_PER_PAGE));
  const paginatedEnquiries = filteredEnquiries.slice((enquiryPage - 1) * ENQUIRIES_PER_PAGE, enquiryPage * ENQUIRIES_PER_PAGE);

  // Reset page when filter changes
  useEffect(() => { setEnquiryPage(1); }, [enquiryFilter, enquiryDateFrom, enquiryDateTo, enquiryQuickDate]);

  const newEnquiryCount = enquiries.filter((e) => !e.status || e.status === "new").length;

  const filteredProductOrders = filterByDateRange(
    (productOrderFilter === "all"
      ? productOrders
      : productOrders.filter((o) => {
          if (productOrderFilter === "pending") return !o.status || o.status === "pending";
          return o.status === productOrderFilter;
        })
    ).filter((o) => {
      if (!productOrderSearch.trim()) return true;
      const search = productOrderSearch.trim().toUpperCase();
      const orderId = o.orderId || ("RC-" + o.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase());
      return orderId.includes(search) ||
        (o.customerName || "").toUpperCase().includes(search) ||
        (o.customerPhone || "").includes(search) ||
        (o.productName || "").toUpperCase().includes(search);
    }),
    orderDateFrom,
    orderDateTo,
    orderQuickDate
  );

  const pendingProductOrderCount = productOrders.filter((o) => !o.status || o.status === "pending").length;

  const filteredServiceReqs = filterByDateRange(
    serviceReqFilter === "all"
      ? serviceRequests
      : serviceRequests.filter((r) => {
          if (serviceReqFilter === "pending") return !r.status || r.status === "pending";
          return r.status === serviceReqFilter;
        }),
    serviceDateFrom,
    serviceDateTo,
    serviceQuickDate
  );

  const pendingServiceReqCount = serviceRequests.filter((r) => !r.status || r.status === "pending").length;

  const cyan = siteSettings.themeColor || "#00f5ff";
  const blue = siteSettings.themeBlue || "#0080ff";
  const purple = siteSettings.themePurple || "#7b2fff";

  // Helper for live tracking time display
  const getTimeSince = (ts: number) => {
    const diff = Date.now() - ts;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  // ═══════════════════════════════════════
  //  NAV HANDLERS
  // ═══════════════════════════════════════

  const showPanel = useCallback((id: string) => {
    setActivePanel(id);
    setSidebarOpen(false);
  }, []);

  // ═══════════════════════════════════════
  //  ENQUIRY ACTIONS
  // ═══════════════════════════════════════

  const markDone = async (id: string) => {
    await update(ref(db, `enquiries/${id}`), { status: "done" });
    toast.success("Marked as done");
  };

  const markPending = async (id: string) => {
    await update(ref(db, `enquiries/${id}`), { status: "pending" });
    toast.success("Marked as pending");
  };

  const deleteEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    await remove(ref(db, `enquiries/${id}`));
    toast.success("Enquiry deleted");
  };

  // ═══════════════════════════════════════
  //  PRODUCT ORDER ACTIONS
  // ═══════════════════════════════════════

  const confirmProductOrder = async (id: string) => {
    await update(ref(db, `productOrders/${id}`), { status: "confirmed" });
    toast.success("Order confirmed");
  };

  const deleteProductOrder = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    await remove(ref(db, `productOrders/${id}`));
    toast.success("Order deleted");
  };

  // ═══════════════════════════════════════
  //  SERVICE REQUEST ACTIONS
  // ═══════════════════════════════════════

  const markServiceReqCompleted = async (id: string) => {
    await update(ref(db, `serviceRequests/${id}`), { status: "completed" });
    toast.success("Service request marked as completed");
  };

  const markServiceReqAccepted = async (id: string) => {
    await update(ref(db, `serviceRequests/${id}`), { status: "accepted", acceptedBy: adminUser?.email || "admin" });
    toast.success("Service request accepted");
  };

  const deleteServiceReq = async (id: string) => {
    if (!confirm("Delete this service request?")) return;
    await remove(ref(db, `serviceRequests/${id}`));
    toast.success("Service request deleted");
  };

  // ═══════════════════════════════════════
  //  STAFF ACTIONS
  // ═══════════════════════════════════════

  const addStaff = async () => {
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) {
      toast.error("Name, email and password are required");
      return;
    }
    setSaving("staff");
    try {
      const newKey = "staff_" + Date.now();
      await update(ref(db, `staff/${newKey}`), {
        name: newStaffName.trim(),
        email: newStaffEmail.trim(),
        password: newStaffPassword.trim(),
        phone: newStaffPhone.trim(),
        active: true,
        createdAt: Date.now(),
      });
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPassword("");
      setNewStaffPhone("");
      toast.success("✓ Staff member added!");
    } catch (err: unknown) {
      console.error("Add staff error:", err);
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === "PERMISSION_DENIED") {
        toast.error("Permission denied", { description: "Firebase rules need to allow writes. Update database.rules.json in Firebase Console." });
      } else {
        toast.error("Failed to add staff", { description: firebaseError.message || "Unknown error" });
      }
    }
    setSaving(null);
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    await remove(ref(db, `staff/${id}`));
    toast.success("Staff member deleted");
  };

  const toggleStaffActive = async (id: string, currentActive: boolean) => {
    await update(ref(db, `staff/${id}`), { active: !currentActive });
    toast.success(`Staff ${!currentActive ? "activated" : "deactivated"}`);
  };

  // ═══════════════════════════════════════
  //  THEME / SETTINGS ACTIONS
  // ═══════════════════════════════════════

  const applyPresetTheme = (themeId: string) => {
    const t = PRESET_THEMES.find((x) => x.id === themeId);
    if (!t) return;
    setSelectedThemeId(themeId);
    setSiteSettings((prev) => ({ ...prev, themeColor: t.cyan, themeBlue: t.blue, themePurple: t.purple, themeId }));
    toast.success(`Theme "${t.name}" applied! Hit SAVE to confirm.`);
  };

  const saveTheme = async () => {
    setSaving("theme");
    try {
      await update(ref(db, "settings/site"), {
        themeColor: siteSettings.themeColor || "#00f5ff",
        themeBlue: siteSettings.themeBlue || "#0080ff",
        themePurple: siteSettings.themePurple || "#7b2fff",
        themeId: selectedThemeId,
      });
      toast.success("✓ Theme saved! Website updated.");
    } catch (e: unknown) { toast.error("Save failed"); }
    setSaving(null);
  };

  const resetTheme = () => {
    setSiteSettings((prev) => ({ ...prev, themeColor: "#00f5ff", themeBlue: "#0080ff", themePurple: "#7b2fff" }));
    setSelectedThemeId("cyber-blue");
  };

  const saveBgAnim = async () => {
    setSaving("bganim");
    try {
      await update(ref(db, "settings/site"), { bgAnimation: selectedBgAnim });
      toast.success("✓ Background animation saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  const saveSiteMode = async () => {
    setSaving("mode");
    try {
      await update(ref(db, "settings/site"), { siteMode: selectedMode });
      toast.success(`✓ Mode "${selectedMode}" saved!`);
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  // ═══════════════════════════════════════
  //  HERO ACTIONS
  // ═══════════════════════════════════════

  const saveHero = async () => {
    setSaving("hero");
    try {
      await update(ref(db, "settings/site"), {
        storeName: siteSettings.storeName || "",
        heroSubtitle: siteSettings.heroSubtitle || "",
        heroTagline: siteSettings.heroTagline || "",
        heroEyebrow: siteSettings.heroEyebrow || "",
        heroCtaPrimary: siteSettings.heroCtaPrimary || "",
        heroCtaSecondary: siteSettings.heroCtaSecondary || "",
        heroTrustStars: siteSettings.heroTrustStars || "",
        heroTrustReviews: siteSettings.heroTrustReviews || "",
        heroTrustLocation: siteSettings.heroTrustLocation || "",
        heroPills: siteSettings.heroPills || [],
        heroChips: siteSettings.heroChips || [],
        stats: siteSettings.stats || {},
      });
      toast.success("✓ Hero section saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  // ═══════════════════════════════════════
  //  CONTACT ACTIONS
  // ═══════════════════════════════════════

  const saveContact = async () => {
    setSaving("contact");
    try {
      await update(ref(db, "settings/site"), {
        phone: siteSettings.phone || "",
        whatsapp: siteSettings.whatsapp || "",
        email: siteSettings.email || "",
        address: siteSettings.address || "",
        hours: siteSettings.hours || "",
      });
      toast.success("✓ Contact info saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  // ═══════════════════════════════════════
  //  SERVICES ACTIONS
  // ═══════════════════════════════════════

  const updateServiceField = (index: number, key: string, value: string) => {
    setLocalServices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const addService = () => {
    setLocalServices((prev) => [...prev, { icon: "🆕", num: String(prev.length + 1).padStart(2, "0"), title: "New Service", desc: "Describe this service...", order: prev.length }]);
  };

  const deleteService = (index: number) => {
    if (!confirm("Remove this service?")) return;
    setLocalServices((prev) => prev.filter((_, i) => i !== index));
  };

  const saveServices = async () => {
    setSaving("services");
    try {
      const obj: Record<string, unknown> = {};
      localServices.forEach((s, i) => {
        const key = (s.id as string) || ("svc_" + i);
        obj[key] = { ...s, order: i, id: undefined };
      });
      await set(ref(db, "services"), obj);
      toast.success("✓ Services saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  // ═══════════════════════════════════════
  //  PRODUCTS ACTIONS
  // ═══════════════════════════════════════

  const updateProductField = (index: number, key: string, value: string) => {
    setLocalProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const addProduct = () => {
    setLocalProducts((prev) => [...prev, { icon: "🆕", badge: "NEW", name: "New Product", sub: "Product description", image: "", order: prev.length }]);
  };

  const deleteProduct = (index: number) => {
    if (!confirm("Remove this product?")) return;
    setLocalProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (file: File, index: number) => {
    setUploadingIndex(index);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
      fd.append("folder", "race_computer_products");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      updateProductField(index, "image", data.secure_url);
      toast.success("✓ Image uploaded!");
    } catch (e: unknown) {
      toast.error("Upload failed");
    }
    setUploadingIndex(null);
  };

  const saveProducts = async () => {
    setSaving("products");
    try {
      const obj: Record<string, unknown> = {};
      localProducts.forEach((p, i) => {
        const key = (p.id as string) || ("prod_" + i);
        obj[key] = { ...p, order: i, id: undefined };
      });
      await set(ref(db, "products"), obj);
      toast.success("✓ Products saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  // ═══════════════════════════════════════
  //  BRANCHES ACTIONS
  // ═══════════════════════════════════════

  const updateBranchField = (index: number, key: string, value: string | boolean) => {
    setLocalBranches((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const setMainBranch = (index: number, checked: boolean) => {
    setLocalBranches((prev) => prev.map((b, i) => ({ ...b, isMain: i === index && checked })));
  };

  const addBranch = () => {
    setLocalBranches((prev) => [...prev, {
      tag: "BRANCH " + String(prev.length + 1).padStart(2, "0"),
      name: "New Branch", badge: "STORE", isMain: false,
      address: "", phone: "", whatsapp: "", email: "", hours: "", mapUrl: "",
      order: prev.length,
    }]);
  };

  const deleteBranch = (index: number) => {
    if (!confirm("Remove this branch?")) return;
    setLocalBranches((prev) => prev.filter((_, i) => i !== index));
  };

  const saveBranches = async () => {
    setSaving("branches");
    try {
      const obj: Record<string, unknown> = {};
      localBranches.forEach((b, i) => {
        const key = (b.id as string) || ("branch_" + i);
        obj[key] = { ...b, order: i, id: undefined };
      });
      await set(ref(db, "branches"), obj);
      toast.success("✓ Branches saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  // ═══════════════════════════════════════
  //  GALLERY ACTIONS
  // ═══════════════════════════════════════

  const updateGalleryField = (index: number, key: string, value: string) => {
    setLocalGallery((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const addGalleryItem = () => {
    setLocalGallery((prev) => [...prev, { url: "", title: "New Image", category: "Custom Builds", description: "", order: prev.length }]);
  };

  const deleteGalleryItem = (index: number) => {
    if (!confirm("Remove this gallery item?")) return;
    setLocalGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGalleryImageUpload = async (file: File, index: number) => {
    setUploadingGalleryIndex(index);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
      fd.append("folder", "race_computer_gallery");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      updateGalleryField(index, "url", data.secure_url);
      toast.success("✓ Gallery image uploaded!");
    } catch (e: unknown) {
      toast.error("Upload failed");
    }
    setUploadingGalleryIndex(null);
  };

  const saveGallery = async () => {
    setSaving("gallery");
    try {
      const obj: Record<string, unknown> = {};
      localGallery.forEach((g, i) => {
        const key = (g.id as string) || ("gal_" + i);
        obj[key] = { url: g.url, title: g.title, category: g.category, description: g.description, order: i };
      });
      await set(ref(db, "gallery"), obj);
      toast.success("✓ Gallery saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  // ═══════════════════════════════════════
  //  ABOUT SECTION ACTIONS
  // ═══════════════════════════════════════

  const saveAboutSection = async () => {
    setSaving("about");
    try {
      await update(ref(db, "settings/site"), {
        aboutStory: siteSettings.aboutStory || [],
        aboutTimeline: siteSettings.aboutTimeline || [],
      });
      toast.success("✓ About section saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  const addTimelineEntry = () => {
    const currentTimeline: {year: string; title: string; desc: string}[] = Array.isArray(siteSettings.aboutTimeline) ? siteSettings.aboutTimeline : [];
    setSiteSettings((prev) => ({
      ...prev,
      aboutTimeline: [...currentTimeline, { year: String(new Date().getFullYear()), title: "New Milestone", desc: "Description..." }],
    }));
  };

  const removeTimelineEntry = (index: number) => {
    const currentTimeline: {year: string; title: string; desc: string}[] = Array.isArray(siteSettings.aboutTimeline) ? siteSettings.aboutTimeline : [];
    setSiteSettings((prev) => ({
      ...prev,
      aboutTimeline: currentTimeline.filter((_, i) => i !== index),
    }));
  };

  const updateTimelineEntry = (index: number, key: string, value: string) => {
    const currentTimeline: {year: string; title: string; desc: string}[] = Array.isArray(siteSettings.aboutTimeline) ? [...siteSettings.aboutTimeline] : [];
    if (currentTimeline[index]) {
      currentTimeline[index] = { ...currentTimeline[index], [key]: value };
      setSiteSettings((prev) => ({ ...prev, aboutTimeline: currentTimeline }));
    }
  };

  const addStoryParagraph = () => {
    const currentStory: string[] = Array.isArray(siteSettings.aboutStory) ? siteSettings.aboutStory : [];
    setSiteSettings((prev) => ({
      ...prev,
      aboutStory: [...currentStory, "New paragraph text..."],
    }));
  };

  const removeStoryParagraph = (index: number) => {
    const currentStory: string[] = Array.isArray(siteSettings.aboutStory) ? siteSettings.aboutStory : [];
    setSiteSettings((prev) => ({
      ...prev,
      aboutStory: currentStory.filter((_, i) => i !== index),
    }));
  };

  const updateStoryParagraph = (index: number, value: string) => {
    const currentStory: string[] = Array.isArray(siteSettings.aboutStory) ? [...siteSettings.aboutStory] : [];
    currentStory[index] = value;
    setSiteSettings((prev) => ({ ...prev, aboutStory: currentStory }));
  };

  // ═══════════════════════════════════════
  //  TICKER ACTIONS
  // ═══════════════════════════════════════

  const addTickerItem = () => {
    setLocalTickerItems((prev) => [...prev, "NEW ITEM"]);
  };

  const removeTickerItem = (index: number) => {
    setLocalTickerItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTickerItem = (index: number, value: string) => {
    setLocalTickerItems((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const saveTickerItems = async () => {
    setSaving("ticker");
    try {
      await update(ref(db, "settings/site"), { tickerItems: localTickerItems });
      toast.success("✓ Ticker bar saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  // ═══════════════════════════════════════
  //  RENDER HELPERS
  // ═══════════════════════════════════════

  // ═══════════════════════════════════════
  //  PANELS
  // ═══════════════════════════════════════

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Enquiries", value: enquiries.length, icon: "📩" },
          { label: "Product Orders", value: productOrders.length, icon: "📦" },
          { label: "Pending Orders", value: pendingProductOrderCount, icon: "🔔" },
          { label: "Service Requests", value: serviceRequests.length, icon: "🔧" },
          { label: "Pending Requests", value: pendingServiceReqCount, icon: "📋" },
          { label: "Active Staff", value: staffList.filter((s) => s.active).length, icon: "👤" },
          { label: "Staff Live", value: staffLocations.length, icon: "📍" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500" />
            <div className="text-2xl font-bold text-gray-800 leading-none">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1.5 uppercase tracking-wide">{stat.label}</div>
            <div className="absolute top-3 right-3 text-xl opacity-30">{stat.icon}</div>
          </div>
        ))}
      </div>

      <FormSection title="Recent Enquiries">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">{enquiries.length} total enquiries</span>
          {enquiries.length > 5 && (
            <button onClick={() => showPanel("enquiries")} className="text-xs text-red-600 hover:underline font-medium cursor-pointer">View All →</button>
          )}
        </div>
        {enquiries.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No enquiries yet</div>
        ) : (
          <div className="space-y-2.5">
            {enquiries.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 bg-gray-50/80 rounded-lg px-3 py-2.5 border border-gray-100">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{e.name || "-"}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <a href={`tel:${e.phone}`} className="text-red-600 hover:underline">{e.phone || "-"}</a>
                    <span>·</span>
                    <span>{e.category || e.type || "General"}</span>
                    <span>·</span>
                    <span>{formatTime(e.createdAt || e.timestamp)}</span>
                  </div>
                </div>
                <StatusBadge status={e.status || "new"} />
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </>
  );

  const renderEnquiries = () => (
    <>
      {/* Header with count & refresh */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">All Enquiries</span>
          <span className="px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">{enquiries.length}</span>
          {enquiryDebugInfo && <span className="text-[9px] text-gray-400 hidden md:inline">({enquiryDebugInfo})</span>}
        </div>
        <button
          onClick={async () => {
            try {
              const snap = await get(ref(db, "enquiries"));
              const list = rtdbToArray<Enquiry>(snap, "createdAt");
              setEnquiries(list);
              setEnquiryDebugInfo(`Refresh: ${list.length} enquiries`);
              toast.success(`Refreshed: ${list.length} enquiries loaded`);
            } catch (err: unknown) {
              toast.error("Failed to refresh enquiries");
            }
          }}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {enquiries.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-xs text-yellow-700">
          <span className="font-bold">No enquiries loaded.</span> Click "Refresh" to fetch from Firebase. {enquiryDebugInfo && <span className="text-yellow-500">({enquiryDebugInfo})</span>}
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {["all", "new", "pending", "done"].map((f) => (
          <button key={f} onClick={() => setEnquiryFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              enquiryFilter === f ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "new" && newEnquiryCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">{newEnquiryCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Filter</div>
        <div className="flex gap-2 flex-wrap">
          {QUICK_DATE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => { setEnquiryQuickDate(opt.id); setEnquiryDateFrom(""); setEnquiryDateTo(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                enquiryQuickDate === opt.id && !enquiryDateFrom && !enquiryDateTo ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 font-medium">From:</label>
            <input type="date" value={enquiryDateFrom} onChange={(e) => { setEnquiryDateFrom(e.target.value); setEnquiryQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-red-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 font-medium">To:</label>
            <input type="date" value={enquiryDateTo} onChange={(e) => { setEnquiryDateTo(e.target.value); setEnquiryQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-red-400" />
          </div>
          {(enquiryDateFrom || enquiryDateTo || enquiryQuickDate !== "all") && (
            <button onClick={() => { setEnquiryDateFrom(""); setEnquiryDateTo(""); setEnquiryQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-all">Clear</button>
          )}
        </div>
        <div className="text-xs text-gray-500 font-medium">Showing {paginatedEnquiries.length} of {filteredEnquiries.length} filtered ({enquiries.length} total in Firebase)</div>
      </div>

      <FormSection title="">
        {filteredEnquiries.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <p className="text-3xl mb-2">📭</p>
            <p>No {enquiryFilter !== "all" ? enquiryFilter : ""} enquiries found</p>
            <p className="text-[10px] mt-1">{enquiries.length} total enquiries in database</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedEnquiries.map((e, idx) => (
              <div key={e.id} className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-300">#{(enquiryPage - 1) * ENQUIRIES_PER_PAGE + idx + 1}</span>
                      <p className="font-semibold text-gray-800 text-sm truncate">{e.name || "-"}</p>
                    </div>
                    <a href={`tel:${e.phone}`} className="text-xs text-red-600 hover:underline">{e.phone || "-"}</a>
                  </div>
                  <StatusBadge status={e.status || "new"} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-md border border-blue-100">{e.category || e.type || "General"}</span>
                  <span className="px-2 py-0.5 text-[10px] text-gray-400">{formatTime(e.createdAt || e.timestamp)}</span>
                </div>
                {e.message && (
                  <p className="text-xs text-gray-500 leading-relaxed">{e.message.length > 120 ? e.message.slice(0, 120) + "..." : e.message}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => markDone(e.id)} className="px-3 py-1.5 text-xs font-medium border border-green-200 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 cursor-pointer transition-all">✓ Done</button>
                  <button onClick={() => markPending(e.id)} className="px-3 py-1.5 text-xs font-medium border border-orange-200 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 cursor-pointer transition-all">⏳ Pending</button>
                  <button onClick={() => deleteEnquiry(e.id)} className="px-3 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-all">✕ Delete</button>
                </div>
              </div>
            ))}
            
            {/* Pagination Controls */}
            {totalEnquiryPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Page {enquiryPage} of {totalEnquiryPages} ({filteredEnquiries.length} enquiries)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEnquiryPage(1)}
                    disabled={enquiryPage === 1}
                    className="px-2.5 py-1.5 text-xs font-medium border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >First</button>
                  <button
                    onClick={() => setEnquiryPage(p => Math.max(1, p - 1))}
                    disabled={enquiryPage === 1}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >← Prev</button>
                  <span className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg">{enquiryPage}</span>
                  <button
                    onClick={() => setEnquiryPage(p => Math.min(totalEnquiryPages, p + 1))}
                    disabled={enquiryPage === totalEnquiryPages}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >Next →</button>
                  <button
                    onClick={() => setEnquiryPage(totalEnquiryPages)}
                    disabled={enquiryPage === totalEnquiryPages}
                    className="px-2.5 py-1.5 text-xs font-medium border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >Last</button>
                </div>
              </div>
            )}
          </div>
        )}
      </FormSection>
    </>
  );

  const renderProductOrders = () => (
    <>
      {/* Header with count & refresh */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">All Orders</span>
          <span className="px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">{productOrders.length}</span>
        </div>
        <button
          onClick={async () => {
            try {
              const snap = await get(ref(db, "productOrders"));
              const list = rtdbToArray<ProductOrder>(snap, "createdAt");
              setProductOrders(list);
              toast.success(`Refreshed: ${list.length} orders loaded`);
            } catch {
              toast.error("Failed to refresh orders");
            }
          }}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer transition-all flex items-center gap-1.5"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {["all", "pending", "confirmed"].map((f) => (
          <button key={f} onClick={() => setProductOrderFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              productOrderFilter === f ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingProductOrderCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">{pendingProductOrderCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search by Order ID */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search by Order ID, name, phone, product..."
          value={productOrderSearch}
          onChange={(e) => setProductOrderSearch(e.target.value)}
          className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
        />
      </div>

      {/* Date Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Filter</div>
        <div className="flex gap-2 flex-wrap">
          {QUICK_DATE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => { setOrderQuickDate(opt.id); setOrderDateFrom(""); setOrderDateTo(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                orderQuickDate === opt.id && !orderDateFrom && !orderDateTo ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 font-medium">From:</label>
            <input type="date" value={orderDateFrom} onChange={(e) => { setOrderDateFrom(e.target.value); setOrderQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-red-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 font-medium">To:</label>
            <input type="date" value={orderDateTo} onChange={(e) => { setOrderDateTo(e.target.value); setOrderQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-red-400" />
          </div>
          {(orderDateFrom || orderDateTo || orderQuickDate !== "all") && (
            <button onClick={() => { setOrderDateFrom(""); setOrderDateTo(""); setOrderQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-all">Clear</button>
          )}
        </div>
        <div className="text-[10px] text-gray-400">Showing {filteredProductOrders.length} of {productOrders.length} orders</div>
      </div>

      <FormSection title="">
        {filteredProductOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No {productOrderFilter} orders</div>
        ) : (
          <div className="space-y-3">
            {filteredProductOrders.map((o) => {
              const orderId = o.orderId || ("RC-" + o.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase());
              return (
                <div key={o.id} className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 rounded border border-red-200 mb-1">#{orderId}</span>
                      <p className="font-semibold text-gray-800 text-sm">{o.productName || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">{o.productPrice || "-"}</p>
                      <ProductOrderStatusBadge status={o.status || "pending"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-gray-400">Customer:</span> <span className="text-gray-700 font-medium">{o.customerName || "-"}</span></div>
                    <div><span className="text-gray-400">Phone:</span> <a href={`tel:${o.customerPhone}`} className="text-red-600 hover:underline font-medium">{o.customerPhone || "-"}</a></div>
                    <div className="col-span-2"><span className="text-gray-400">Address:</span> <span className="text-gray-600">{o.customerAddress || "-"}</span></div>
                    <div><span className="text-gray-400">Date:</span> <span className="text-gray-500">{formatTime(o.createdAt)}</span></div>
                    {o.customerLat && o.customerLng && (
                      <div><span className="text-gray-400">Location:</span> <a href={`https://www.google.com/maps?q=${o.customerLat},${o.customerLng}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">View on Map</a></div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {o.status !== "confirmed" && (
                      <button onClick={() => confirmProductOrder(o.id)} className="px-3 py-1.5 text-xs font-medium border border-green-200 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 cursor-pointer transition-all">✓ Confirm</button>
                    )}
                    <button onClick={() => {
                      const whatsapp = siteSettings.whatsapp || "919876543210";
                      const msg = `Hi! Order payment details:\n\nOrder ID: ${orderId}\nProduct: ${o.productName}\nPrice: ${o.productPrice}\nCustomer: ${o.customerName}\nPhone: ${o.customerPhone}`;
                      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
                    }} className="px-3 py-1.5 text-xs font-medium border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 cursor-pointer transition-all inline-flex items-center gap-1">📱 WhatsApp Pay</button>
                    <button onClick={() => deleteProductOrder(o.id)} className="px-3 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-all">✕ Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FormSection>
    </>
  );

  const renderServiceRequests = () => (
    <>
      {/* Header with count & refresh */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">All Service Requests</span>
          <span className="px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">{serviceRequests.length}</span>
        </div>
        <button
          onClick={async () => {
            try {
              const snap = await get(ref(db, "serviceRequests"));
              const list = rtdbToArray<ServiceRequest>(snap, "createdAt");
              setServiceRequests(list);
              toast.success(`Refreshed: ${list.length} service requests loaded`);
            } catch {
              toast.error("Failed to refresh service requests");
            }
          }}
          className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer transition-all flex items-center gap-1.5"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {["all", "pending", "accepted", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setServiceReqFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              serviceReqFilter === f
                ? "bg-red-50 border-red-300 text-red-600"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingServiceReqCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">{pendingServiceReqCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Filter</div>
        <div className="flex gap-2 flex-wrap">
          {QUICK_DATE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => { setServiceQuickDate(opt.id); setServiceDateFrom(""); setServiceDateTo(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                serviceQuickDate === opt.id && !serviceDateFrom && !serviceDateTo ? "bg-red-50 border-red-300 text-red-600" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 font-medium">From:</label>
            <input type="date" value={serviceDateFrom} onChange={(e) => { setServiceDateFrom(e.target.value); setServiceQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-red-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 font-medium">To:</label>
            <input type="date" value={serviceDateTo} onChange={(e) => { setServiceDateTo(e.target.value); setServiceQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 outline-none focus:border-red-400" />
          </div>
          {(serviceDateFrom || serviceDateTo || serviceQuickDate !== "all") && (
            <button onClick={() => { setServiceDateFrom(""); setServiceDateTo(""); setServiceQuickDate("all"); }}
              className="px-2.5 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-all">Clear</button>
          )}
        </div>
        <div className="text-[10px] text-gray-400">Showing {filteredServiceReqs.length} of {serviceRequests.length} requests</div>
      </div>

      <FormSection title="">
        {filteredServiceReqs.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No {serviceReqFilter} service requests</div>
        ) : (
          <div className="space-y-3">
            {filteredServiceReqs.map((r) => {
              const reqId = "SR-" + r.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
              return (
                <div key={r.id} className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded border border-blue-200 mb-1">#{reqId}</span>
                      <p className="font-semibold text-gray-800 text-sm">{r.name || "-"}</p>
                    </div>
                    <ServiceReqStatusBadge status={r.status || "pending"} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-gray-400">Phone:</span> <a href={`tel:${r.phone}`} className="text-red-600 hover:underline font-medium">{r.phone || "-"}</a></div>
                    <div><span className="text-gray-400">Service:</span> <span className="text-gray-700 font-medium">{r.serviceType || "-"}</span></div>
                    <div className="col-span-2"><span className="text-gray-400">Address:</span> <span className="text-gray-600">{r.address || "-"}</span></div>
                    {r.problemDescription && (
                      <div className="col-span-2"><span className="text-gray-400">Problem:</span> <span className="text-gray-500">{r.problemDescription.length > 100 ? r.problemDescription.slice(0, 100) + "..." : r.problemDescription}</span></div>
                    )}
                    <div><span className="text-gray-400">Date:</span> <span className="text-gray-500">{formatTime(r.createdAt)}</span></div>
                    {r.acceptedBy && <div><span className="text-gray-400">Accepted by:</span> <span className="text-blue-600 font-medium">{r.acceptedBy}</span></div>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    {r.status !== "completed" && (
                      <button onClick={() => markServiceReqCompleted(r.id)} className="px-3 py-1.5 text-xs font-medium border border-green-200 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 cursor-pointer transition-all">✓ Complete</button>
                    )}
                    {r.status === "pending" && (
                      <button onClick={() => markServiceReqAccepted(r.id)} className="px-3 py-1.5 text-xs font-medium border border-blue-200 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-all">✓ Accept</button>
                    )}
                    <button onClick={() => deleteServiceReq(r.id)} className="px-3 py-1.5 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-all">✕ Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FormSection>
    </>
  );

  const renderStaff = () => {
    // Calculate staff work history
    const staffHistory = staffList.map((s) => {
      const accepted = serviceRequests.filter((r) => r.acceptedBy === s.name || r.acceptedBy === s.email).length;
      const completed = serviceRequests.filter((r) => (r.acceptedBy === s.name || r.acceptedBy === s.email) && r.status === "completed").length;
      const pending = serviceRequests.filter((r) => (r.acceptedBy === s.name || r.acceptedBy === s.email) && r.status === "accepted").length;
      return { ...s, acceptedCount: accepted, completedCount: completed, pendingCount: pending };
    });

    return (
      <>
        <FormSection title="Add New Staff Member">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Name">
              <FormInput value={newStaffName} onChange={setNewStaffName} placeholder="Full name" />
            </FormField>
            <FormField label="Email">
              <FormInput value={newStaffEmail} onChange={setNewStaffEmail} placeholder="email@example.com" type="email" />
            </FormField>
            <FormField label="Password">
              <FormInput value={newStaffPassword} onChange={setNewStaffPassword} placeholder="Password" type="password" />
            </FormField>
            <FormField label="Phone">
              <FormInput value={newStaffPhone} onChange={setNewStaffPhone} placeholder="Phone number" />
            </FormField>
          </div>
          <div className="mt-4">
            <SaveBtn onClick={addStaff} loading={saving === "staff"}>＋ Add Staff Member</SaveBtn>
          </div>
        </FormSection>

        <FormSection title="Staff Members & History">
          {staffHistory.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No staff members yet</div>
          ) : (
            <div className="space-y-3">
              {staffHistory.map((s) => (
                <div key={s.id} className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{s.name || "-"}</p>
                        <button
                          onClick={() => toggleStaffActive(s.id, s.active)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-all ${
                            s.active !== false
                              ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {s.active !== false ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{s.email || "-"}</p>
                    </div>
                    <button onClick={() => deleteStaff(s.id)} className="px-2.5 py-1 text-xs font-medium border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-all">✕</button>
                  </div>
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="text-xs text-red-600 hover:underline">📞 {s.phone}</a>
                  )}
                  {/* Work History Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-blue-600">{s.acceptedCount}</p>
                      <p className="text-[9px] text-blue-500 font-medium uppercase">Total Jobs</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-green-600">{s.completedCount}</p>
                      <p className="text-[9px] text-green-500 font-medium uppercase">Completed</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-yellow-600">{s.pendingCount}</p>
                      <p className="text-[9px] text-yellow-500 font-medium uppercase">Active</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Added: {formatTime(s.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </FormSection>
      </>
    );
  };

  // Extract customer locations from service requests that have lat/lng
  const customerLocations = serviceRequests
    .filter((r) => r.customerLat && r.customerLng && (r.status === "pending" || r.status === "accepted"))
    .map((r) => ({
      id: r.id,
      name: r.name || "Customer",
      phone: r.phone || "",
      address: r.address || "",
      serviceType: r.serviceType || "",
      lat: r.customerLat as number,
      lng: r.customerLng as number,
      createdAt: r.createdAt || Date.now(),
    }));

  const renderLiveTracking = () => (
    <div className="space-y-4">
      <LiveTrackingTab
        staffLocations={staffLocations}
        customerLocations={customerLocations}
        masterVerified={false}
        mapExpanded={mapExpanded}
        setMapExpanded={setMapExpanded}
        getTimeSince={getTimeSince}
      />
    </div>
  );

  const renderAppearance = () => (
    <>
      <FormSection title="Preset Themes — One Click Apply">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-1">
          {PRESET_THEMES.map((t) => (
            <div
              key={t.id}
              onClick={() => applyPresetTheme(t.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all border-2 relative overflow-hidden bg-white ${
                selectedThemeId === t.id ? "border-red-500 shadow-md" : "border-gray-100 hover:border-gray-300"
              }`}
            >
              {selectedThemeId === t.id && (
                <div className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded">✓ ACTIVE</div>
              )}
              <div className="flex gap-1.5 mb-2.5">
                <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: t.cyan }} />
                <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: t.blue }} />
                <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: t.purple }} />
              </div>
              <div className="text-xs font-bold text-gray-800 mb-0.5">{t.name}</div>
              <div className="text-[10px] text-gray-500">{t.desc}</div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="h-1 rounded-full w-4/5" style={{ background: t.cyan, opacity: 0.6 }} />
                <div className="h-1 rounded-full w-3/5" style={{ background: t.blue, opacity: 0.6 }} />
                <div className="h-1 rounded-full w-2/5" style={{ background: t.purple, opacity: 0.6 }} />
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Custom Colors">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Primary Color">
            <input type="color" value={cyan} onChange={(e) => setSiteSettings((p) => ({ ...p, themeColor: e.target.value }))} className="w-full h-10 p-1 cursor-pointer border border-gray-200 rounded-lg" />
            <div className="w-full h-14 rounded-lg mt-2 flex items-center justify-center text-xs font-bold tracking-wider border" style={{ background: `${cyan}11`, borderColor: cyan, color: cyan }}>RACE COMPUTER</div>
          </FormField>
          <FormField label="Secondary Color">
            <input type="color" value={blue} onChange={(e) => setSiteSettings((p) => ({ ...p, themeBlue: e.target.value }))} className="w-full h-10 p-1 cursor-pointer border border-gray-200 rounded-lg" />
            <div className="w-full h-14 rounded-lg mt-2 flex items-center justify-center text-xs font-bold tracking-wider border" style={{ background: `${blue}11`, borderColor: blue, color: blue }}>SERVICES</div>
          </FormField>
          <FormField label="Accent Color">
            <input type="color" value={purple} onChange={(e) => setSiteSettings((p) => ({ ...p, themePurple: e.target.value }))} className="w-full h-10 p-1 cursor-pointer border border-gray-200 rounded-lg" />
            <div className="w-full h-14 rounded-lg mt-2 flex items-center justify-center text-xs font-bold tracking-wider border" style={{ background: `${purple}11`, borderColor: purple, color: purple }}>ACCENT</div>
          </FormField>
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          <SaveBtn onClick={saveTheme} loading={saving === "theme"}>💾 Save Theme</SaveBtn>
          <button onClick={resetTheme} className="px-5 py-2.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer transition-all font-medium">↺ Reset Default</button>
        </div>
      </FormSection>

      <FormSection title="Background Animation">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {BG_ANIMATIONS.map((a) => (
            <div
              key={a.id}
              onClick={() => { setSelectedBgAnim(a.id); toast.success(`Animation "${a.name}" selected. Hit SAVE to apply.`); }}
              className={`rounded-lg cursor-pointer transition-all overflow-hidden border-2 ${
                selectedBgAnim === a.id ? "border-red-500 shadow-md" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {selectedBgAnim === a.id && (
                <div className="absolute top-1 right-1 text-sm font-bold text-red-500 z-10">✓</div>
              )}
              <div className="w-full h-16 flex items-center justify-center overflow-hidden relative bg-gray-50">
                {a.id === "particles" && <svg width="100%" height="64"><circle cx="20" cy="25" r="1.5" fill="#00f5ff" opacity="0.6" /><circle cx="50" cy="15" r="1" fill="#00f5ff" opacity="0.4" /><circle cx="80" cy="40" r="1.2" fill="#0080ff" opacity="0.5" /><circle cx="110" cy="20" r="0.8" fill="#00f5ff" opacity="0.3" /></svg>}
                {a.id === "grid" && <div className="w-full h-16" style={{ background: "linear-gradient(rgba(200,200,220,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(200,200,220,0.3) 1px,transparent 1px)", backgroundSize: "16px 16px" }} />}
                {a.id === "waves" && <svg width="100%" height="64"><path d="M0 40 Q25 25 50 40 T100 40 T150 40" stroke="#0080ff" strokeWidth="1.5" fill="none" opacity="0.4" /></svg>}
                {a.id === "matrix" && <div className="text-gray-400 text-[8px] p-2 leading-tight font-mono opacity-60">01 10 11<br />10 01 00<br />11 00 10</div>}
                {a.id === "nebula" && <div className="w-full h-16" style={{ background: "radial-gradient(ellipse at 30% 40%,rgba(123,47,255,0.15),transparent 60%),radial-gradient(ellipse at 70% 60%,rgba(0,128,255,0.1),transparent 55%)" }} />}
                {a.id === "hexagon" && <svg width="100%" height="64"><polygon points="40,12 55,12 62,24 55,36 40,36 33,24" fill="none" stroke="#999" strokeWidth="0.8" opacity="0.3" /></svg>}
                {a.id === "aurora" && <div className="w-full h-16" style={{ background: "linear-gradient(135deg,rgba(0,255,136,0.1),rgba(0,128,255,0.08),rgba(123,47,255,0.1))" }} />}
                {a.id === "starfield" && <svg width="100%" height="64"><circle cx="15" cy="10" r="0.7" fill="#666" opacity="0.5" /><circle cx="50" cy="30" r="1.5" fill="#666" opacity="0.8" /><circle cx="90" cy="15" r="0.7" fill="#666" opacity="0.3" /><circle cx="120" cy="50" r="1" fill="#666" opacity="0.6" /></svg>}
                {a.id === "circuit" && <svg width="100%" height="64"><line x1="10" y1="20" x2="50" y2="20" stroke="#999" strokeWidth="0.8" opacity="0.3" /><line x1="50" y1="20" x2="50" y2="45" stroke="#999" strokeWidth="0.8" opacity="0.3" /><circle cx="50" cy="45" r="2" fill="#999" opacity="0.4" /></svg>}
                {a.id === "none" && <div className="flex items-center justify-center h-16 text-gray-400 text-xs">No Animation</div>}
              </div>
              <div className="px-2.5 py-2 text-center bg-white">
                <div className="text-xs font-semibold text-gray-700">{a.name}</div>
                <div className="text-[10px] text-gray-400">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <SaveBtn onClick={saveBgAnim} loading={saving === "bganim"}>💾 Save Animation</SaveBtn>
        </div>
        <p className="mt-3 text-xs text-gray-400">⚠ Background animation change applies to website visitors immediately after saving.</p>
      </FormSection>

      <FormSection title="Dark / Light Mode">
        <div className="flex gap-4 flex-wrap">
          {(["dark", "light"] as const).map((mode) => (
            <div
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`w-40 rounded-lg cursor-pointer transition-all border-2 p-3 ${
                selectedMode === mode ? "border-red-500 shadow-md" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="w-full h-16 rounded-md mb-2.5 p-2.5 flex flex-col justify-center" style={{ background: mode === "dark" ? "#1a1a2e" : "#f8f9fa" }}>
                <div className="w-2/5 h-1.5 rounded-sm mb-1.5" style={{ background: mode === "dark" ? "#00f5ff" : "#0066ff" }} />
                <div className="w-3/5 h-1 rounded-sm mb-1" style={{ background: mode === "dark" ? "rgba(0,245,255,0.3)" : "rgba(0,100,255,0.2)" }} />
                <div className="w-1/2 h-1 rounded-sm" style={{ background: mode === "dark" ? "rgba(0,245,255,0.2)" : "rgba(0,100,255,0.15)" }} />
              </div>
              <div className="text-xs font-bold text-gray-700">
                {mode === "dark" ? "🌑 Dark Mode" : "☀️ Light Mode"}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {mode === "dark" ? "Dark theme for website" : "Light background theme"}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <SaveBtn onClick={saveSiteMode} loading={saving === "mode"}>💾 Save Mode</SaveBtn>
        </div>
      </FormSection>
    </>
  );

  const renderHero = () => (
    <>
      <FormSection title="Hero Section Content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Store Name">
            <FormInput value={siteSettings.storeName || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, storeName: v }))} placeholder="RACE COMPUTER" />
          </FormField>
          <FormField label="Eyebrow Text">
            <FormInput value={siteSettings.heroEyebrow || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, heroEyebrow: v }))} placeholder="Sanganer, Jaipur · Est. 2001" />
          </FormField>
          <FormField label="Subtitle Line">
            <FormInput value={siteSettings.heroSubtitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, heroSubtitle: v }))} placeholder="NEXT-GEN TECH HUB · JAIPUR" />
          </FormField>
          <FormField label="Primary CTA Button">
            <FormInput value={siteSettings.heroCtaPrimary || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, heroCtaPrimary: v }))} placeholder="Book Home Service" />
          </FormField>
          <FormField label="Secondary CTA Button">
            <FormInput value={siteSettings.heroCtaSecondary || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, heroCtaSecondary: v }))} placeholder="Explore Products" />
          </FormField>
          <FormField label="Hero Tagline" full>
            <FormTextarea value={siteSettings.heroTagline || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, heroTagline: v }))} placeholder="Jaipur's most trusted tech destination..." />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Trust Line (below CTA buttons)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Stars Display">
            <FormInput value={siteSettings.heroTrustStars || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, heroTrustStars: v }))} placeholder="★★★★☆" />
          </FormField>
          <FormField label="Reviews Text">
            <FormInput value={siteSettings.heroTrustReviews || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, heroTrustReviews: v }))} placeholder="213+ Google Reviews" />
          </FormField>
          <FormField label="Location Text">
            <FormInput value={siteSettings.heroTrustLocation || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, heroTrustLocation: v }))} placeholder="Sanganer Bazar, Jaipur" />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Stats Numbers">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <FormField label="Years (pill)">
            <FormInput value={siteSettings.stats?.years || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, years: v } }))} placeholder="Since 2001" />
          </FormField>
          <FormField label="Rating (pill)">
            <FormInput value={siteSettings.stats?.rating || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, rating: v } }))} placeholder="4★ Rating" />
          </FormField>
          <FormField label="Reviews (pill)">
            <FormInput value={siteSettings.stats?.reviews || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, reviews: v } }))} placeholder="213+" />
          </FormField>
          <FormField label="Customers (pill)">
            <FormInput value={siteSettings.stats?.customers || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, customers: v } }))} placeholder="9000+ Customers" />
          </FormField>
          <FormField label="Branches">
            <FormInput value={siteSettings.stats?.branches || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, branches: v } }))} placeholder="2+" />
          </FormField>
          <FormField label="Num Years (desktop)">
            <FormInput value={siteSettings.stats?.numYears || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, numYears: v } }))} placeholder="25+" />
          </FormField>
          <FormField label="Num Reviews (desktop)">
            <FormInput value={siteSettings.stats?.numReviews || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, numReviews: v } }))} placeholder="213+" />
          </FormField>
          <FormField label="Num Rating (desktop)">
            <FormInput value={siteSettings.stats?.numRating || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, numRating: v } }))} placeholder="4★" />
          </FormField>
          <FormField label="Num Customers (desktop)">
            <FormInput value={siteSettings.stats?.numCustomers || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, stats: { ...p.stats, numCustomers: v } }))} placeholder="9K+" />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Hero Pills (badges under tagline)">
        <p className="text-xs text-gray-400 mb-3">These appear as small badge pills below the hero tagline.</p>
        <div className="flex flex-col gap-2">
          {(Array.isArray(siteSettings.heroPills) ? siteSettings.heroPills : []).map((pill: any, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 min-w-[20px]">{i + 1}.</span>
              <FormInput value={pill.label || ""} onChange={(v) => {
                const pills = [...(Array.isArray(siteSettings.heroPills) ? siteSettings.heroPills : [])];
                pills[i] = { ...pills[i], label: v };
                setSiteSettings((p) => ({ ...p, heroPills: pills }));
              }} placeholder="Pill label" />
              <FormInput value={pill.dotColor || "primary"} onChange={(v) => {
                const pills = [...(Array.isArray(siteSettings.heroPills) ? siteSettings.heroPills : [])];
                pills[i] = { ...pills[i], dotColor: v };
                setSiteSettings((p) => ({ ...p, heroPills: pills }));
              }} placeholder="primary/yellow/green/accent/secondary" />
              <button onClick={() => {
                const pills = (Array.isArray(siteSettings.heroPills) ? siteSettings.heroPills : []).filter((_, j) => j !== i);
                setSiteSettings((p) => ({ ...p, heroPills: pills }));
              }} className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs rounded-md hover:bg-red-100 cursor-pointer font-medium">✕</button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <AddBtn onClick={() => {
            const pills = Array.isArray(siteSettings.heroPills) ? siteSettings.heroPills : [];
            setSiteSettings((p) => ({ ...p, heroPills: [...pills, { label: "New Pill", dotColor: "primary" }] }));
          }}>+ Add Hero Pill</AddBtn>
        </div>
      </FormSection>

      <FormSection title="Hero Floating Chips (desktop right side)">
        <p className="text-xs text-gray-400 mb-3">These appear as floating info chips around the 3D object on desktop.</p>
        <div className="flex flex-col gap-2">
          {(Array.isArray(siteSettings.heroChips) ? siteSettings.heroChips : []).map((chip: any, i: number) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 min-w-[20px]">{i + 1}.</span>
              <FormInput value={chip.text || ""} onChange={(v) => {
                const chips = [...(Array.isArray(siteSettings.heroChips) ? siteSettings.heroChips : [])];
                chips[i] = { ...chips[i], text: v };
                setSiteSettings((p) => ({ ...p, heroChips: chips }));
              }} placeholder="Chip text" />
              <FormInput value={chip.icon || "Award"} onChange={(v) => {
                const chips = [...(Array.isArray(siteSettings.heroChips) ? siteSettings.heroChips : [])];
                chips[i] = { ...chips[i], icon: v };
                setSiteSettings((p) => ({ ...p, heroChips: chips }));
              }} placeholder="Award/Wrench/Building2/Headphones" />
              <FormInput value={chip.color || "primary"} onChange={(v) => {
                const chips = [...(Array.isArray(siteSettings.heroChips) ? siteSettings.heroChips : [])];
                chips[i] = { ...chips[i], color: v };
                setSiteSettings((p) => ({ ...p, heroChips: chips }));
              }} placeholder="primary/accent/green/secondary" />
              <button onClick={() => {
                const chips = (Array.isArray(siteSettings.heroChips) ? siteSettings.heroChips : []).filter((_, j) => j !== i);
                setSiteSettings((p) => ({ ...p, heroChips: chips }));
              }} className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs rounded-md hover:bg-red-100 cursor-pointer font-medium">✕</button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <AddBtn onClick={() => {
            const chips = Array.isArray(siteSettings.heroChips) ? siteSettings.heroChips : [];
            setSiteSettings((p) => ({ ...p, heroChips: [...chips, { icon: "Award", text: "NEW CHIP", color: "primary" }] }));
          }}>+ Add Hero Chip</AddBtn>
        </div>
      </FormSection>

      <div className="mt-4">
        <SaveBtn onClick={saveHero} loading={saving === "hero"}>💾 Save Hero Section</SaveBtn>
      </div>
    </>
  );

  const renderContactInfo = () => (
    <FormSection title="Contact Details">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Phone Number">
          <FormInput value={siteSettings.phone || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, phone: v }))} placeholder="+91 XXXXX XXXXX" />
        </FormField>
        <FormField label="WhatsApp Number (with country code)">
          <FormInput value={siteSettings.whatsapp || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, whatsapp: v }))} placeholder="919876543210" />
        </FormField>
        <FormField label="Email Address" full>
          <FormInput value={siteSettings.email || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, email: v }))} placeholder="info@racecomputer.in" />
        </FormField>
        <FormField label="Full Address" full>
          <FormTextarea value={siteSettings.address || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, address: v }))} placeholder="Shop address..." />
        </FormField>
        <FormField label="Business Hours" full>
          <FormTextarea value={siteSettings.hours || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, hours: v }))} placeholder="Mon – Sat: 10AM – 8PM&#10;Sunday: Closed" rows={2} />
        </FormField>
      </div>
      <div className="mt-4">
        <SaveBtn onClick={saveContact} loading={saving === "contact"}>💾 Save Contact Info</SaveBtn>
      </div>
    </FormSection>
  );

  const renderServices = () => (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Manage Service Cards</div>
        <AddBtn onClick={addService}>＋ Add Service</AddBtn>
      </div>
      {localServices.map((s, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-3 relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 rounded-l-xl" />
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-gray-700">{s.icon || "📦"} Service {String(i + 1).padStart(2, "0")}</div>
            <DelBtn onClick={() => deleteService(i)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Icon (Emoji)">
              <FormInput value={s.icon} onChange={(v) => updateServiceField(i, "icon", v)} />
            </FormField>
            <FormField label="Number Label">
              <FormInput value={s.num} onChange={(v) => updateServiceField(i, "num", v)} placeholder="01" />
            </FormField>
            <FormField label="Service Title" full>
              <FormInput value={s.title} onChange={(v) => updateServiceField(i, "title", v)} placeholder="Service name" />
            </FormField>
            <FormField label="Description" full>
              <FormTextarea value={s.desc} onChange={(v) => updateServiceField(i, "desc", v)} rows={2} />
            </FormField>
          </div>
        </div>
      ))}
      <div className="mt-4">
        <SaveBtn onClick={saveServices} loading={saving === "services"}>💾 Save All Services</SaveBtn>
      </div>
    </>
  );

  const renderProducts = () => (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Manage Product Carousel</div>
        <AddBtn onClick={addProduct}>＋ Add Product</AddBtn>
      </div>
      {localProducts.map((p, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-3 relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 rounded-l-xl" />
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-gray-700">{p.icon || "📦"} {p.name || "Product " + i}</div>
            <DelBtn onClick={() => deleteProduct(i)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Icon (Emoji)">
              <FormInput value={p.icon} onChange={(v) => updateProductField(i, "icon", v)} />
            </FormField>
            <FormField label="Badge Label">
              <FormInput value={p.badge} onChange={(v) => updateProductField(i, "badge", v)} placeholder="ASUS" />
            </FormField>
            <FormField label="Product Name">
              <FormInput value={p.name} onChange={(v) => updateProductField(i, "name", v)} />
            </FormField>
            <FormField label="Subtitle / Series">
              <FormInput value={p.sub} onChange={(v) => updateProductField(i, "sub", v)} />
            </FormField>
            <FormField label="Product Image (Cloudinary)" full>
              <div className="mt-1">
                <div className="w-full h-28 border border-gray-200 bg-gray-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                  {p.image ? <img src={p.image} alt="product" className="w-full h-full object-cover" /> : <span className="text-2xl opacity-30">🖼️</span>}
                </div>
                <label className={`w-full py-2 bg-red-50 border border-dashed border-red-300 text-red-600 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${uploadingIndex === i ? "opacity-60 pointer-events-none" : "hover:bg-red-100"}`}>
                  📤 {uploadingIndex === i ? "Uploading..." : "Upload Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, i); }} />
                </label>
              </div>
            </FormField>
          </div>
        </div>
      ))}
      <div className="mt-4">
        <SaveBtn onClick={saveProducts} loading={saving === "products"}>💾 Save All Products</SaveBtn>
      </div>
    </>
  );

  const renderBranches = () => (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Manage Store Branches · Set Main Branch</div>
        <AddBtn onClick={addBranch}>＋ Add Branch</AddBtn>
      </div>
      {localBranches.map((b, i) => (
        <div key={i} className={`bg-white border rounded-xl shadow-sm p-5 mb-3 relative ${b.isMain ? "border-red-300" : "border-gray-200"}`}>
          <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl ${b.isMain ? "bg-red-500" : "bg-gray-300"}`} />
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-gray-700">
              🏪 {b.tag || "BRANCH " + String(i + 1).padStart(2, "0")}
              {b.isMain && <span className="ml-2 text-xs text-red-500 font-bold">★ Main Branch</span>}
            </div>
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer font-medium">
                <input type="checkbox" checked={b.isMain} onChange={(e) => setMainBranch(i, e.target.checked)} className="accent-red-500 w-3.5 h-3.5" />
                Main
              </label>
              <DelBtn onClick={() => deleteBranch(i)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Branch Tag">
              <FormInput value={b.tag} onChange={(v) => updateBranchField(i, "tag", v)} placeholder="BRANCH 01" />
            </FormField>
            <FormField label="Display Name">
              <FormInput value={b.name} onChange={(v) => updateBranchField(i, "name", v)} placeholder="Sanganer Store" />
            </FormField>
            <FormField label="Badge Label">
              <FormInput value={b.badge} onChange={(v) => updateBranchField(i, "badge", v)} placeholder="RETAIL STORE" />
            </FormField>
            <FormField label="Phone">
              <FormInput value={b.phone} onChange={(v) => updateBranchField(i, "phone", v)} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label="WhatsApp Number">
              <FormInput value={b.whatsapp} onChange={(v) => updateBranchField(i, "whatsapp", v)} placeholder="919876543210" />
            </FormField>
            <FormField label="Email">
              <FormInput value={b.email} onChange={(v) => updateBranchField(i, "email", v)} placeholder="store@racecomputer.in" />
            </FormField>
            <FormField label="Address" full>
              <FormTextarea value={b.address} onChange={(v) => updateBranchField(i, "address", v)} rows={2} />
            </FormField>
            <FormField label="Working Hours">
              <FormInput value={b.hours} onChange={(v) => updateBranchField(i, "hours", v)} placeholder="Mon – Sat: 10:00 AM – 8:00 PM" />
            </FormField>
            <FormField label="Google Maps URL">
              <FormInput value={b.mapUrl} onChange={(v) => updateBranchField(i, "mapUrl", v)} placeholder="https://maps.google.com/?q=..." />
            </FormField>
          </div>
        </div>
      ))}
      <div className="mt-4">
        <SaveBtn onClick={saveBranches} loading={saving === "branches"}>💾 Save All Branches</SaveBtn>
      </div>
    </>
  );

  const renderGallery = () => (
    <>
      <AddBtn onClick={addGalleryItem}>+ Add Gallery Item</AddBtn>
      <div className="flex flex-col gap-4 mt-4">
        {localGallery.map((item, i) => (
          <FormSection key={i} title={`Image ${i + 1}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Title">
                <FormInput value={item.title} onChange={(v) => updateGalleryField(i, "title", v)} placeholder="Image title" />
              </FormField>
              <FormField label="Category">
                <FormInput value={item.category} onChange={(v) => updateGalleryField(i, "category", v)} placeholder="e.g. Custom Builds" />
              </FormField>
              <FormField label="Description" full>
                <FormInput value={item.description} onChange={(v) => updateGalleryField(i, "description", v)} placeholder="Short description" />
              </FormField>
              <FormField label="Image">
                <div className="flex gap-2 items-center">
                  <label className={`px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-red-100 ${uploadingGalleryIndex === i ? "opacity-60 pointer-events-none" : ""}`}>
                    {uploadingGalleryIndex === i ? "Uploading..." : "📁 Upload"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryImageUpload(f, i); }} />
                  </label>
                  {item.url && <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>}
                </div>
                {item.url && (
                  <div className="mt-2 w-full max-h-28 overflow-hidden rounded-lg border border-gray-200">
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
              </FormField>
            </div>
            <div className="mt-2.5">
              <DelBtn onClick={() => deleteGalleryItem(i)} />
            </div>
          </FormSection>
        ))}
      </div>
      <div className="mt-4">
        <SaveBtn onClick={saveGallery} loading={saving === "gallery"}>💾 Save All Gallery</SaveBtn>
      </div>
    </>
  );

  const renderAboutSection = () => {
    const storyParagraphs: string[] = Array.isArray(siteSettings.aboutStory) ? siteSettings.aboutStory : [];
    const timelineEntries: {year: string; title: string; desc: string}[] = Array.isArray(siteSettings.aboutTimeline) ? siteSettings.aboutTimeline : [];

    return (
      <>
        <FormSection title="Our Story — Paragraphs">
          <p className="text-xs text-gray-400 mb-3">
            Edit the paragraphs shown in the About section. Supports HTML tags like &lt;strong class=&quot;text-red-600&quot;&gt; for colored text.
          </p>
          {storyParagraphs.length > 0 ? storyParagraphs.map((para, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-gray-500 font-medium">Paragraph {i + 1}</label>
                <DelBtn onClick={() => removeStoryParagraph(i)} />
              </div>
              <FormTextarea value={para} onChange={(v) => updateStoryParagraph(i, v)} placeholder="Write paragraph content..." rows={3} />
            </div>
          )) : (
            <p className="text-center py-5 text-gray-400 text-sm">No custom story — defaults will be used</p>
          )}
          <AddBtn onClick={addStoryParagraph}>+ Add Paragraph</AddBtn>
        </FormSection>

        <FormSection title="Our Journey — Timeline">
          {timelineEntries.length > 0 ? timelineEntries.map((entry, i) => (
            <div key={i} className="mb-3 p-3 border border-gray-100 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-500 font-medium">Milestone {i + 1}</label>
                <DelBtn onClick={() => removeTimelineEntry(i)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Year">
                  <FormInput value={entry.year} onChange={(v) => updateTimelineEntry(i, "year", v)} placeholder="2025" />
                </FormField>
                <FormField label="Title">
                  <FormInput value={entry.title} onChange={(v) => updateTimelineEntry(i, "title", v)} placeholder="Milestone title" />
                </FormField>
                <FormField label="Description">
                  <FormInput value={entry.desc} onChange={(v) => updateTimelineEntry(i, "desc", v)} placeholder="Short description" />
                </FormField>
              </div>
            </div>
          )) : (
            <p className="text-center py-5 text-gray-400 text-sm">No custom timeline — defaults will be used</p>
          )}
          <AddBtn onClick={addTimelineEntry}>+ Add Milestone</AddBtn>
        </FormSection>

        <div className="mt-4">
          <SaveBtn onClick={saveAboutSection} loading={saving === "about"}>💾 Save About Section</SaveBtn>
        </div>
      </>
    );
  };

  const renderTicker = () => (
    <>
      <FormSection title="Ticker Bar Items">
        <p className="text-xs text-gray-400 mb-3">
          These items scroll across the top of the website. Edit, add, or remove items below.
        </p>
        <div className="flex flex-col gap-2">
          {localTickerItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 min-w-[20px]">{i + 1}.</span>
              <FormInput value={item} onChange={(v) => updateTickerItem(i, v)} placeholder="Ticker item text" />
              <button onClick={() => removeTickerItem(i)} className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs rounded-md hover:bg-red-100 cursor-pointer transition-all font-medium">✕</button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <AddBtn onClick={addTickerItem}>+ Add Ticker Item</AddBtn>
        </div>
      </FormSection>

      <FormSection title="Live Preview">
        <div className="overflow-hidden py-2 bg-gray-100 rounded-lg">
          <div className="flex gap-4 overflow-x-auto whitespace-nowrap px-3">
            {localTickerItems.map((item, i) => (
              <span key={i} className="text-xs text-gray-600 inline-flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </FormSection>

      <div className="mt-4">
        <SaveBtn onClick={saveTickerItems} loading={saving === "ticker"}>💾 Save Ticker Bar</SaveBtn>
      </div>
    </>
  );

  // ═══════════════════════════════════════
  //  SECTION HEADERS ACTIONS & RENDER
  // ═══════════════════════════════════════

  const saveSectionHeaders = async () => {
    setSaving("headers");
    try {
      await update(ref(db, "settings/site"), {
        servicesHeader: siteSettings.servicesHeader || "",
        servicesTitle: siteSettings.servicesTitle || "",
        servicesSubtitle: siteSettings.servicesSubtitle || "",
        productsHeader: siteSettings.productsHeader || "",
        productsTitle: siteSettings.productsTitle || "",
        productsSubtitle: siteSettings.productsSubtitle || "",
        productCategories: siteSettings.productCategories || [],
        galleryHeader: siteSettings.galleryHeader || "",
        galleryTitle: siteSettings.galleryTitle || "",
        gallerySubtitle: siteSettings.gallerySubtitle || "",
        aboutHeader: siteSettings.aboutHeader || "",
        aboutTitle: siteSettings.aboutTitle || "",
        aboutSubtitle: siteSettings.aboutSubtitle || "",
        contactHeader: siteSettings.contactHeader || "",
        contactTitle: siteSettings.contactTitle || "",
        contactSubtitle: siteSettings.contactSubtitle || "",
      });
      toast.success("✓ Section headers saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  const renderSectionHeaders = () => (
    <>
      <FormSection title="Services Section">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Header Badge">
            <FormInput value={siteSettings.servicesHeader || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, servicesHeader: v }))} placeholder="// What We Offer" />
          </FormField>
          <FormField label="Title">
            <FormInput value={siteSettings.servicesTitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, servicesTitle: v }))} placeholder="Our Services" />
          </FormField>
          <FormField label="Subtitle" full>
            <FormInput value={siteSettings.servicesSubtitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, servicesSubtitle: v }))} placeholder="Complete tech service hub..." />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Products Section">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Header Badge">
            <FormInput value={siteSettings.productsHeader || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, productsHeader: v }))} placeholder="// Product Lineup" />
          </FormField>
          <FormField label="Title">
            <FormInput value={siteSettings.productsTitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, productsTitle: v }))} placeholder="Our Products" />
          </FormField>
          <FormField label="Subtitle" full>
            <FormInput value={siteSettings.productsSubtitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, productsSubtitle: v }))} placeholder="Top brands available..." />
          </FormField>
        </div>
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Categories (comma separated)</label>
          <FormInput value={Array.isArray(siteSettings.productCategories) ? siteSettings.productCategories.join(", ") : ""} onChange={(v) => setSiteSettings((p) => ({ ...p, productCategories: v.split(",").map((s: string) => s.trim()).filter(Boolean) }))} placeholder="All, Accessories, Components, Repair Parts, Laptops" />
        </div>
      </FormSection>

      <FormSection title="Gallery Section">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Header Badge">
            <FormInput value={siteSettings.galleryHeader || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, galleryHeader: v }))} placeholder="// Our Work" />
          </FormField>
          <FormField label="Title">
            <FormInput value={siteSettings.galleryTitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, galleryTitle: v }))} placeholder="Gallery" />
          </FormField>
          <FormField label="Subtitle" full>
            <FormInput value={siteSettings.gallerySubtitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, gallerySubtitle: v }))} placeholder="A glimpse into our workspace..." />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="About Section">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Header Badge">
            <FormInput value={siteSettings.aboutHeader || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, aboutHeader: v }))} placeholder="// Who We Are" />
          </FormField>
          <FormField label="Title">
            <FormInput value={siteSettings.aboutTitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, aboutTitle: v }))} placeholder="About RACE COMPUTER" />
          </FormField>
          <FormField label="Subtitle" full>
            <FormInput value={siteSettings.aboutSubtitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, aboutSubtitle: v }))} placeholder="Since 2001..." />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Contact Section">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Header Badge">
            <FormInput value={siteSettings.contactHeader || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, contactHeader: v }))} placeholder="// Send Enquiry" />
          </FormField>
          <FormField label="Title">
            <FormInput value={siteSettings.contactTitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, contactTitle: v }))} placeholder="Get In Touch" />
          </FormField>
          <FormField label="Subtitle" full>
            <FormInput value={siteSettings.contactSubtitle || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, contactSubtitle: v }))} placeholder="Have a query?..." />
          </FormField>
        </div>
      </FormSection>

      <div className="mt-4">
        <SaveBtn onClick={saveSectionHeaders} loading={saving === "headers"}>💾 Save All Section Headers</SaveBtn>
      </div>
    </>
  );

  // ═══════════════════════════════════════
  //  FOOTER SETTINGS RENDER
  // ═══════════════════════════════════════

  const saveFooterSettings = async () => {
    setSaving("footer");
    try {
      await update(ref(db, "settings/site"), {
        asusPartnerText: siteSettings.asusPartnerText || "",
        footerLinks: siteSettings.footerLinks || [],
      });
      toast.success("✓ Footer settings saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  const renderFooter = () => (
    <>
      <FormSection title="Footer Settings">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Partner Text">
            <FormInput value={siteSettings.asusPartnerText || ""} onChange={(v) => setSiteSettings((p) => ({ ...p, asusPartnerText: v }))} placeholder="AUTHORIZED ASUS PARTNER" />
          </FormField>
          <FormField label="Footer Links (comma separated)">
            <FormInput value={Array.isArray(siteSettings.footerLinks) ? siteSettings.footerLinks.join(", ") : ""} onChange={(v) => setSiteSettings((p) => ({ ...p, footerLinks: v.split(",").map((s: string) => s.trim()).filter(Boolean) }))} placeholder="Home, Services, Products, Gallery, About, Contact" />
          </FormField>
        </div>
      </FormSection>
      <div className="mt-4">
        <SaveBtn onClick={saveFooterSettings} loading={saving === "footer"}>💾 Save Footer Settings</SaveBtn>
      </div>
    </>
  );

  // ═══════════════════════════════════════
  //  FORM OPTIONS (Service Types & Enquiry Categories)
  // ═══════════════════════════════════════

  const [localServiceTypes, setLocalServiceTypes] = useState<string[]>([]);
  const [localEnquiryCategories, setLocalEnquiryCategories] = useState<string[]>([]);

  useEffect(() => {
    if (Array.isArray(siteSettings.serviceTypes)) setLocalServiceTypes(siteSettings.serviceTypes);
    if (Array.isArray(siteSettings.enquiryCategories)) setLocalEnquiryCategories(siteSettings.enquiryCategories);
  }, [siteSettings.serviceTypes, siteSettings.enquiryCategories]);

  const saveFormOptions = async () => {
    setSaving("formoptions");
    try {
      await update(ref(db, "settings/site"), {
        serviceTypes: localServiceTypes,
        enquiryCategories: localEnquiryCategories,
      });
      toast.success("✓ Form options saved!");
    } catch { toast.error("Save failed"); }
    setSaving(null);
  };

  const renderFormOptions = () => (
    <>
      <FormSection title="Service Types (for Booking Forms)">
        <p className="text-xs text-gray-400 mb-3">These appear in the "Book Home Service" dropdown. Edit, add, or remove.</p>
        <div className="flex flex-col gap-2">
          {localServiceTypes.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 min-w-[20px]">{i + 1}.</span>
              <FormInput value={item} onChange={(v) => setLocalServiceTypes((p) => { const u = [...p]; u[i] = v; return u; })} placeholder="Service type" />
              <button onClick={() => setLocalServiceTypes((p) => p.filter((_, j) => j !== i))} className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs rounded-md hover:bg-red-100 cursor-pointer transition-all font-medium">✕</button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <AddBtn onClick={() => setLocalServiceTypes((p) => [...p, "New Service Type"])}>+ Add Service Type</AddBtn>
        </div>
      </FormSection>

      <FormSection title="Enquiry Categories (for Contact/Enquiry Forms)">
        <p className="text-xs text-gray-400 mb-3">These appear in the enquiry form category dropdown. Edit, add, or remove.</p>
        <div className="flex flex-col gap-2">
          {localEnquiryCategories.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 min-w-[20px]">{i + 1}.</span>
              <FormInput value={item} onChange={(v) => setLocalEnquiryCategories((p) => { const u = [...p]; u[i] = v; return u; })} placeholder="Category name" />
              <button onClick={() => setLocalEnquiryCategories((p) => p.filter((_, j) => j !== i))} className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs rounded-md hover:bg-red-100 cursor-pointer transition-all font-medium">✕</button>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <AddBtn onClick={() => setLocalEnquiryCategories((p) => [...p, "New Category"])}>+ Add Category</AddBtn>
        </div>
      </FormSection>

      <div className="mt-4">
        <SaveBtn onClick={saveFormOptions} loading={saving === "formoptions"}>💾 Save Form Options</SaveBtn>
      </div>
    </>
  );

  const renderSettingsContent = () => {
    switch (settingsTab) {
      case "appearance": return renderAppearance();
      case "hero": return renderHero();
      case "section-headers": return renderSectionHeaders();
      case "contact-info": return renderContactInfo();
      case "services": return renderServices();
      case "products": return renderProducts();
      case "branches": return renderBranches();
      case "gallery": return renderGallery();
      case "about-section": return renderAboutSection();
      case "ticker": return renderTicker();
      case "footer": return renderFooter();
      case "form-options": return renderFormOptions();
      default: return renderAppearance();
    }
  };

  const renderSettings = () => (
    <div>
      {/* Sub-navigation tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              settingsTab === tab.id
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      {renderSettingsContent()}
    </div>
  );

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard": return renderDashboard();
      case "enquiries": return renderEnquiries();
      case "productOrders": return renderProductOrders();
      case "serviceRequests": return renderServiceRequests();
      case "staff": return isMasterAdmin ? renderStaff() : renderDashboard();
      case "liveTracking": return renderLiveTracking();
      case "settings": return isMasterAdmin ? renderSettings() : renderDashboard();
      default: return renderDashboard();
    }
  };

  const panelTitles: Record<string, [string, string]> = {
    dashboard: ["Dashboard", "Overview & Quick Stats"],
    enquiries: ["Enquiries", "All Customer Enquiries"],
    productOrders: ["Product Orders", "All Product Orders"],
    serviceRequests: ["Service Requests", "All Service Requests"],
    staff: ["Staff Management", "Add & Manage Staff Members"],
    liveTracking: ["Live Tracking", "Track Staff Location in Real-Time"],
    settings: ["Settings", "Manage Website Content & Appearance"],
  };

  const [panelTitle, panelSubtitle] = panelTitles[activePanel] || ["Admin", ""];

  // ═══════════════════════════════════════
  //  MOBILE BOTTOM NAV
  // ═══════════════════════════════════════

  const mobileNavItems = [
    { id: "dashboard", icon: "📊", label: "Home", masterOnly: false },
    { id: "enquiries", icon: "📩", label: "Enquiries", masterOnly: false },
    { id: "productOrders", icon: "📦", label: "Orders", masterOnly: false },
    { id: "serviceRequests", icon: "🔧", label: "Requests", masterOnly: false },
    { id: "liveTracking", icon: "📍", label: "Live", masterOnly: false },
    { id: "staff", icon: "👤", label: "Staff", masterOnly: true },
    { id: "settings", icon: "⚙️", label: "Settings", masterOnly: true },
  ].filter((item) => !item.masterOnly || isMasterAdmin);

  // ═══════════════════════════════════════
  //  MAIN RENDER
  // ═══════════════════════════════════════

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "#faf5f5" }}>
      {/* ── SIDEBAR (desktop) ── */}
      {!isMobile && (
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 h-screen sticky top-0">
          <div className="p-5 border-b border-gray-100">
            <div className="text-lg font-bold text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>RACE COMPUTER</div>
            <div className="text-xs text-gray-400 mt-0.5">Admin Panel</div>
          </div>
          <nav className="flex-1 py-3">
            {[
              { id: "dashboard", icon: "📊", label: "Dashboard", masterOnly: false },
              { id: "enquiries", icon: "📩", label: "Enquiries", masterOnly: false },
              { id: "productOrders", icon: "📦", label: "Product Orders", masterOnly: false },
              { id: "serviceRequests", icon: "🔧", label: "Service Requests", masterOnly: false },
              { id: "liveTracking", icon: "📍", label: "Live Tracking", masterOnly: false },
              { id: "staff", icon: "👤", label: "Staff", masterOnly: true },
              { id: "settings", icon: "⚙️", label: "Settings", masterOnly: true },
            ].filter((item) => !item.masterOnly || isMasterAdmin).map((item) => (
              <button
                key={item.id}
                onClick={() => showPanel(item.id)}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-all cursor-pointer ${
                  activePanel === item.id
                    ? "bg-red-50 text-red-600 border-l-3 border-red-500 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 border-l-3 border-transparent"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {item.id === "liveTracking" && staffLocations.length > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-emerald-500 text-white rounded-full animate-pulse">{staffLocations.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            {adminUser && (
              <div className="flex items-center gap-2 mb-3">
                {adminUser.photoURL ? (
                  <img src={adminUser.photoURL} alt="" className="w-7 h-7 rounded-full border-2 border-gray-200" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-red-50 text-red-600">{adminUser.email?.charAt(0).toUpperCase()}</div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs text-gray-700 truncate block">{adminUser.email}</span>
                  {isMasterAdmin && <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Master Admin</span>}
                </div>
              </div>
            )}
            <button
              onClick={adminLogout}
              className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all cursor-pointer font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </aside>
      )}

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white shadow-xl flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <div className="text-base font-bold text-gray-800">RACE COMPUTER</div>
                <div className="text-xs text-gray-400">Admin Panel</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>
            <nav className="flex-1 py-2">
              {[
                { id: "dashboard", icon: "📊", label: "Dashboard", masterOnly: false },
                { id: "enquiries", icon: "📩", label: "Enquiries", masterOnly: false },
                { id: "productOrders", icon: "📦", label: "Product Orders", masterOnly: false },
                { id: "serviceRequests", icon: "🔧", label: "Service Requests", masterOnly: false },
                { id: "liveTracking", icon: "📍", label: "Live Tracking", masterOnly: false },
                { id: "staff", icon: "👤", label: "Staff", masterOnly: true },
                { id: "settings", icon: "⚙️", label: "Settings", masterOnly: true },
              ].filter((item) => !item.masterOnly || isMasterAdmin).map((item) => (
                <button
                  key={item.id}
                  onClick={() => showPanel(item.id)}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-all cursor-pointer ${
                    activePanel === item.id
                      ? "bg-red-50 text-red-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.icon}</span> {item.label}
                  {item.id === "liveTracking" && staffLocations.length > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-emerald-500 text-white rounded-full animate-pulse">{staffLocations.length}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={adminLogout}
                className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all cursor-pointer font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            )}
            <div>
              <h1 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                {panelTitle}
                {isMasterAdmin && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-purple-100 text-purple-700 rounded border border-purple-200 uppercase tracking-wider">Master</span>}
              </h1>
              <p className="text-xs text-gray-400">{panelSubtitle}</p>
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5"
          >
            View Website <ExternalLink className="w-3 h-3" />
          </a>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ paddingBottom: isMobile ? "72px" : undefined }}>
          {renderPanel()}
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40 overflow-x-auto" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {mobileNavItems.map((item) => {
            const badgeCount = item.id === "enquiries" ? newEnquiryCount : item.id === "productOrders" ? pendingProductOrderCount : item.id === "serviceRequests" ? pendingServiceReqCount : 0;
            return (
              <button
                key={item.id}
                onClick={() => showPanel(item.id)}
                className={`flex-1 min-w-[52px] py-2.5 flex flex-col items-center gap-0.5 text-[10px] cursor-pointer transition-all relative ${
                  activePanel === item.id
                    ? "text-red-600 font-semibold"
                    : "text-gray-400"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
                {badgeCount > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">{badgeCount > 9 ? "9+" : badgeCount}</span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
