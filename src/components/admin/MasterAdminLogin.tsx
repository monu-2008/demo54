"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, KeyRound, CheckCircle } from "lucide-react";

const MASTER_PIN = "Masteradmin@monu";
const MASTER_ADMIN_EMAIL = "manmohansharma002008@gmail.com";

export default function MasterAdminLogin() {
  const { setAdminLoggedIn, setAdminType, setAdminUser, setView } = useAppStore();
  const [step, setStep] = useState<"pin" | "google">("pin");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pinVerified, setPinVerified] = useState(false);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pin === MASTER_PIN) {
      setPinVerified(true);
      setStep("google");
    } else {
      setError("Invalid Master Admin PIN. Access denied.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email?.toLowerCase() || "";

      // Only the specific master admin email is allowed
      if (email !== MASTER_ADMIN_EMAIL) {
        setError("This Google account is not authorized as Master Admin.");
        auth.signOut();
        return;
      }

      setAdminUser({
        email: user.email || "",
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
      });
      setAdminType("master");
      setAdminLoggedIn(true);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else if (firebaseError.code === "auth/cancelled-popup-request") {
        setError("Sign-in was cancelled. Please try again.");
      } else {
        setError("Google verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-red-50/30 px-4">
      {/* Background blobs */}
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-purple-100/30 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full bg-red-100/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-indigo-100/15 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-2xl relative">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">Master Admin</CardTitle>
          <CardDescription>
            {step === "pin" ? "Enter your Master Admin PIN" : "Verify with Google to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              step === "pin" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
            }`}>
              {pinVerified ? <CheckCircle className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
              Step 1: PIN
            </div>
            <div className={`w-8 h-0.5 ${pinVerified ? "bg-green-300" : "bg-gray-200"}`} />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              step === "google" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"
            }`}>
              <svg className="w-3 h-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Step 2: Google
            </div>
          </div>

          {/* PIN Step */}
          {step === "pin" && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="text-center">
                  <KeyRound className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Enter the Master Admin PIN to proceed</p>
                </div>
                <Input
                  type="password"
                  placeholder="Enter Master Admin PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-white/60 backdrop-blur-md text-center text-lg tracking-widest h-12"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-11 font-semibold cursor-pointer"
              >
                Verify PIN
              </Button>
            </form>
          )}

          {/* Google Verification Step */}
          {step === "google" && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">PIN verified! Now verify with your Google account.</p>
              </div>
              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-purple-300 h-12 text-base font-medium shadow-sm transition-all cursor-pointer flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Verify with Google
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-400 text-xs cursor-pointer"
                onClick={() => { setStep("pin"); setPinVerified(false); setPin(""); }}
              >
                Go back to PIN step
              </Button>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground cursor-pointer"
              onClick={() => setView("main")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
