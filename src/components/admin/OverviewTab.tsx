"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "./StatusBadge";
import type { ServiceRequest, ProductOrder, StaffMember, Product } from "./types";
import { Wrench, Clock, AlertCircle, CheckCircle, ShoppingBag, Users, Package, TrendingUp, BarChart3, Phone } from "lucide-react";

interface OverviewTabProps {
  serviceRequests: ServiceRequest[];
  productOrders: ProductOrder[];
  staff: StaffMember[];
  products: Product[];
  pendingRequests: ServiceRequest[];
  acceptedRequests: ServiceRequest[];
  completedRequests: ServiceRequest[];
  masterVerified: boolean;
  formatDate: (ts: number) => string;
  getStaffStats: (name: string) => { completed: number; active: number };
}

export default function OverviewTab({
  serviceRequests, productOrders, staff, products,
  pendingRequests, acceptedRequests, completedRequests,
  masterVerified, formatDate, getStaffStats,
}: OverviewTabProps) {
  return (
    <>
      {/* Stats Row 1 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Requests", value: serviceRequests.length, icon: Wrench, color: "blue" },
          { label: "Pending", value: pendingRequests.length, icon: Clock, color: "yellow" },
          { label: "Accepted", value: acceptedRequests.length, icon: AlertCircle, color: "purple" },
          { label: "Completed", value: completedRequests.length, icon: CheckCircle, color: "green" },
        ].map((stat) => (
          <Card key={stat.label} className={masterVerified ? "aqerionx-card border-0 shadow-md" : "border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white"}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${masterVerified ? "" : stat.color === "blue" ? "bg-red-50" : stat.color === "yellow" ? "bg-yellow-50" : stat.color === "purple" ? "bg-purple-50" : "bg-green-50"}`} style={masterVerified ? { background: stat.color === "blue" ? "rgba(0,229,255,0.15)" : stat.color === "yellow" ? "rgba(250,204,21,0.15)" : stat.color === "purple" ? "rgba(124,58,255,0.15)" : "rgba(16,185,129,0.15)" } : {}}>
                <stat.icon className={`w-6 h-6 ${masterVerified ? "" : stat.color === "blue" ? "text-red-600" : stat.color === "yellow" ? "text-yellow-600" : stat.color === "purple" ? "text-purple-600" : "text-green-600"}`} style={masterVerified ? { color: stat.color === "blue" ? "#00e5ff" : stat.color === "yellow" ? "#facc15" : stat.color === "purple" ? "#7c3aff" : "#10b981" } : {}} />
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${masterVerified ? "text-white" : "text-gray-900"}`}>{stat.value}</div>
                <div className={`text-xs font-medium ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Row 2 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Product Orders", value: productOrders.length, icon: ShoppingBag, color: "red" },
          { label: "Staff Members", value: staff.length, icon: Users, color: "blue" },
          { label: "Products", value: products.length, icon: Package, color: "purple" },
          { label: "Revenue", value: `₹${completedRequests.length * 500 + productOrders.filter(o => o.status === "confirmed").length * 2000}`, icon: TrendingUp, color: "green" },
        ].map((stat) => (
          <Card key={stat.label} className={masterVerified ? "aqerionx-card border-0 shadow-md" : "border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white"}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${masterVerified ? "" : stat.color === "red" ? "bg-red-50" : stat.color === "blue" ? "bg-red-50" : stat.color === "purple" ? "bg-purple-50" : "bg-green-50"}`} style={masterVerified ? { background: stat.color === "red" ? "rgba(239,68,68,0.15)" : stat.color === "blue" ? "rgba(0,229,255,0.15)" : stat.color === "purple" ? "rgba(124,58,255,0.15)" : "rgba(16,185,129,0.15)" } : {}}>
                <stat.icon className={`w-6 h-6 ${masterVerified ? "" : stat.color === "red" ? "text-red-500" : stat.color === "blue" ? "text-red-600" : stat.color === "purple" ? "text-purple-600" : "text-green-600"}`} style={masterVerified ? { color: stat.color === "red" ? "#ef4444" : stat.color === "blue" ? "#00e5ff" : stat.color === "purple" ? "#7c3aff" : "#10b981" } : {}} />
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${masterVerified ? "text-white" : "text-gray-900"}`}>{stat.value}</div>
                <div className={`text-xs font-medium ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Pending + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className={masterVerified ? "aqerionx-card border-0" : "border border-gray-100 shadow-sm bg-white"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${masterVerified ? "text-yellow-400" : ""}`}>
              <Clock className={`w-4 h-4 ${masterVerified ? "text-yellow-400" : "text-yellow-500"}`} /> Recent Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className={`text-sm text-center py-6 ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>No pending requests</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingRequests.slice(0, 5).map((r) => (
                  <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${masterVerified ? "" : "bg-yellow-50/60 border-yellow-100"}`} style={masterVerified ? { background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.15)" } : {}}>
                    <div>
                      <div className={`text-sm font-semibold ${masterVerified ? "text-gray-200" : "text-gray-900"}`}>{r.name}</div>
                      <div className={`text-xs ${masterVerified ? "text-gray-500" : "text-gray-500"}`}>{r.serviceType} · {formatDate(r.createdAt)}</div>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={masterVerified ? "aqerionx-card border-0" : "border border-gray-100 shadow-sm bg-white"}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${masterVerified ? "text-cyan-400" : ""}`}>
              <ShoppingBag className={`w-4 h-4 ${masterVerified ? "text-cyan-400" : "text-red-500"}`} /> Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productOrders.length === 0 ? (
              <p className={`text-sm text-center py-6 ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>No orders yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {productOrders.slice(0, 5).map((o) => (
                  <div key={o.id} className={`flex items-center justify-between p-3 rounded-lg border ${masterVerified ? "" : "bg-red-50/60 border-red-100"}`} style={masterVerified ? { background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.15)" } : {}}>
                    <div>
                      <div className={`text-sm font-semibold ${masterVerified ? "text-gray-200" : "text-gray-900"}`}>{o.productName}</div>
                      <div className={`text-xs ${masterVerified ? "text-gray-500" : "text-gray-500"}`}>{o.customerName} · {formatDate(o.createdAt)}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance */}
      {staff.length > 0 && (
        <Card className={`${masterVerified ? "aqerionx-card border-0" : "border border-gray-100 shadow-sm bg-white"} mt-6`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${masterVerified ? "text-purple-400" : ""}`}>
              <BarChart3 className={`w-4 h-4 ${masterVerified ? "text-purple-400" : "text-purple-500"}`} /> Staff Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {staff.filter(s => s.active !== false).map((s) => {
                const stats = getStaffStats(s.name);
                return (
                  <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border ${masterVerified ? "" : "bg-gray-50/60 border-gray-100"}`} style={masterVerified ? { background: "rgba(124,58,255,0.08)", border: "1px solid rgba(124,58,255,0.15)" } : {}}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${masterVerified ? "" : "bg-red-100 text-red-600"}`} style={masterVerified ? { background: "rgba(0,229,255,0.15)", color: "#00e5ff" } : {}}>{s.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className={`text-sm font-semibold ${masterVerified ? "text-gray-200" : "text-gray-900"}`}>{s.name}</div>
                        <div className={`text-xs ${masterVerified ? "text-gray-500" : "text-gray-400"}`}>{s.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${masterVerified ? "text-[10px]" : "bg-red-50 text-red-600 border-red-200 text-[10px]"}`} style={masterVerified ? { background: "rgba(0,229,255,0.15)", color: "#00e5ff", border: "1px solid rgba(0,229,255,0.2)" } : {}}>{stats.active} Active</Badge>
                      <Badge className={`${masterVerified ? "text-[10px]" : "bg-green-50 text-green-600 border-green-200 text-[10px]"}`} style={masterVerified ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" } : {}}>{stats.completed} Done</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
