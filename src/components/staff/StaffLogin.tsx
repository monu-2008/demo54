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

export default function StaffLogin() {
  const { setStaffLoggedIn, setStaffUser, setView } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50/30 via-white to-red-50/30 px-4">
      {/* Background blobs */}
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-red-100/30 blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full bg-red-100/20 blur-3xl" />

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-2xl relative">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl gradient-text">Staff Login</CardTitle>
          <CardDescription>Access your staff dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/60 backdrop-blur-md"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/60 backdrop-blur-md"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white cursor-pointer h-11 font-semibold"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <Button
            variant="ghost"
            className="w-full mt-4 text-muted-foreground cursor-pointer"
            onClick={() => setView("main")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
