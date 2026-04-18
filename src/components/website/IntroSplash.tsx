"use client";

import { useState, useEffect, useRef } from "react";

const BOOT_LINES = [
  "INITIALIZING RACE COMPUTER SYSTEM...",
  "LOADING PREMIUM MODULES... OK",
  "CONNECTING TO FIREBASE... ONLINE",
  "ASUS AUTHORIZATION... VERIFIED",
  "SERVICE PROTOCOLS... ACTIVE",
  "SYSTEM READY.",
];

export default function IntroSplash({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [fadingOut, setFadingOut] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasCompletedRef = useRef(false);

  const finishSplash = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setProgress(100);
    setTimeout(() => setFadingOut(true), 300);
    setTimeout(() => onCompleteRef.current(), 900);
  };

  useEffect(() => {
    // Simple interval-based progress — more reliable than rAF for splash
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 2 + Math.random() * 3;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
        finishSplash();
        return;
      }
      setProgress(Math.min(currentProgress, 99));
    }, 100);

    // Boot lines on a timer
    let lineIdx = 0;
    const bootInterval = setInterval(() => {
      if (lineIdx < BOOT_LINES.length) {
        setBootLines((prev) => [...prev, BOOT_LINES[lineIdx]]);
        lineIdx++;
      } else {
        clearInterval(bootInterval);
      }
    }, 500);

    // Safety: force complete after 5 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      finishSplash();
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(bootInterval);
      clearTimeout(safetyTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(145deg, #f0f4ff 0%, #e8ecff 40%, #f4f0ff 100%)",
        animation: fadingOut ? "introFadeOut 0.9s cubic-bezier(0.23,1,0.32,1) forwards" : "none",
        transition: "opacity 0.9s",
      }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-55deg, transparent, transparent 60px, rgba(0,85,255,0.03) 60px, rgba(0,85,255,0.03) 61px)",
          animation: "introGridDrift 8s linear infinite",
        }}
      />

      {/* Beam sweep */}
      <div
        className="absolute left-0 right-0 h-px top-0"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,85,255,0.6), rgba(124,58,255,0.4), transparent)",
          boxShadow: "0 0 20px rgba(0,85,255,0.25)",
          animation: "introBeam 3s cubic-bezier(0.4,0,0.2,1) infinite",
          pointerEvents: "none",
        }}
      />

      {/* Corner brackets */}
      {[
        { top: 20, left: 20, borderTop: "2px solid #0055ff", borderLeft: "2px solid #0055ff", borderRadius: "2px 0 0 0" },
        { top: 20, right: 20, borderTop: "2px solid #0055ff", borderRight: "2px solid #0055ff", borderRadius: "0 2px 0 0" },
        { bottom: 20, left: 20, borderBottom: "2px solid #0055ff", borderLeft: "2px solid #0055ff", borderRadius: "0 0 0 2px" },
        { bottom: 20, right: 20, borderBottom: "2px solid #0055ff", borderRight: "2px solid #0055ff", borderRadius: "0 0 2px 0" },
      ].map((corner, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            ...corner,
            width: 40,
            height: 40,
            pointerEvents: "none",
          } as React.CSSProperties}
        />
      ))}

      {/* Center content */}
      <div className="relative z-10 text-center px-4 max-w-[860px] w-[92vw] flex flex-col items-center">
        {/* Sub text */}
        <div
          className="font-mono text-[clamp(0.42rem,2.5vw,0.62rem)] tracking-[6px] mb-5"
          style={{ color: "rgba(0,85,255,0.45)", animation: "fadeUp 0.7s 0.2s both" }}
        >
          NEXT-GEN TECH HUB — JAIPUR
        </div>

        {/* Logo text */}
        <div
          className="font-extrabold whitespace-nowrap inline-block max-w-[90vw]"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(1.4rem, 6vw, 3.8rem)",
            letterSpacing: "clamp(1px, 0.5vw, 4px)",
            background: "linear-gradient(135deg, #080f2e 0%, #0055ff 50%, #7c3aff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.15,
            filter: "drop-shadow(0 2px 24px rgba(0,85,255,0.15))",
            animation: "fadeUp 0.8s 0.3s both",
          }}
        >
          RACE COMPUTER
        </div>

        {/* Tag */}
        <div
          className="font-mono text-[clamp(0.45rem,2vw,0.62rem)] tracking-[4px] mt-3"
          style={{ color: "#7a82aa", animation: "fadeUp 0.7s 0.5s both" }}
        >
          COMPUTE · CONNECT · CONQUER
        </div>

        {/* Status dots */}
        <div
          className="flex justify-center gap-4 mt-5 flex-wrap"
          style={{ animation: "fadeUp 0.7s 0.6s both" }}
        >
          {["SYSTEMS ONLINE", "SERVICES ACTIVE", "ASUS VERIFIED"].map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 font-mono text-[0.5rem] tracking-[1.5px] px-3 py-1.5 rounded-full"
              style={{ color: "rgba(0,85,255,0.55)", background: "rgba(0,85,255,0.05)", border: "1px solid rgba(0,85,255,0.1)" }}
            >
              <span
                className="w-[5px] h-[5px] rounded-full"
                style={{ background: "#0055ff", boxShadow: "0 0 8px rgba(0,85,255,0.5)" }}
              />
              {label}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full mt-7">
          <div className="flex justify-between font-mono text-[0.52rem] tracking-[3px] mb-2" style={{ color: "#0055ff" }}>
            <span>LOADING</span>
            <span>{Math.min(Math.round(progress), 100)}%</span>
          </div>
          <div
            className="h-[2px] rounded-sm overflow-hidden"
            style={{ background: "rgba(0,85,255,0.08)" }}
          >
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #003acc, #0055ff, #7c3aff)",
                backgroundSize: "200% 100%",
              }}
            />
          </div>
        </div>

        {/* Boot log */}
        <div className="mt-4 font-mono text-[0.48rem] tracking-[1px] leading-[2.2] min-h-[4em] text-left overflow-hidden" style={{ color: "rgba(0,85,255,0.4)" }}>
          {bootLines.map((line, i) => (
            <div key={i} style={{ color: i === bootLines.length - 1 ? "rgba(0,160,80,0.65)" : undefined }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
