"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ref, push, set, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
  MessageCircle,
  Send,
  X,
  CheckCircle,
  User,
  Phone,
  Wrench,
  Home,
  MapPin,
  ChevronUp,
} from "lucide-react";

// Default fallbacks for dynamic Firebase values
const DEFAULT_SERVICE_TYPES = [
  "Laptop Repair",
  "Desktop Repair",
  "Software Issue",
  "Hardware Upgrade",
  "Home Installation",
];

const DEFAULT_ENQUIRY_CATEGORIES = [
  "Desktop & Laptops",
  "Printers & Peripherals",
  "Networking Solutions",
  "AMC & Support",
  "Custom PC Build",
  "Software & OS",
  "General Enquiry",
];

// Default WhatsApp number (fallback)
const DEFAULT_WHATSAPP_NUMBER = "91XXXXXXXXXX";

export default function FloatingButtons() {
  const { setBookingModalOpen } = useAppStore();
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [serviceTypes, setServiceTypes] = useState<string[]>(DEFAULT_SERVICE_TYPES);
  const [enquiryCategories, setEnquiryCategories] = useState<string[]>(DEFAULT_ENQUIRY_CATEGORIES);

  // Firebase listener for dynamic WhatsApp number, serviceTypes, enquiryCategories
  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        if (data.whatsapp) {
          // Clean the number - remove spaces, +, dashes
          const clean = String(data.whatsapp).replace(/[\s+\-()]/g, "");
          setWhatsappNumber(clean);
        }
        if (Array.isArray(data.serviceTypes)) {
          setServiceTypes(data.serviceTypes);
        }
        if (Array.isArray(data.enquiryCategories)) {
          setEnquiryCategories(data.enquiryCategories);
        }
      }
    });
    return () => { unsub(); };
  }, []);

  // Show/hide expanded buttons on mobile
  const [expanded, setExpanded] = useState(false);

  // WhatsApp button
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  // Enquiry modal
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    phone: "",
    category: "",
    message: "",
  });

  // Book Service modal (local)
  const [bookOpen, setBookOpen] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookSubmitted, setBookSubmitted] = useState(false);
  const [bookForm, setBookForm] = useState({
    name: "",
    phone: "",
    address: "",
    serviceType: "",
    problemDescription: "",
  });

  // Refs for portal containers inside modals
  const bookModalRef = useRef<HTMLDivElement>(null);
  const enquiryModalRef = useRef<HTMLDivElement>(null);

  // Helper: validate phone (exactly 10 digits)
  const isValidPhone = (phone: string) => phone.replace(/\D/g, '').length === 10;
  // Helper: validate name (at least 2 chars, letters and spaces only)
  const isValidName = (name: string) => name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());

  // Send Enquiry to Firebase
  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.name || !enquiryForm.phone || !enquiryForm.category) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!isValidName(enquiryForm.name)) {
      toast.error("Invalid name", { description: "Name must be at least 2 characters (letters only)." });
      return;
    }
    if (!isValidPhone(enquiryForm.phone)) {
      toast.error("Invalid phone number", { description: "Please enter exactly 10 digit phone number." });
      return;
    }
    setEnquiryLoading(true);
    try {
      const enquiryRef = push(ref(db, "enquiries"));
      const enquiryData = {
        name: enquiryForm.name.trim(),
        phone: enquiryForm.phone.replace(/\D/g, ''),
        category: enquiryForm.category,
        message: enquiryForm.message.trim(),
        source: "website_enquiry",
        status: "new",
        createdAt: Date.now(),
      };
      console.log("[FloatingButtons] Pushing enquiry with auto-generated key:", enquiryRef.key, enquiryData);
      await set(enquiryRef, enquiryData);
      console.log("[FloatingButtons] Enquiry pushed successfully, key:", enquiryRef.key);
      setEnquirySubmitted(true);
      setEnquiryForm({ name: "", phone: "", category: "", message: "" });
      toast.success("Enquiry Sent!", { description: "We will get back to you soon." });
    } catch (err) {
      console.error("[FloatingButtons] Failed to push enquiry:", err);
      toast.error("Failed to send");
    }
    setEnquiryLoading(false);
  };

  // Book Service submit
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.name || !bookForm.phone || !bookForm.address || !bookForm.serviceType) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!isValidName(bookForm.name)) {
      toast.error("Invalid name", { description: "Name must be at least 2 characters (letters only)." });
      return;
    }
    if (!isValidPhone(bookForm.phone)) {
      toast.error("Invalid phone number", { description: "Please enter exactly 10 digit phone number." });
      return;
    }
    if (bookForm.address.trim().length < 10) {
      toast.error("Invalid address", { description: "Please enter a complete address with landmark (min 10 characters)." });
      return;
    }
    setBookLoading(true);

    // Try to capture customer's live location
    let customerLat: number | null = null;
    let customerLng: number | null = null;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        });
      });
      customerLat = position.coords.latitude;
      customerLng = position.coords.longitude;
    } catch (geoErr) {
      console.warn("Could not get customer location:", geoErr);
    }

    try {
      const requestData: Record<string, unknown> = {
        name: bookForm.name.trim(),
        phone: bookForm.phone.replace(/\D/g, ''),
        address: bookForm.address.trim(),
        serviceType: bookForm.serviceType,
        problemDescription: bookForm.problemDescription.trim(),
        status: "pending",
        acceptedBy: null,
        acceptedAt: null,
        createdAt: Date.now(),
        completedAt: null,
      };
      if (customerLat !== null && customerLng !== null) {
        requestData.customerLat = customerLat;
        requestData.customerLng = customerLng;
        requestData.customerLocationTime = Date.now();
      }
      await push(ref(db, "serviceRequests"), requestData);
      setBookSubmitted(true);
      setBookForm({ name: "", phone: "", address: "", serviceType: "", problemDescription: "" });
      toast.success("Service request submitted!", { description: customerLat ? "Your location has been shared with our team." : "Our team will contact you shortly." });
    } catch {
      toast.error("Failed to submit", { description: "Please try again or call us." });
    }
    setBookLoading(false);
  };

  // WhatsApp chat redirect
  const openWhatsApp = (prefill?: string) => {
    const msg = prefill || "Hi! I have an enquiry about Race Computer services.";
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
    setWhatsappOpen(false);
    setExpanded(false);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════ */}
      {/* FLOATING BUTTONS — Bottom Right (Mobile Friendly) */}
      {/* ═══════════════════════════════════════════ */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 sm:gap-3 items-end">

        {/* Expanded Action Buttons (hidden by default, shown on tap) */}
        {expanded && (
          <>
            {/* Book Service Quick Button */}
            <button
              onClick={() => { setBookOpen(true); setBookSubmitted(false); setExpanded(false); }}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-red-500 text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 rounded-full pl-3 pr-4 py-2.5 sm:pl-4 sm:pr-5 sm:py-3"
            >
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-xs sm:text-sm font-semibold">Book Service</span>
            </button>

            {/* Send Enquiry Quick Button */}
            <button
              onClick={() => { setEnquiryOpen(true); setEnquirySubmitted(false); setExpanded(false); }}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 rounded-full pl-3 pr-4 py-2.5 sm:pl-4 sm:pr-5 sm:py-3"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold">Send Enquiry</span>
            </button>
          </>
        )}

        {/* Main FAB Button — toggles expanded on mobile, always shows WhatsApp on desktop */}
        <div className="relative flex flex-col gap-2 sm:gap-3 items-end">
          {/* WhatsApp Floating Button — always visible */}
          <button
            onClick={() => setWhatsappOpen(!whatsappOpen)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-xl shadow-green-500/30 hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center relative"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
          </button>

          {/* Toggle Button for Book Service + Enquiry */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center relative ${
              expanded
                ? "bg-gray-700 text-white"
                : "bg-gradient-to-r from-blue-600 to-red-500 text-white"
            }`}
          >
            {expanded ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
            {!expanded && (
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-red-500 animate-ping opacity-15" />
            )}
          </button>

          {/* WhatsApp Quick Options Popup */}
          {whatsappOpen && (
            <div className="absolute bottom-28 sm:bottom-36 right-0 w-56 sm:w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-green-100/50 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Chat on WhatsApp</span>
                  <button onClick={() => setWhatsappOpen(false)} className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[10px] text-green-100 mt-0.5">Quick responses, direct connect</p>
              </div>
              <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                <button
                  onClick={() => openWhatsApp("Hi! I want to know about your products.")}
                  className="w-full text-left p-2 sm:p-2.5 rounded-lg bg-green-50/80 hover:bg-green-100/80 transition-colors text-xs sm:text-sm text-gray-700 flex items-center gap-2"
                >
                  <span className="text-green-500">🛒</span> Product Enquiry
                </button>
                <button
                  onClick={() => openWhatsApp("Hi! I need home service for my device.")}
                  className="w-full text-left p-2 sm:p-2.5 rounded-lg bg-blue-50/80 hover:bg-blue-100/80 transition-colors text-xs sm:text-sm text-gray-700 flex items-center gap-2"
                >
                  <span className="text-blue-500">🔧</span> Book Home Service
                </button>
                <button
                  onClick={() => openWhatsApp("Hi! I have a general enquiry.")}
                  className="w-full text-left p-2 sm:p-2.5 rounded-lg bg-purple-50/80 hover:bg-purple-100/80 transition-colors text-xs sm:text-sm text-gray-700 flex items-center gap-2"
                >
                  <span className="text-purple-500">💬</span> General Chat
                </button>
                <button
                  onClick={() => openWhatsApp("Hi! I need help with my order payment.")}
                  className="w-full text-left p-2 sm:p-2.5 rounded-lg bg-amber-50/80 hover:bg-amber-100/80 transition-colors text-xs sm:text-sm text-gray-700 flex items-center gap-2"
                >
                  <span className="text-amber-500">💳</span> Payment Support
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* BOOK SERVICE MODAL (Mobile Optimized) */}
      {/* ═══════════════════════════════════════════ */}
      {bookOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBookOpen(false)} />
          <div ref={bookModalRef} className="relative bg-white/95 backdrop-blur-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-white/30">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 p-3 sm:p-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-600 to-red-500 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Book Home Service</h3>
                  <p className="text-[9px] sm:text-[10px] text-gray-400">We come to your location!</p>
                </div>
              </div>
              <button onClick={() => setBookOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Body */}
            <div className="p-4 sm:p-5">
              {bookSubmitted ? (
                <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Request Submitted!</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Our team will contact you shortly.</p>
                  <div className="flex gap-2 sm:gap-3 justify-center mt-3 sm:mt-4">
                    <Button onClick={() => setBookOpen(false)} className="bg-gradient-to-r from-blue-600 to-red-500 text-white text-sm">
                      Done
                    </Button>
                    <Button
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50 gap-1 sm:gap-2 text-sm"
                      onClick={() => openWhatsApp("Hi! I just booked a home service from the website.")}
                    >
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Follow on</span> WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookSubmit} className="space-y-3 sm:space-y-4">
                  {/* Info cards */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50/60 backdrop-blur-md rounded-lg p-2 sm:p-2.5 border border-blue-100/50">
                      <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                      <span className="text-[9px] sm:text-[10px] text-blue-700 font-medium">We Come to You</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-green-50/60 backdrop-blur-md rounded-lg p-2 sm:p-2.5 border border-green-100/50">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                      <span className="text-[9px] sm:text-[10px] text-green-700 font-medium">Quick Response</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> Name *</Label>
                      <Input
                        placeholder="Your name (letters only)"
                        value={bookForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(val)) {
                            setBookForm({ ...bookForm, name: val });
                          }
                        }}
                        required
                        maxLength={50}
                        className="h-10 sm:h-9 bg-white/60 backdrop-blur-md border-gray-200/50 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Phone * <span className="text-[9px] text-gray-400 font-normal">(10 digits)</span></Label>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={bookForm.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) {
                            setBookForm({ ...bookForm, phone: val });
                          }
                        }}
                        required
                        maxLength={10}
                        className={`h-10 sm:h-9 bg-white/60 backdrop-blur-md text-sm ${bookForm.phone && bookForm.phone.length === 10 ? 'border-green-300 focus:border-green-400' : bookForm.phone && bookForm.phone.length > 0 ? 'border-red-300 focus:border-red-400' : 'border-gray-200/50'}`}
                      />
                      {bookForm.phone && bookForm.phone.length > 0 && bookForm.phone.length < 10 && (
                        <p className="text-[9px] text-red-400">{10 - bookForm.phone.length} more digit{10 - bookForm.phone.length > 1 ? 's' : ''} needed</p>
                      )}
                      {bookForm.phone && bookForm.phone.length === 10 && (
                        <p className="text-[9px] text-green-500">Valid phone number</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Full Address * <span className="text-red-400 text-[9px]">(MANDATORY)</span></Label>
                    <Textarea
                      placeholder="Complete address with landmark, city, pin code"
                      value={bookForm.address}
                      onChange={(e) => setBookForm({ ...bookForm, address: e.target.value })}
                      required
                      rows={2}
                      minLength={10}
                      className="bg-white/60 backdrop-blur-md border-gray-200/50 text-sm"
                    />
                    {bookForm.address && bookForm.address.trim().length > 0 && bookForm.address.trim().length < 10 && (
                      <p className="text-[9px] text-red-400">Address too short - please enter complete address (min 10 characters)</p>
                    )}
                  </div>

                  {/* Live Location Notice */}
                  <div className="flex items-center gap-2 bg-blue-50/60 backdrop-blur-md rounded-lg p-2.5 border border-blue-100/50">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-[10px] text-blue-600 font-medium">Your live location will be shared with our team for faster service</span>
                  </div>

                  {/* Service Type - Fixed with better mobile support */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Service Type *</Label>
                    <Select value={bookForm.serviceType} onValueChange={(val) => setBookForm({ ...bookForm, serviceType: val })}>
                      <SelectTrigger className="w-full h-11 sm:h-9 bg-white/60 backdrop-blur-md border-gray-200/50 text-sm">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[70]" container={bookModalRef.current}>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type} value={type} className="text-sm py-2.5 sm:py-1.5">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Problem Description</Label>
                    <Textarea
                      placeholder="Describe your problem..."
                      value={bookForm.problemDescription}
                      onChange={(e) => setBookForm({ ...bookForm, problemDescription: e.target.value })}
                      rows={2}
                      className="bg-white/60 backdrop-blur-md border-gray-200/50 text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white h-12 sm:h-11 text-sm font-semibold shadow-lg"
                    disabled={bookLoading}
                  >
                    {bookLoading ? "Submitting..." : "Book Home Service Now"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SEND ENQUIRY MODAL (Mobile Optimized) */}
      {/* ═══════════════════════════════════════════ */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEnquiryOpen(false)} />

          {/* Modal */}
          <div ref={enquiryModalRef} className="relative bg-white/95 backdrop-blur-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-white/30">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 p-3 sm:p-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Send Enquiry</h3>
                  <p className="text-[9px] sm:text-[10px] text-gray-400">We&apos;ll get back to you soon!</p>
                </div>
              </div>
              <button onClick={() => setEnquiryOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5">
              {enquirySubmitted ? (
                <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Enquiry Sent!</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Our team will contact you shortly.</p>
                  <div className="flex gap-2 sm:gap-3 justify-center mt-3 sm:mt-4">
                    <Button onClick={() => setEnquiryOpen(false)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                      Done
                    </Button>
                    <Button
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50 gap-1 sm:gap-2 text-sm"
                      onClick={() => openWhatsApp("Hi! I just sent an enquiry from the website.")}
                    >
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Follow on</span> WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-3 sm:space-y-4">
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> Name *</Label>
                      <Input
                        placeholder="Your name (letters only)"
                        value={enquiryForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(val)) {
                            setEnquiryForm({ ...enquiryForm, name: val });
                          }
                        }}
                        required
                        maxLength={50}
                        className="h-10 sm:h-9 bg-white/60 backdrop-blur-md border-gray-200/50 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Phone * <span className="text-[9px] text-gray-400 font-normal">(10 digits)</span></Label>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={enquiryForm.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) {
                            setEnquiryForm({ ...enquiryForm, phone: val });
                          }
                        }}
                        required
                        maxLength={10}
                        className={`h-10 sm:h-9 bg-white/60 backdrop-blur-md text-sm ${enquiryForm.phone && enquiryForm.phone.length === 10 ? 'border-green-300 focus:border-green-400' : enquiryForm.phone && enquiryForm.phone.length > 0 ? 'border-red-300 focus:border-red-400' : 'border-gray-200/50'}`}
                      />
                      {enquiryForm.phone && enquiryForm.phone.length > 0 && enquiryForm.phone.length < 10 && (
                        <p className="text-[9px] text-red-400">{10 - enquiryForm.phone.length} more digit{10 - enquiryForm.phone.length > 1 ? 's' : ''} needed</p>
                      )}
                      {enquiryForm.phone && enquiryForm.phone.length === 10 && (
                        <p className="text-[9px] text-green-500">Valid phone number</p>
                      )}
                    </div>
                  </div>

                  {/* Category Dropdown — Fixed with container prop for modal context */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Category *</Label>
                    <Select
                      value={enquiryForm.category}
                      onValueChange={(val) => setEnquiryForm({ ...enquiryForm, category: val })}
                    >
                      <SelectTrigger className="w-full h-11 sm:h-9 bg-white/60 backdrop-blur-md border-gray-200/50 text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[70]" container={enquiryModalRef.current}>
                        {enquiryCategories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-sm py-2.5 sm:py-1.5">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] text-gray-400 mt-1">
                      For repair/service, use <button type="button" onClick={() => { setEnquiryOpen(false); setTimeout(() => setBookOpen(true), 200); }} className="text-blue-500 hover:underline font-medium">Book Service</button> button instead.
                    </p>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Message</Label>
                    <Textarea
                      placeholder="Describe your requirement..."
                      value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                      rows={3}
                      className="bg-white/60 backdrop-blur-md border-gray-200/50 text-sm"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 sm:h-11 text-sm font-semibold shadow-lg"
                    disabled={enquiryLoading}
                  >
                    {enquiryLoading ? "Sending..." : "Send Enquiry"}
                  </Button>

                  {/* Or WhatsApp */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 backdrop-blur-md px-2 text-gray-400">or</span></div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50 gap-2 h-12 sm:h-11 text-sm"
                    onClick={() => {
                      const msg = `Hi! Enquiry from ${enquiryForm.name || 'a customer'} — Category: ${enquiryForm.category || 'Not selected'} — Message: ${enquiryForm.message || 'No message'}`;
                      openWhatsApp(msg);
                    }}
                  >
                    <MessageCircle className="w-4 h-4" /> Chat on WhatsApp Instead
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
