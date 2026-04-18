"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/lib/store";

/**
 * AuthSync - Firebase Auth state ko Zustand store ke sath sync rakhta hai
 * 
 * Problem: Zustand persist localStorage me save karta hai, lekin agar
 * Firebase Auth session expire ho jaye (ya dusre device se sign out kare)
 * toh Zustand me abhi bhi logged in dikha sakta hai.
 * 
 * Solution: Ye component Firebase Auth state monitor karta hai aur
 * agar Firebase me user nahi hai toh Zustand se bhi logout kar deta hai.
 */
export default function AuthSync() {
  const { adminLoggedIn, adminType, staffLoggedIn, staffUser, adminLogout, staffLogout } = useAppStore();

  useEffect(() => {
    // Monitor Firebase Auth state for admin
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (adminLoggedIn && adminType !== "none") {
        // Agar Zustand me admin logged in hai lekin Firebase me nahi hai
        if (!firebaseUser) {
          console.log("[AuthSync] Firebase auth session expired, logging out admin");
          adminLogout();
        } else {
          // Agar Firebase me user hai, verify email is still authorized
          const email = firebaseUser.email?.toLowerCase() || "";
          const allowedEmails = ["racecomputer16000@gmail.com", "manmohansharma002008@gmail.com"];
          if (!allowedEmails.includes(email) && adminType === "admin") {
            console.log("[AuthSync] Admin email no longer authorized, logging out");
            adminLogout();
          }
        }
      }
    });

    return unsubscribe;
  }, [adminLoggedIn, adminType, adminLogout]);

  // Verify staff account is still active in Firebase on refresh
  useEffect(() => {
    if (staffLoggedIn && staffUser) {
      const verifyStaff = async () => {
        try {
          const staffRef = ref(db, `staff/${staffUser.id}`);
          const snapshot = await get(staffRef);
          if (!snapshot.exists()) {
            console.log("[AuthSync] Staff account no longer exists, logging out");
            staffLogout();
          } else {
            const data = snapshot.val();
            if (!data.active) {
              console.log("[AuthSync] Staff account disabled, logging out");
              staffLogout();
            }
          }
        } catch (err) {
          console.warn("[AuthSync] Could not verify staff account:", err);
        }
      };
      verifyStaff();
    }
  }, []); // Only on mount (page refresh)

  return null; // This component renders nothing
}
