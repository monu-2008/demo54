"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ref, push, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
  ShoppingBag, MessageCircle, Package, ArrowLeft, Search,
  Star, Tag, Layers, Info, SlidersHorizontal, Grid3X3, List
} from "lucide-react";

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

const DEFAULT_CATEGORIES = ["All", "Accessories", "Components", "Repair Parts"];

export default function FullProducts() {
  const { setView } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", address: "" });
  const [orderLoading, setOrderLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
        setProducts([]);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.val());
    });
    return unsub;
  }, []);

  const CATEGORIES = Array.isArray(siteSettings.productCategories) && siteSettings.productCategories.length > 0
    ? siteSettings.productCategories
    : DEFAULT_CATEGORIES;

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

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
      toast.error("Please fill all fields");
      return;
    }
    setOrderLoading(true);

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
      const orderId = "RC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const orderData: Record<string, unknown> = {
        orderId,
        productName: selectedProduct?.name,
        productPrice: selectedProduct?.price,
        customerName: orderForm.name.trim(),
        customerPhone: orderForm.phone.trim(),
        customerAddress: orderForm.address.trim(),
        status: "pending",
        createdAt: Date.now(),
      };
      if (customerLat !== null && customerLng !== null) {
        orderData.customerLat = customerLat;
        orderData.customerLng = customerLng;
        orderData.customerLocationTime = Date.now();
      }
      await push(ref(db, "productOrders"), orderData);
      setLastOrderId(orderId);
      setOrderOpen(false);
      toast.success("Order Placed!", { description: `Order ID: ${orderId}. Complete payment via WhatsApp.` });
    } catch {
      toast.error("Order failed");
    }
    setOrderLoading(false);
  };

  const openWhatsApp = () => {
    const msg = `Hi! I want to pay for my order.\n\nOrder ID: ${lastOrderId}\nProduct: ${selectedProduct?.name}\nPrice: ${selectedProduct?.price}\nName: ${orderForm.name}\nPhone: ${orderForm.phone}\nAddress: ${orderForm.address}`;
    const whatsapp = siteSettings.whatsapp || "919876543210";
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-purple-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-blue-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setView("main")} className="gap-1 text-gray-600 hover:text-blue-600">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="font-bold text-lg bg-gradient-to-r from-blue-700 to-red-500 bg-clip-text text-transparent">All Products</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-white/60 backdrop-blur-md">{filtered.length} products</Badge>
              <div className="hidden sm:flex gap-1">
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-blue-600 h-8 w-8 p-0" : "h-8 w-8 p-0"}>
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-blue-600 h-8 w-8 p-0" : "h-8 w-8 p-0"}>
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/60 backdrop-blur-lg border-gray-200/50 h-11 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
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
        </div>

        {/* Products Grid */}
        {viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product) => (
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
                  <Badge className="absolute top-3 right-3 bg-white/80 backdrop-blur-md text-blue-600 border-blue-200/50 text-[10px]">
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
        ) : (
          /* List View */
          <div className="space-y-3">
            {filtered.map((product) => (
              <Card
                key={product.id}
                className="border-0 shadow-md hover:shadow-lg transition-all bg-white/60 backdrop-blur-lg cursor-pointer"
                onClick={() => openDetail(product)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden shrink-0">
                    {product.image && !failedImages.has(product.id) ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={() => handleImageError(product.id)} />
                    ) : (
                      <Package className="w-8 h-8 text-blue-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-400">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-blue-50/60 text-blue-600 border-blue-200/50 text-[9px]">{product.category}</Badge>
                      {product.type && <Badge className="bg-purple-50/60 text-purple-600 border-purple-200/50 text-[9px]">{product.type}</Badge>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">{product.price}</div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); openOrder(product); }} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs gap-1 mt-1">
                      <ShoppingBag className="w-3 h-3" /> Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No products found</h3>
            <p className="text-gray-300 mt-1">Try a different search or category</p>
          </div>
        )}
      </div>

      {/* Product Detail Popup */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg bg-white/80 backdrop-blur-2xl border-white/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-blue-600" /> Product Details
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-5">
              <div className="h-52 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center overflow-hidden border border-blue-100/50">
                {selectedProduct.image && !failedImages.has(selectedProduct.id) ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" onError={() => handleImageError(selectedProduct.id)} />
                ) : (
                  <Package className="w-16 h-16 text-blue-300" />
                )}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedProduct.description}</p>
                </div>
                <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">
                  {selectedProduct.price}
                </div>
              </div>

              {/* Category, Type, Variant */}
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

              <div className="flex gap-3">
                <Button onClick={() => openOrder(selectedProduct)} className="flex-1 bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white font-semibold h-12">
                  <ShoppingBag className="w-4 h-4 mr-2" /> Order Now
                </Button>
              </div>
            </div>
          )}
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
                  <Input placeholder="Enter your name" value={orderForm.name} onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })} className="bg-white/60 backdrop-blur-md" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number *</Label>
                  <Input type="tel" placeholder="+91 98765 43210" value={orderForm.phone} onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} className="bg-white/60 backdrop-blur-md" />
                </div>
                <div className="space-y-1.5">
                  <Label>Address *</Label>
                  <Input placeholder="Your delivery address" value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} className="bg-white/60 backdrop-blur-md" />
                </div>
              </div>

              <Button onClick={handleOrder} className="w-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white font-semibold" disabled={orderLoading}>
                {orderLoading ? "Placing Order..." : "Place Order"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 px-2 text-gray-400">or</span></div>
              </div>

              <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50 gap-2" onClick={openWhatsApp}>
                <MessageCircle className="w-4 h-4" /> Pay on WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
