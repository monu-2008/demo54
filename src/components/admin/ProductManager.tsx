"use client";

import { useState, useEffect } from "react";
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  order: number;
}

const categories = ["Accessories", "Components", "Repair Parts"];

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Accessories",
    image: "",
    description: "",
    order: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prodRef = ref(db, "products");
    const unsubscribe = onValue(prodRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: [string, unknown]) => ({
          id: key,
          ...(val as Omit<Product, "id">),
        }));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setProducts(list);
      } else {
        setProducts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", price: "", category: "Accessories", image: "", description: "", order: products.length });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      price: p.price,
      category: p.category,
      image: p.image || "",
      description: p.description || "",
      order: p.order || 0,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.error("Name, price, and category are required");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        await update(ref(db, `products/${editId}`), form);
        toast.success("Product updated successfully");
      } else {
        await push(ref(db, "products"), form);
        toast.success("Product added successfully");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await remove(ref(db, `products/${id}`));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const moveProduct = async (id: string, direction: "up" | "down") => {
    const idx = products.findIndex((p) => p.id === id);
    if (idx < 0) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === products.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = products[idx];
    const swap = products[swapIdx];

    try {
      await update(ref(db, `products/${current.id}`), { order: swap.order || swapIdx });
      await update(ref(db, `products/${swap.id}`), { order: current.order || idx });
    } catch {
      toast.error("Failed to reorder product");
    }
  };

  return (
    <div>
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5 text-race-red" />
            Product Management
          </CardTitle>
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No products yet. Add your first product.
            </p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600">₹{p.price}</span>
                        <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveProduct(p.id, "up")}
                      className="h-8 w-8 p-0 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveProduct(p.id, "down")}
                      className="h-8 w-8 p-0 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(p)}
                      className="cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{p.name}&quot;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteProduct(p.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update product details" : "Add a new product to the catalog"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹) *</Label>
                <Input
                  placeholder="e.g., 499"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.image}
                onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Product description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white cursor-pointer"
            >
              {loading ? "Saving..." : editId ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
