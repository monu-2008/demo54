"use client";

import { useState, useEffect } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle2, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";

interface ProductOrder {
  id: string;
  productName: string;
  productPrice: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: "pending" | "confirmed";
  createdAt: number;
}

export default function ProductOrders({ compact = false }: { compact?: boolean }) {
  const [orders, setOrders] = useState<ProductOrder[]>([]);

  useEffect(() => {
    const ordRef = ref(db, "productOrders");
    const unsubscribe = onValue(ordRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]: [string, unknown]) => ({
          id: key,
          ...(val as Omit<ProductOrder, "id">),
        }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(list);
      } else {
        setOrders([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const displayList = compact ? orders.slice(0, 5) : orders;

  const confirmOrder = async (id: string) => {
    try {
      await update(ref(db, `productOrders/${id}`), { status: "confirmed" });
      toast.success("Order confirmed");
    } catch {
      toast.error("Failed to confirm order");
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await remove(ref(db, `productOrders/${id}`));
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {!compact && (
        <h3 className="font-semibold mb-4">Product Orders ({orders.length})</h3>
      )}

      {displayList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No orders found</p>
      ) : compact ? (
        <div className="space-y-3">
          {displayList.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{order.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {order.customerName} — ₹{order.productPrice}
                </p>
              </div>
              {order.status === "pending" ? (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  <Clock className="w-3 h-3 mr-1" /> Pending
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed
                </Badge>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Product</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Price</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayList.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{order.customerName}</td>
                  <td className="py-3 px-2">{order.productName}</td>
                  <td className="py-3 px-2 font-semibold">₹{order.productPrice}</td>
                  <td className="py-3 px-2 hidden md:table-cell">{order.customerPhone}</td>
                  <td className="py-3 px-2">
                    {order.status === "pending" ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell text-xs">{formatDate(order.createdAt)}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => confirmOrder(order.id)}
                          className="text-emerald-600 hover:text-emerald-700 h-8 w-8 p-0 cursor-pointer"
                          title="Confirm Order"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 h-8 w-8 p-0 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the order for {order.productName} by {order.customerName}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteOrder(order.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
