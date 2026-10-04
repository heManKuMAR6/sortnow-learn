"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#1F6F8B", "#8FDDE7", "#FF6F61", "#FFD166", "#B7B3F2"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
};

export function Backdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let stopped = false;

    const seed = () => {
      const count = Math.min(32, Math.max(10, Math.floor((width * height) / 62000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.5 + 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (!reduce) {
        for (const particle of particles) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < 0 || particle.x > width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        }
      }
      const reach = 108;
      for (let i = 0; i < particles.length; i += 1) {
        const a = particles[i];
        if (!a) continue;
        for (let j = i + 1; j < particles.length; j += 1) {
          const b = particles[j];
          if (!b) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < reach) {
            ctx.strokeStyle = `rgba(31, 111, 139, ${(1 - dist / reach) * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const particle of particles) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      if (stopped) return;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (reduce || stopped) return;
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(loop);
      document.addEventListener("visibilitychange", onVisibility);
    }
    window.addEventListener("resize", resize);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div className="wash absolute inset-0" />
      <canvas ref={canvasRef} className="particle-field absolute inset-0 h-full w-full" />
    </div>
  );
}
