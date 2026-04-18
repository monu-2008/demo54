"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ref, push, set, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Clock, Phone, Mail, Send, CheckCircle, Navigation } from "lucide-react";

// Fallback defaults
const DEFAULT_PHONE = "+91 XXXXX XXXXX";
const DEFAULT_EMAIL = "racecomputer16000@gmail.com";
const DEFAULT_HOURS = "Mon – Sat: 10:00 AM – 8:00 PM\nSunday: Closed";
const DEFAULT_ADDRESS = "Race Computer Sanganer Jaipur";
const DEFAULT_MAP_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3561.073!2d75.8035382!3d26.8108296!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396dc98d0fb7d66f%3A0x6c20f5cebf1e71da!2sRace%20Computer!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin";
const DEFAULT_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=Race+Computer+Sanganer+Jaipur";

// Default enquiry categories (fallback when Firebase has no data)
const DEFAULT_ENQUIRY_CATEGORIES = [
  "Desktop & Laptops",
  "Printers & Peripherals",
  "Networking Solutions",
  "AMC & Support",
  "Custom PC Build",
  "Software & OS",
  "General Enquiry",
];

interface SiteSettings {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  hours?: string;
  mapUrl?: string;
  contactHeader?: string;
  contactTitle?: string;
  contactSubtitle?: string;
  enquiryCategories?: string[];
}

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    category: "",
    message: "",
  });
  const formRef = useRef<HTMLDivElement>(null);

  // Firebase listener for settings/site
  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.val());
    });
    return () => { unsub(); };
  }, []);

  // Derived contact values with fallbacks
  const phone = siteSettings.phone || DEFAULT_PHONE;
  const email = siteSettings.email || DEFAULT_EMAIL;
  const hours = siteSettings.hours || DEFAULT_HOURS;
  const address = siteSettings.address || DEFAULT_ADDRESS;

  // Derived enquiry categories with fallback
  const enquiryCategories: string[] =
    Array.isArray(siteSettings.enquiryCategories) && siteSettings.enquiryCategories.length > 0
      ? siteSettings.enquiryCategories
      : DEFAULT_ENQUIRY_CATEGORIES;

  // Build directions URL from dynamic address
  const directionsUrl = address && address !== DEFAULT_ADDRESS
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : DEFAULT_DIRECTIONS_URL;

  // Build map embed URL from dynamic address or use custom mapUrl from admin
  const mapEmbedUrl = siteSettings.mapUrl || (() => {
    if (address && address !== DEFAULT_ADDRESS) {
      return `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(address)}`;
    }
    return DEFAULT_MAP_URL;
  })();

  // Build dynamic contact cards
  const contactCards = [
    {
      icon: Clock,
      title: "Business Hours",
      text: hours,
      href: null as string | null,
      gradient: "from-blue-500 to-blue-700",
      bgLight: "bg-blue-50",
      borderLight: "border-blue-200",
    },
    {
      icon: Phone,
      title: "Phone",
      text: phone,
      href: phone !== DEFAULT_PHONE ? `tel:${phone.replace(/\s/g, "")}` : "tel:+91XXXXXXXXXX",
      gradient: "from-green-500 to-emerald-600",
      bgLight: "bg-green-50",
      borderLight: "border-green-200",
    },
    {
      icon: Mail,
      title: "Email",
      text: email,
      href: `mailto:${email}`,
      gradient: "from-red-500 to-rose-600",
      bgLight: "bg-red-50",
      borderLight: "border-red-200",
    },
  ];

  // Helper: validate phone number (exactly 10 digits)
  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  // Helper: validate name (at least 2 chars, letters and spaces only)
  const isValidName = (name: string) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.category) {
      toast.error("Please fill all required fields");
      return;
    }
    // Validate name
    if (!isValidName(form.name)) {
      toast.error("Invalid name", { description: "Name must be at least 2 characters (letters only)." });
      return;
    }
    // Validate phone
    if (!isValidPhone(form.phone)) {
      toast.error("Invalid phone number", { description: "Please enter exactly 10 digit phone number." });
      return;
    }
    setLoading(true);
    try {
      const enquiryRef = push(ref(db, "enquiries"));
      const enquiryData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        category: form.category,
        message: form.message.trim(),
        source: "contact_form",
        status: "new",
        createdAt: Date.now(),
      };
      console.log("[Contact] Pushing enquiry with auto-generated key:", enquiryRef.key, enquiryData);
      await set(enquiryRef, enquiryData);
      console.log("[Contact] Enquiry pushed successfully, key:", enquiryRef.key);
      setSubmitted(true);
      setForm({ name: "", phone: "", category: "", message: "" });
      toast.success("Enquiry Sent!", { description: "We will contact you soon." });
    } catch (err) {
      console.error("[Contact] Failed to push enquiry:", err);
      toast.error("Failed to send enquiry");
    }
    setLoading(false);
  };

  return (
    <section id="contact" className="py-12 sm:py-20 bg-gradient-to-b from-white to-blue-50/30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 sm:px-4 py-2 mb-4">
            <Send className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-600 tracking-wider uppercase">{siteSettings.contactHeader || "// Send Enquiry"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-3">{siteSettings.contactTitle || "Get In Touch"}</h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm sm:text-base">{siteSettings.contactSubtitle || "Have a query? Send an enquiry, call us, or visit our store."}</p>
          <div className="w-14 h-1 bg-gradient-to-r from-blue-600 to-red-500 rounded-full mx-auto mt-4" />
        </div>

        <div className="grid lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Enquiry form — takes 3 cols */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl shadow-blue-100/50 h-full">
              <CardContent className="p-4 sm:p-6">
                {submitted ? (
                  <div className="text-center py-6 sm:py-8 space-y-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Enquiry Sent!</h3>
                    <p className="text-gray-500 text-sm">Our team will contact you shortly.</p>
                    <Button
                      onClick={() => setSubmitted(false)}
                      className="bg-gradient-to-r from-blue-600 to-red-500 text-white"
                    >
                      Send Another Enquiry
                    </Button>
                  </div>
                ) : (
                  <form ref={formRef as React.RefObject<HTMLFormElement>} onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm sm:text-base">Your Name *</Label>
                        <Input
                          placeholder="Rahul Sharma"
                          value={form.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[a-zA-Z\s]*$/.test(val)) {
                              setForm({ ...form, name: val });
                            }
                          }}
                          required
                          maxLength={50}
                          className="h-11 sm:h-10 bg-white/60 backdrop-blur-md border-gray-200/50 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm sm:text-base">Phone Number * <span className="text-xs text-gray-400 font-normal">(10 digits)</span></Label>
                        <Input
                          type="tel"
                          placeholder="9876543210"
                          value={form.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) {
                              setForm({ ...form, phone: val });
                            }
                          }}
                          required
                          maxLength={10}
                          className={`h-11 sm:h-10 bg-white/60 backdrop-blur-md text-sm sm:text-base ${form.phone && form.phone.length === 10 ? 'border-green-300' : form.phone && form.phone.length > 0 ? 'border-red-300' : 'border-gray-200/50'}`}
                        />
                        {form.phone && form.phone.length > 0 && form.phone.length < 10 && (
                          <p className="text-[9px] text-red-400">{10 - form.phone.length} more digit{10 - form.phone.length > 1 ? 's' : ''} needed</p>
                        )}
                        {form.phone && form.phone.length === 10 && (
                          <p className="text-[9px] text-green-500">Valid phone number</p>
                        )}
                      </div>
                    </div>

                    {/* Category Dropdown — Fixed with container */}
                    <div className="space-y-1.5">
                      <Label className="text-sm sm:text-base">Category *</Label>
                      <Select
                        value={form.category}
                        onValueChange={(val) => setForm({ ...form, category: val })}
                      >
                        <SelectTrigger className="w-full h-11 sm:h-10 bg-white/60 backdrop-blur-md border-gray-200/50 text-sm sm:text-base">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[70]" container={formRef.current}>
                          {enquiryCategories.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-sm py-2.5 sm:py-1.5">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] sm:text-[9px] text-gray-400 mt-0.5">
                        For repair/service requests, please use the &quot;Book Service&quot; button instead.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm sm:text-base">Message</Label>
                      <Textarea
                        placeholder="Describe your requirement..."
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="bg-white/60 backdrop-blur-md border-gray-200/50 text-sm sm:text-base"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white h-12 sm:h-11 font-semibold text-sm sm:text-base"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Enquiry →"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact info — takes 2 cols, uniform card sizes */}
          <div className="lg:col-span-2 space-y-3">
            {contactCards.map((info) => (
              <a
                key={info.title}
                href={info.href || undefined}
                target={info.href?.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl ${info.bgLight} border ${info.borderLight} hover:shadow-md transition-all group`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                  <info.icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm">{info.title}</h4>
                  <p className="text-sm text-gray-500 whitespace-pre-line group-hover:text-gray-700 transition-colors truncate">{info.text}</p>
                </div>
              </a>
            ))}

            {/* Get Directions CTA — same size as above cards */}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-200 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm">Get Directions</h4>
                <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors truncate">{address !== DEFAULT_ADDRESS ? address : "Navigate to our store →"}</p>
              </div>
            </a>
          </div>
        </div>

        {/* Map */}
        <div className="mt-8 sm:mt-10 rounded-xl overflow-hidden border border-gray-200 shadow-lg">
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="220"
            className="sm:h-[280px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Race Computer Location"
          />
        </div>
      </div>
    </section>
  );
}
