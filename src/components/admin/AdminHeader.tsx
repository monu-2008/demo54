"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut } from "lucide-react";
import type { AdminUser } from "./types";

interface AdminHeaderProps {
  masterVerified: boolean;
  adminUser: AdminUser | null;
  onLogout: () => void;
}

export default function AdminHeader({ masterVerified, adminUser, onLogout }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <a href="/">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" /> Back to Site
            </Button>
          </a>
          <div className="h-6 w-px bg-gray-200" />
          <span className="font-bold text-sm text-gray-700">
            {masterVerified ? "Master Admin Panel" : "Admin Panel"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {adminUser && (
            <div className="flex items-center gap-2 mr-2">
              {adminUser.photoURL ? (
                <img src={adminUser.photoURL} alt="" className="w-7 h-7 rounded-full border-2 border-gray-200" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-red-50 text-red-600">{adminUser.email?.charAt(0).toUpperCase()}</div>
              )}
              <span className="text-xs hidden sm:block text-gray-500">{adminUser.email}</span>
              {masterVerified && <Badge className="text-[9px] bg-red-50 text-red-600 border border-red-200">Master</Badge>}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
