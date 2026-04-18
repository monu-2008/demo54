"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ref, push, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { toast as sonnerToast } from "sonner";
import { ShoppingBag, MessageCircle, Package, ArrowRight, X, Star, Tag, Layers, Info, CheckCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  type?: string;
  variant?: string;
  rating?: number;
}

const DEFAULT_PRODUCTS: Omit<Product, "id">[] = [
  { name: "ASUS VivoBook 15", price: "₹42,999", category: "Components", image: "/images/laptop-asus.png", description: "Intel i5, 8GB RAM, 512GB SSD", type: "Laptop", variant: "i5/8GB/512GB" },
  { name: "Gaming Keyboard", price: "₹1,499", category: "Accessories", image: "/images/mechanical-keyboard.png", description: "RGB Mechanical Keyboard", type: "Keyboard", variant: "Mechanical / RGB" },
  { name: "SSD 512GB", price: "₹3,299", category: "Repair Parts", image: "/images/ssd-nvme.png", description: "NVMe M.2 Solid State Drive", type: "Storage", variant: "NVMe / 512GB" },
  { name: "Wireless Mouse", price: "₹699", category: "Accessories", image: "/images/wireless-mouse.png", description: "Ergonomic wireless mouse", type: "Mouse", variant: "Wireless / Ergonomic" },
  { name: "HP Laser Printer", price: "₹12,499", category: "Components", image: "/images/hp-printer.png", description: "Multifunction Laser Printer", type: "Printer", variant: "Laser / MFP" },
  { name: "Laptop Battery", price: "₹2,199", category: "Repair Parts", image: "/images/laptop-battery.png", description: "Compatible laptop battery", type: "Battery", variant: "Universal / Li-Ion" },
];

const DEFAULT_CATEGORIES = ["All", "Accessories", "Components", "Repair Parts", "Laptops"];

export default function Products() {
  const { setView } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [detailOpen, setDetailOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", address: "" });
  const [orderLoading, setOrderLoading] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (productId: string) => {
    setFailedImages((prev) => new Set(prev).add(productId));
  };

  useEffect(() => {
    const productsRef = ref(db, "products");
    const unsub = onValue(productsRef, (snap) => {
      if (snap.exists()) {
        const prods: Product[] = [];
        snap.forEach((child) => {
          prods.push({ id: child.key || "", ...child.val() });
        });
        prods.sort((a, b) => (a.order || 0) - (b.order || 0));
        setProducts(prods);
      } else {
        setProducts(DEFAULT_PRODUCTS.map((p, i) => ({ ...p, id: `default-${i}` })));
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.val());
    });
    return () => unsub();
  }, []);

  const productsHeader = siteSettings.productsHeader || "// Product Lineup";
  const productsTitle = siteSettings.productsTitle || "Our Products";
  const productsSubtitle = siteSettings.productsSubtitle || "Top brands available — ASUS, HP, Epson, Intel and many more.";
  const CATEGORIES = Array.isArray(siteSettings.productCategories) && siteSettings.productCategories.length > 0
    ? siteSettings.productCategories
    : DEFAULT_CATEGORIES;

  const filtered = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);
  // Show only 6 products in preview
  const previewProducts = filtered.slice(0, 6);

  const openDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const openOrder = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(false);
    setOrderForm({ name: "", phone: "", address: "" });
    setOrderOpen(true);
  };

  const handleOrder = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      sonnerToast.error("Please fill all fields");
      return;
    }
    // Validate name
    if (orderForm.name.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(orderForm.name.trim())) {
      sonnerToast.error("Invalid name", { description: "Name must be at least 2 characters (letters only)." });
      return;
    }
    // Validate phone (exactly 10 digits)
    const phoneDigits = orderForm.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      sonnerToast.error("Invalid phone number", { description: "Please enter exactly 10 digit phone number." });
      return;
    }
    // Validate address
    if (orderForm.address.trim().length < 5) {
      sonnerToast.error("Invalid address", { description: "Please enter a complete delivery address." });
      return;
    }
    setOrderLoading(true);
    try {
      await push(ref(db, "productOrders"), {
        productName: selectedProduct?.name,
        productPrice: selectedProduct?.price,
        customerName: orderForm.name.trim(),
        customerPhone: phoneDigits,
        customerAddress: orderForm.address.trim(),
        status: "pending",
        createdAt: Date.now(),
      });
      setOrderOpen(false);
      setOrderSuccessOpen(true);
      sonnerToast.success("Order Placed!", { description: "Please complete payment via WhatsApp." });
    } catch {
      sonnerToast.error("Order failed. Please try again.");
    }
    setOrderLoading(false);
  };

  const openWhatsApp = () => {
    const msg = `New Order: ${selectedProduct?.name}, Name: ${orderForm.name}, Address: ${orderForm.address}, Phone: ${orderForm.phone}`;
    window.open(`https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <section id="products" className="py-12 sm:py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-50/80 backdrop-blur-md border border-purple-200/50 rounded-full px-4 py-2 mb-4">
            <Package className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-purple-600 tracking-wider uppercase">{productsHeader}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">{productsTitle}</h2>
          <p className="text-gray-500 max-w-lg mx-auto">{productsSubtitle}</p>
          <div className="w-14 h-1 bg-gradient-to-r from-blue-600 to-red-500 rounded-full mx-auto mt-4" />
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? "bg-gradient-to-r from-blue-600 to-red-500 text-white shadow-md" : "bg-white/60 backdrop-blur-md border-gray-200/50"}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Products Grid - Preview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {previewProducts.map((product) => (
            <Card
              key={product.id}
              className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white/60 backdrop-blur-lg cursor-pointer"
              onClick={() => openDetail(product)}
            >
              <div className="h-44 bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                {product.image && !failedImages.has(product.id) ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => handleImageError(product.id)} />
                ) : (
                  <Package className="w-12 h-12 text-blue-300" />
                )}
                <Badge className="absolute top-3 right-3 bg-white/80 backdrop-blur-md text-blue-600 border-blue-200/50 text-[10px] hover:bg-white/90">
                  {product.category}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h4 className="font-bold text-gray-900 text-sm mb-1">{product.name}</h4>
                <p className="text-xs text-gray-400 mb-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">
                    {product.price}
                  </span>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); openOrder(product); }} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs gap-1 rounded-lg">
                    <ShoppingBag className="w-3 h-3" /> Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Explore Full Products Button */}
        {filtered.length > 6 && (
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="bg-white/70 backdrop-blur-lg border-2 border-blue-200/50 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-lg rounded-xl px-10 h-13 text-base gap-2"
              onClick={() => setView("fullProducts")}
            >
              Explore Full Products <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-gray-400 mt-2">{filtered.length}+ products available</p>
          </div>
        )}

        {/* Always show explore button if there are products */}
        {filtered.length <= 6 && filtered.length > 0 && (
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="bg-white/70 backdrop-blur-lg border-2 border-blue-200/50 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-lg rounded-xl px-10 h-13 text-base gap-2"
              onClick={() => setView("fullProducts")}
            >
              View All Products <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Product Detail Popup with Glassmorphism */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-2xl border-white/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="w-5 h-5 text-blue-600" /> Product Details
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-5">
              {/* Product Image */}
              <div className="h-40 sm:h-52 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden border border-blue-100/50">
                {selectedProduct.image && !failedImages.has(selectedProduct.id) ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" onError={() => handleImageError(selectedProduct.id)} />
                ) : (
                  <Package className="w-16 h-16 text-blue-300" />
                )}
              </div>

              {/* Product Name & Price */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedProduct.description}</p>
                </div>
                <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">
                  {selectedProduct.price}
                </div>
              </div>

              {/* Category, Type, Variant - Glassmorphism Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50/60 backdrop-blur-md rounded-xl p-3 border border-blue-100/50 text-center">
                  <Tag className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Category</div>
                  <div className="text-xs font-bold text-blue-700 mt-0.5">{selectedProduct.category}</div>
                </div>
                <div className="bg-purple-50/60 backdrop-blur-md rounded-xl p-3 border border-purple-100/50 text-center">
                  <Layers className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Type</div>
                  <div className="text-xs font-bold text-purple-700 mt-0.5">{selectedProduct.type || "General"}</div>
                </div>
                <div className="bg-red-50/60 backdrop-blur-md rounded-xl p-3 border border-red-100/50 text-center">
                  <Info className="w-4 h-4 text-red-500 mx-auto mb-1" />
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Variant</div>
                  <div className="text-xs font-bold text-red-700 mt-0.5">{selectedProduct.variant || "Standard"}</div>
                </div>
              </div>

              {/* Rating */}
              {selectedProduct.rating && (
                <div className="flex items-center gap-2 bg-yellow-50/60 backdrop-blur-md rounded-lg p-3 border border-yellow-100/50">
                  <div className="flex text-yellow-400">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= (selectedProduct.rating || 0) ? "fill-yellow-400" : ""}`} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{selectedProduct.rating}/5</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => openOrder(selectedProduct)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white font-semibold h-12"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" /> Order Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Success Dialog */}
      <Dialog open={orderSuccessOpen} onOpenChange={setOrderSuccessOpen}>
        <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-2xl border-white/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" /> Order Placed Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Your order has been placed!</h3>
            <p className="text-gray-500 text-sm">Our team will contact you shortly to confirm the order and payment details.</p>
            {selectedProduct && (
              <div className="bg-blue-50/60 backdrop-blur-md rounded-lg p-3 border border-blue-100/50 text-left">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-400" />
                  <div>
                    <div className="font-bold text-sm text-gray-900">{selectedProduct.name}</div>
                    <div className="text-lg font-extrabold text-blue-600">{selectedProduct.price}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setOrderSuccessOpen(false)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white font-semibold"
              >
                Close
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-green-300 text-green-700 hover:bg-green-50 gap-2"
                onClick={openWhatsApp}
              >
                <MessageCircle className="w-4 h-4" /> Pay via WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="sm:max-w-md bg-white/80 backdrop-blur-2xl border-white/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" /> Order Product
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50/60 backdrop-blur-md rounded-lg border border-blue-100/50">
                <Package className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="font-bold text-sm text-gray-900">{selectedProduct.name}</div>
                  <div className="text-lg font-extrabold text-blue-600">{selectedProduct.price}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Your Name *</Label>
                  <Input placeholder="Enter your name (letters only)" value={orderForm.name} onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z\s]*$/.test(val)) {
                      setOrderForm({ ...orderForm, name: val });
                    }
                  }} maxLength={50} className="bg-white/60 backdrop-blur-md border-gray-200/50" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number * <span className="text-xs text-gray-400 font-normal">(10 digits)</span></Label>
                  <Input type="tel" placeholder="9876543210" value={orderForm.phone} onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) {
                      setOrderForm({ ...orderForm, phone: val });
                    }
                  }} maxLength={10} className={`bg-white/60 backdrop-blur-md ${orderForm.phone && orderForm.phone.length === 10 ? 'border-green-300' : orderForm.phone && orderForm.phone.length > 0 ? 'border-red-300' : 'border-gray-200/50'}`} />
                  {orderForm.phone && orderForm.phone.length > 0 && orderForm.phone.length < 10 && (
                    <p className="text-[9px] text-red-400">{10 - orderForm.phone.length} more digit{10 - orderForm.phone.length > 1 ? 's' : ''} needed</p>
                  )}
                  {orderForm.phone && orderForm.phone.length === 10 && (
                    <p className="text-[9px] text-green-500">Valid phone number</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Address *</Label>
                  <Input placeholder="Your delivery address" value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} className="bg-white/60 backdrop-blur-md border-gray-200/50" />
                </div>
              </div>

              <Button
                onClick={handleOrder}
                className="w-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white font-semibold"
                disabled={orderLoading}
              >
                {orderLoading ? "Placing Order..." : "Place Order"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 backdrop-blur-md px-2 text-gray-400">or</span></div>
              </div>

              <Button
                variant="outline"
                className="w-full border-green-300 text-green-700 hover:bg-green-50 gap-2"
                onClick={openWhatsApp}
              >
                <MessageCircle className="w-4 h-4" /> Pay on WhatsApp
              </Button>
              <p className="text-[10px] text-center text-gray-400">
                After placing order, complete payment via WhatsApp. Admin will send QR manually.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
