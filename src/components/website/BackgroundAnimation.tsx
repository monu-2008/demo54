"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

/** Convert hex color (#0055ff) to RGB string ("0, 85, 255") */
function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleaned);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return "59, 130, 246"; // fallback blue
}

export default function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Read theme CSS variables and convert to RGB strings for canvas
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryRgb = hexToRgb(computedStyle.getPropertyValue("--theme-primary").trim());
    const secondaryRgb = hexToRgb(computedStyle.getPropertyValue("--theme-secondary").trim());
    const accentRgb = hexToRgb(computedStyle.getPropertyValue("--theme-accent").trim());

    let animationId: number;
    let particles: Particle[] = [];

    const colors = [
      primaryRgb,       // primary
      accentRgb,        // accent/red
      secondaryRgb,     // secondary/purple
      "6, 182, 212",    // cyan (supplementary)
      "16, 185, 129",   // green (supplementary)
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 3; // Cover full page height
    };

    const createParticles = () => {
      const count = Math.floor((canvas.width * canvas.height) / 25000);
      particles = [];
      for (let i = 0; i < Math.min(count, 80); i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.3 + 0.05,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections using theme primary color
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.08;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${primaryRgb}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.2})`;
        ctx.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
    };

    const animate = () => {
      drawParticles();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
