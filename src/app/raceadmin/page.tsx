"use client";

import { useState, useEffect, useRef } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";

// Allowed admin emails
const ALLOWED_ADMIN_EMAILS = [
  "racecomputer16000@gmail.com",
  "manmohansharma002008@gmail.com",
];

// Master admin email - only this email gets "master" type
const MASTER_ADMIN_EMAIL = "manmohansharma002008@gmail.com";

export default function AdminPage() {
  const { adminLoggedIn, adminType, setAdminLoggedIn, setAdminType, setAdminUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // ── AQERIONX hidden tap detector (7 taps → /mastermonu) ──
  const aqTapCount = useRef(0);
  const aqTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAqerionxTap = () => {
    aqTapCount.current += 1;
    if (aqTapTimer.current) clearTimeout(aqTapTimer.current);
    aqTapTimer.current = setTimeout(() => { aqTapCount.current = 0; }, 2000);
    if (aqTapCount.current >= 7) {
      aqTapCount.current = 0;
      window.location.href = "/mastermonu";
    }
  };

  // Hydration guard
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Handle redirect result on mount (when returning from Google redirect)
  useEffect(() => {
    if (!hydrated) return;
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
            setAdminType(email === MASTER_ADMIN_EMAIL ? "master" : "admin");
            setAdminLoggedIn(true);
          } else {
            setError("This Google account is not authorized as admin.");
            auth.signOut();
          }
        }
      } catch (err: unknown) {
        const firebaseError = err as { code?: string; message?: string };
        console.error("Redirect result error:", firebaseError);
      }
    })();
  }, [hydrated, setAdminLoggedIn, setAdminType, setAdminUser]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#faf5f5" }}>
        <div className="w-8 h-8 border-3 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: "#dc2626" }} />
      </div>
    );
  }

  if (adminLoggedIn && (adminType === "admin" || adminType === "master")) {
    return <AdminDashboard />;
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email?.toLowerCase() || "";

      if (ALLOWED_ADMIN_EMAILS.includes(email)) {
        setAdminUser({
          email: user.email || "",
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid,
        });
        // Set master type for manmohan's email, admin for others
        setAdminType(email === MASTER_ADMIN_EMAIL ? "master" : "admin");
        setAdminLoggedIn(true);
      } else {
        setError("This Google account is not authorized as admin.");
        auth.signOut();
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error("Google login error:", firebaseError.code, firebaseError.message);

      if (firebaseError.code === "auth/popup-closed-by-user" || firebaseError.code === "auth/cancelled-popup-request") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (
        firebaseError.code === "auth/popup-blocked" ||
        firebaseError.code === "auth/web-storage-unsupported"
      ) {
        // Popup blocked — fall back to redirect
        setError("Popup blocked. Redirecting to Google...");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: unknown) {
          console.error("Redirect sign-in error:", redirectErr);
          setError("Google sign-in failed. Please allow popups or try a different browser.");
        }
      } else if (firebaseError.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.");
      } else {
        setError(`Google sign-in failed: ${firebaseError.message || "Unknown error"}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#faf5f5" }}>
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            RACE COMPUTER
          </h1>
        </div>
        <p className="text-center text-xs text-gray-400 mb-6 tracking-wider uppercase">
          Admin Access Panel
        </p>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: "#dc2626" }} />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="text-red-500 text-xs mt-3 text-center break-words">
            ✕ {error}
          </div>
        )}
        {!error && <div className="min-h-4" />}

        {/* Back to Website */}
        <div className="mt-4">
          <a href="/" className="block">
            <button className="w-full py-2.5 bg-transparent border border-gray-200 text-gray-500 rounded-lg text-xs font-medium cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
            </button>
          </a>
        </div>

        {/* ── AQERIONX Logo Tag — 7 taps → /mastermonu ── */}
        <div
          onClick={handleAqerionxTap}
          className="mt-5 pt-4 border-t border-gray-100 text-center cursor-default select-none"
          style={{ touchAction: "manipulation" }}
        >
          <span
            className="text-lg font-black tracking-widest inline-block opacity-30 transition-opacity hover:opacity-50"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              background: "linear-gradient(135deg, #7b2fff, #00f5ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AQERIONX
          </span>
        </div>
      </div>
    </div>
  );
}
