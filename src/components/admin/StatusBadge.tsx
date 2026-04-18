"use client";
import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    accepted: "bg-red-100 text-red-700 border-red-300",
    completed: "bg-green-100 text-green-700 border-green-300",
    confirmed: "bg-green-100 text-green-700 border-green-300",
  };
  return <Badge className={`${styles[status] || "bg-gray-100 text-gray-700"} border text-[10px] font-semibold uppercase`}>{status}</Badge>;
}
