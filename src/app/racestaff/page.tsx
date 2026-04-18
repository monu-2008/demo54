"use client";

import { useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserCheck, ArrowLeft } from "lucide-react";
import StaffDashboard from "@/components/staff/StaffDashboard";

export default function StaffPage() {
  const { staffLoggedIn, staffUser, setStaffLoggedIn, setStaffUser } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in as staff, show dashboard
  if (staffLoggedIn && staffUser) {
    return <StaffDashboard />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const staffRef = ref(db, "staff");
      const snapshot = await get(staffRef);
      const data = snapshot.val();

      if (data) {
        const staffEntry = Object.entries(data).find(
          ([, val]: [string, unknown]) => {
            const s = val as { email: string; password: string; active: boolean; name: string; phone: string };
            return s.email === email && s.password === password && s.active;
          }
        );

        if (staffEntry) {
          const [id, val] = staffEntry;
          const s = val as { name: string; email: string; phone: string };
          setStaffUser({ id, name: s.name, email: s.email, phone: s.phone || "" });
          setStaffLoggedIn(true);
        } else {
          setError("Invalid credentials or account inactive");
        }
      } else {
        setError("No staff accounts found. Contact admin.");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef0ff 50%, #f0f4ff 100%)" }}>
      <Card className="w-full max-w-md shadow-xl border border-gray-100 bg-white">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-50 border border-emerald-100">
            <UserCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Staff Login</CardTitle>
          <CardDescription className="text-gray-500">Access your staff dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-600">Email</Label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-gray-200 focus:border-red-400 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Password</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-gray-200 focus:border-red-400 text-gray-900"
              />
            </div>
            {error && (
              <div className="rounded-lg p-3 text-sm text-red-600 bg-red-50 border border-red-100 text-center">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold cursor-pointer bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="border-t border-gray-100 pt-3 mt-4">
            <a href="/" className="block">
              <Button variant="ghost" className="w-full text-gray-400 cursor-pointer hover:text-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Website
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
