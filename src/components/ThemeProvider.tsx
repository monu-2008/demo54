"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

interface ThemeSettings {
  themeColor?: string;
  themeBlue?: string;
  themePurple?: string;
  bgAnimation?: string;
  siteMode?: string;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>({});

  useEffect(() => {
    const unsub = onValue(ref(db, "settings/site"), (snap) => {
      if (snap.exists()) {
        const data = snap.val() as ThemeSettings;
        setSettings(data);
      }
    });
    return () => { unsub(); };
  }, []);

  // Apply theme colors as CSS custom properties on the root element
  useEffect(() => {
    const root = document.documentElement;

    // Primary color (cyan in admin) → used for main accents
    const primary = settings.themeColor || "#0055ff";
    root.style.setProperty("--theme-primary", primary);

    // Secondary color (blue in admin) → used for gradients, hover states
    const secondary = settings.themeBlue || "#7c3aff";
    root.style.setProperty("--theme-secondary", secondary);

    // Accent color (purple in admin) → used for highlights
    const accent = settings.themePurple || "#ff3d00";
    root.style.setProperty("--theme-accent", accent);

    // Derived colors with opacity for backgrounds
    root.style.setProperty("--theme-primary-10", `${primary}1a`);
    root.style.setProperty("--theme-primary-20", `${primary}33`);
    root.style.setProperty("--theme-secondary-10", `${secondary}1a`);
    root.style.setProperty("--theme-accent-10", `${accent}1a`);

    // Gradient
    root.style.setProperty("--theme-gradient", `linear-gradient(135deg, ${primary}, ${secondary})`);
    root.style.setProperty("--theme-gradient-h", `linear-gradient(90deg, ${primary}, ${secondary}, ${accent}, ${primary})`);
    root.style.setProperty("--theme-gradient-r", `linear-gradient(to right, ${primary}, ${secondary})`);
  }, [settings]);

  return <>{children}</>;
}
