import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase";

/**
 * Seed Firebase RTDB with minimal initial data.
 * Only sets up admin credentials and default site settings.
 * Admin will add all content (products, services, staff, etc.) via the admin panel.
 */
export async function seedDatabase() {
  // 1. Admin credentials only
  await set(ref(db, "settings/admin"), {
    email: "admin@racecomputer.in",
    password: "admin123",
  });

  // 2. Default site settings — all dynamic content fields with sensible defaults
  // Admin can change everything from the Settings panel
  await set(ref(db, "settings/site"), {
    storeName: "RACE COMPUTER",
    siteMode: "dark",
    themeId: "cyber-blue",
    themeColor: "#00f5ff",
    themeBlue: "#0080ff",
    themePurple: "#7b2fff",
    bgAnimation: "particles",

    // Hero Section
    heroSubtitle: "// NEXT-GEN TECH HUB · JAIPUR",
    heroTagline: "Jaipur's most trusted tech destination since 2001. Laptops, PCs, printers and expert home repair service — all under one roof.",
    heroEyebrow: "Sanganer, Jaipur · Est. 2001",
    heroCtaPrimary: "Book Home Service",
    heroCtaSecondary: "Explore Products",
    heroTrustStars: "★★★★☆",
    heroTrustReviews: "213+ Google Reviews",
    heroTrustLocation: "Sanganer Bazar, Jaipur",

    // Stats
    stats: {
      years: "Since 2001",
      rating: "4★ Rating",
      reviews: "213+",
      customers: "9000+ Customers",
      branches: "2+",
      numYears: "25+",
      numReviews: "213+",
      numRating: "4★",
      numCustomers: "9K+",
    },

    // Hero pills
    heroPills: [
      { label: "Since 2001", dotColor: "primary" },
      { label: "4★ Rating", dotColor: "yellow" },
      { label: "ASUS Partner", dotColor: "green" },
      { label: "Home Service", dotColor: "accent" },
      { label: "9000+ Customers", dotColor: "secondary" },
    ],

    // Hero floating chips
    heroChips: [
      { icon: "Award", text: "ASUS AUTHORIZED", color: "primary" },
      { icon: "Wrench", text: "HOME SERVICE", color: "accent" },
      { icon: "Building2", text: "2+ BRANCHES", color: "green" },
      { icon: "Headphones", text: "EXPERT SUPPORT", color: "secondary" },
    ],

    // Section Headers
    servicesHeader: "// What We Offer",
    servicesTitle: "Our Services",
    servicesSubtitle: "Sanganer's most complete tech service hub — hardware to software, purchase to repair.",

    productsHeader: "// Product Lineup",
    productsTitle: "Our Products",
    productsSubtitle: "Top brands available — ASUS, HP, Epson, Intel and many more.",
    productCategories: ["All", "Accessories", "Components", "Repair Parts", "Laptops"],

    galleryHeader: "// Our Work",
    galleryTitle: "Gallery",
    gallerySubtitle: "A glimpse into our workspace, builds, and repairs — see the RACE COMPUTER difference.",

    aboutHeader: "// Who We Are",
    aboutTitle: "About RACE COMPUTER",
    aboutSubtitle: "Since 2001, thousands of satisfied customers, and Jaipur's most trusted tech partner.",

    contactHeader: "// Send Enquiry",
    contactTitle: "Get In Touch",
    contactSubtitle: "Have a query? Send an enquiry, call us, or visit our store.",

    // About section
    aboutStory: [
      "<strong class='text-blue-600'>Race Computer Services</strong> was founded in 2001 with a vision to provide quality technology solutions in Jaipur. What started as a small service center has now grown into one of Rajasthan's most trusted technology brands.",
      "In 2010, we opened our <strong class='text-red-500'>Race Computer Retail Store at Sanganer Bazar</strong>, which became our main customer-facing hub. As an <strong class='text-blue-600'>authorized ASUS dealer</strong>, we guarantee genuine products with full manufacturer warranty.",
      "From a single shop to <strong class='text-red-500'>multiple branches across Jaipur</strong>, with 9000+ happy customers and counting. Today we are <strong class='text-red-500'>Jaipur's No.1 tech destination</strong> with home service, product delivery, and staff management.",
    ],
    aboutTimeline: [
      { year: "2001", title: "Race Computer Services Founded", desc: "Started our journey in Jaipur" },
      { year: "2010", title: "Sanganer Retail Store Opened", desc: "Race Computer retail store at Sanganer Bazar" },
      { year: "2014", title: "ASUS Authorization", desc: "Official ASUS authorized dealer" },
      { year: "2019", title: "Service Center Launch", desc: "Dedicated repair & AMC services" },
      { year: "2025", title: "Home Service Platform", desc: "Online booking & staff management system" },
    ],

    // Contact Info
    phone: "+91 XXXXX XXXXX",
    whatsapp: "+91 XXXXX XXXXX",
    email: "racecomputer16000@gmail.com",
    address: "Race Computer Sanganer Jaipur",
    hours: "Mon – Sat: 10:00 AM – 8:00 PM\nSunday: Closed",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3561.073!2d75.8035382!3d26.8108296!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396dc98d0fb7d66f%3A0x6c20f5cebf1e71da!2sRace%20Computer!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin",

    // Footer
    asusPartnerText: "AUTHORIZED ASUS PARTNER",
    footerLinks: ["Home", "Services", "Products", "Gallery", "About", "Contact"],

    // Ticker items
    tickerItems: [
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
    ],

    // Service types (for booking forms)
    serviceTypes: [
      "Laptop Repair",
      "Desktop Repair",
      "Software Issue",
      "Hardware Upgrade",
      "Home Installation",
    ],

    // Enquiry categories (for contact/enquiry forms)
    enquiryCategories: [
      "Desktop & Laptops",
      "Printers & Peripherals",
      "Networking Solutions",
      "AMC & Support",
      "Custom PC Build",
      "Software & OS",
      "General Enquiry",
    ],
  });

  // 3. Empty collections — admin will populate via admin panel
  await set(ref(db, "products"), {});
  await set(ref(db, "services"), {});
  await set(ref(db, "staff"), {});
  await set(ref(db, "branches"), {});
  await set(ref(db, "gallery"), {});
  await set(ref(db, "serviceRequests"), {});
  await set(ref(db, "productOrders"), {});
  await set(ref(db, "enquiries"), {});
  await set(ref(db, "staffLocations"), {});
}
