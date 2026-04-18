"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { ProductOrder } from "./types";

interface ProductOrdersTabProps {
  productOrders: ProductOrder[];
  masterVerified: boolean;
  formatDate: (ts: number) => string;
  confirmOrder: (id: string) => void;
  deleteOrder: (id: string) => void;
}

export default function ProductOrdersTab({
  productOrders, masterVerified, formatDate, confirmOrder, deleteOrder,
}: ProductOrdersTabProps) {
  return (
    <Card className={masterVerified ? "aqerionx-card border-0" : "border border-gray-100 shadow-sm bg-white"}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className={masterVerified ? "" : "bg-gray-50/50"} style={masterVerified ? { background: "rgba(15,15,40,0.5)" } : {}}>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs">Price</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Address</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productOrders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">No orders yet</TableCell></TableRow>
              ) : (
                productOrders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-red-50/30">
                    <TableCell className="text-sm font-medium">{o.productName}</TableCell>
                    <TableCell className="text-sm font-bold text-red-600">{o.productPrice}</TableCell>
                    <TableCell className="text-sm">{o.customerName}</TableCell>
                    <TableCell className="text-sm">{o.customerPhone}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{o.customerAddress}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-xs text-gray-400">{formatDate(o.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {o.status !== "confirmed" && (
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 text-[10px] h-7" onClick={() => confirmOrder(o.id)}>
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 text-[10px] h-7" onClick={() => deleteOrder(o.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
