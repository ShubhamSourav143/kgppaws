"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  firefly: boolean;
}

/**
 * Lightweight canvas particle layer: drifting dust motes with a few warm
 * fireflies. Runs only while on screen and the tab is visible; renders
 * nothing at all for reduced-motion users.
 */
export function ParticleField({
  count = 46,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      particles = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: i % 9 === 0 ? 2.2 + Math.random() * 1.6 : 0.8 + Math.random() * 1.4,
        vx: -0.08 + Math.random() * 0.16,
        vy: -0.05 - Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
        firefly: i % 9 === 0,
      }));
    };

    const tick = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx + Math.sin(t / 2400 + p.phase) * 0.12;
        p.y += p.vy;
        if (p.y < -8) { p.y = height + 8; p.x = Math.random() * width; }
        if (p.x < -8) p.x = width + 8;
        if (p.x > width + 8) p.x = -8;

        const twinkle = 0.5 + 0.5 * Math.sin(t / 900 * p.speed + p.phase);
        if (p.firefly) {
          ctx.beginPath();
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          glow.addColorStop(0, `rgba(245, 163, 91, ${0.55 * twinkle})`);
          glow.addColorStop(1, "rgba(245, 163, 91, 0)");
          ctx.fillStyle = glow;
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = p.firefly
          ? `rgba(253, 251, 246, ${0.75 * twinkle})`
          : `rgba(253, 251, 246, ${0.32 * twinkle})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    seed();

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const ro = new ResizeObserver(() => {
      resize();
      seed();
    });
    ro.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
