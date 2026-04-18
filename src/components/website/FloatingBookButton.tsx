"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ref, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Wrench, X, Home, CheckCircle, User, Phone, MapPin } from "lucide-react";

const SERVICE_TYPES = [
  "Laptop Repair",
  "Desktop Repair",
  "Software Issue",
  "Hardware Upgrade",
  "Home Installation",
];

export default function FloatingBookButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    serviceType: "",
    problemDescription: "",
  });
  const modalRef = useRef<HTMLDivElement>(null);

  // Helpers
  const isValidPhone = (phone: string) => phone.replace(/\D/g, '').length === 10;
  const isValidName = (name: string) => name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.serviceType) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!isValidName(form.name)) {
      toast.error("Invalid name", { description: "Name must be at least 2 characters (letters only)." });
      return;
    }
    if (!isValidPhone(form.phone)) {
      toast.error("Invalid phone number", { description: "Please enter exactly 10 digit phone number." });
      return;
    }
    if (form.address.trim().length < 10) {
      toast.error("Invalid address", { description: "Please enter a complete address with landmark (min 10 characters)." });
      return;
    }
    setLoading(true);

    // Capture customer live location
    let customerLat: number | null = null;
    let customerLng: number | null = null;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error("No geo")); return; }
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      });
      customerLat = position.coords.latitude;
      customerLng = position.coords.longitude;
    } catch (e) { console.warn("No location:", e); }

    try {
      const requestData: Record<string, unknown> = {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        address: form.address.trim(),
        serviceType: form.serviceType,
        problemDescription: form.problemDescription.trim(),
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
      setSubmitted(true);
      setForm({ name: "", phone: "", address: "", serviceType: "", problemDescription: "" });
      toast.success("Service request submitted!", { description: customerLat ? "Your location has been shared with our team." : "Our team will contact you shortly." });
    } catch {
      toast.error("Failed to submit", { description: "Please try again or call us." });
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => { setOpen(true); setSubmitted(false); }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-blue-600 to-red-500 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      >
        <Wrench className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-red-500 animate-ping opacity-20" />
      </button>

      {/* Booking Modal — Bottom sheet on mobile */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div ref={modalRef} className="relative bg-white/95 backdrop-blur-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-white/30">
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
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5">
              {submitted ? (
                <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Request Submitted!</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Our team will contact you shortly.</p>
                  <Button onClick={() => setOpen(false)} className="bg-gradient-to-r from-blue-600 to-red-500 text-white text-sm">
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                        value={form.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(val)) setForm({ ...form, name: val });
                        }}
                        required
                        maxLength={50}
                        className="h-11 sm:h-9 bg-white/60 backdrop-blur-md border-gray-200/50 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Phone * <span className="text-[9px] text-gray-400 font-normal">(10 digits)</span></Label>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={form.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setForm({ ...form, phone: val });
                        }}
                        required
                        maxLength={10}
                        className={`h-11 sm:h-9 bg-white/60 backdrop-blur-md text-sm ${form.phone && form.phone.length === 10 ? 'border-green-300 focus:border-green-400' : form.phone && form.phone.length > 0 ? 'border-red-300 focus:border-red-400' : 'border-gray-200/50'}`}
                      />
                      {form.phone && form.phone.length > 0 && form.phone.length < 10 && (
                        <p className="text-[9px] text-red-400">{10 - form.phone.length} more digit{10 - form.phone.length > 1 ? 's' : ''} needed</p>
                      )}
                      {form.phone && form.phone.length === 10 && (
                        <p className="text-[9px] text-green-500">Valid phone number</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Full Address * <span className="text-red-400 text-[9px]">(MANDATORY)</span></Label>
                    <Textarea
                      placeholder="Complete address with landmark, city, pin code"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      required
                      rows={2}
                      minLength={10}
                      className="bg-white/60 backdrop-blur-md border-gray-200/50 text-sm"
                    />
                    {form.address && form.address.trim().length > 0 && form.address.trim().length < 10 && (
                      <p className="text-[9px] text-red-400">Address too short - please enter complete address (min 10 characters)</p>
                    )}
                  </div>

                  {/* Live Location Notice */}
                  <div className="flex items-center gap-2 bg-blue-50/60 backdrop-blur-md rounded-lg p-2.5 border border-blue-100/50">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-[10px] text-blue-600 font-medium">Your live location will be shared with our team for faster service</span>
                  </div>

                  {/* Service Type - Fixed with container prop */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Service Type *</Label>
                    <Select value={form.serviceType} onValueChange={(val) => setForm({ ...form, serviceType: val })}>
                      <SelectTrigger className="w-full h-11 sm:h-9 bg-white/60 backdrop-blur-md border-gray-200/50 text-sm">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[70]" container={modalRef.current}>
                        {SERVICE_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="text-sm py-2.5 sm:py-1.5">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Problem Description</Label>
                    <Textarea
                      placeholder="Describe your problem..."
                      value={form.problemDescription}
                      onChange={(e) => setForm({ ...form, problemDescription: e.target.value })}
                      rows={2}
                      className="bg-white/60 backdrop-blur-md border-gray-200/50 text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white h-12 sm:h-11 text-sm font-semibold shadow-lg"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Book Home Service Now"}
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
