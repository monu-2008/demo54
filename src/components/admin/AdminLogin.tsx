"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

// Allowed admin emails - no password needed, just Google sign-in
const ALLOWED_ADMIN_EMAILS = [
  "racecomputer16000@gmail.com",
  "manmohansharma002008@gmail.com",
];

export default function AdminLogin() {
  const { setAdminLoggedIn, setAdminType, setAdminUser, setView } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle redirect result on mount (when returning from Google redirect)
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const email = result.user.email?.toLowerCase() || "";
          if (ALLOWED_ADMIN_EMAILS.includes(email)) {
            setAdminUser({
              email: result.user.email || "",
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              uid: result.user.uid,
            });
            setAdminType("admin");
            setAdminLoggedIn(true);
          } else {
            setError("This Google account is not authorized as admin.");
            auth.signOut();
          }
        }
      } catch (err: unknown) {
        const firebaseError = err as { code?: string; message?: string };
        console.error("Redirect result error:", firebaseError);
        setError("Google sign-in failed. Please try again.");
      }
    })();
  }, [setAdminLoggedIn, setAdminType, setAdminUser]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Try popup first (works on desktop)
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email?.toLowerCase() || "";

      // Check if email is in allowed list
      const isAdmin = ALLOWED_ADMIN_EMAILS.includes(email);

      if (isAdmin) {
        setAdminUser({
          email: user.email || "",
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid,
        });
        setAdminType("admin");
        setAdminLoggedIn(true);
      } else {
        setError("This Google account is not authorized as admin.");
        // Sign out the unauthorized user
        auth.signOut();
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error("Google login error:", firebaseError.code, firebaseError.message);

      if (firebaseError.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else if (firebaseError.code === "auth/cancelled-popup-request") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (
        firebaseError.code === "auth/popup-blocked" ||
        firebaseError.code === "auth/web-storage-unsupported"
      ) {
        // Popup blocked — fall back to redirect method
        setError("Popup was blocked. Redirecting to Google sign-in...");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: unknown) {
          console.error("Redirect sign-in error:", redirectErr);
          setError("Google sign-in failed. Please allow popups or try a different browser.");
        }
      } else if (firebaseError.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for Google sign-in. Please add it in Firebase Console → Authentication → Settings → Authorized domains.");
      } else if (firebaseError.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email using a different sign-in method.");
      } else {
        setError(`Google sign-in failed: ${firebaseError.message || "Unknown error"}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50/30 px-4">
      {/* Background blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-red-100/30 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-red-100/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-100/15 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-2xl relative">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl gradient-text">Admin Login</CardTitle>
          <CardDescription>Sign in with your authorized Google account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 text-center break-words">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-red-300 h-12 text-base font-medium shadow-sm transition-all cursor-pointer flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Only authorized Google accounts can access admin panel
            </p>
          </div>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground cursor-pointer"
            onClick={() => setView("main")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website
          </Button>
        </CardContent>
      </Card>

      {/* AQERIONX Gradient Branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs tracking-[4px] uppercase font-medium text-gray-400">
          Powered by{" "}
          <span
            className="font-extrabold text-sm tracking-[3px]"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #0055ff, #7c3aff, #ff3d00, #00d68f, #0055ff)",
              backgroundSize: "300% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "raceSlide 3s linear infinite",
            }}
          >
            AQERIONX
          </span>
        </p>
      </div>
    </div>
  );
}
