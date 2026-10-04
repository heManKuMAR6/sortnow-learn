"use client";

import { motion, useReducedMotion } from "framer-motion";

// Each strand starts tangled and settles into a straight line, then the
// whole loop replays. Same idea as the company hero: chaos in, order out.
const strands = [
  { tangled: "M0 60 C 60 0, 90 120, 150 60 S 240 0, 300 60", straight: "M0 60 H 300", color: "#1F6F8B" },
  { tangled: "M0 90 C 70 150, 100 30, 160 90 S 250 150, 300 90", straight: "M0 90 H 300", color: "#8FDDE7" },
  { tangled: "M0 120 C 50 60, 110 180, 170 120 S 260 60, 300 120", straight: "M0 120 H 300", color: "#FF6F61" },
  { tangled: "M0 150 C 80 210, 80 90, 150 150 S 230 210, 300 150", straight: "M0 150 H 300", color: "#FFD166" },
  { tangled: "M0 30 C 40 90, 120 -30, 170 30 S 270 90, 300 30", straight: "M0 30 H 300", color: "#B7B3F2" },
];

export function UntangleArt() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="-10 -20 320 220" className="h-auto w-full" role="img" aria-label="Tangled lines straightening out">
      {strands.map((s, i) => (
        <motion.path
          key={s.color}
          d={reduce ? s.straight : s.tangled}
          fill="none"
          stroke={s.color}
          strokeWidth={3.5}
          strokeLinecap="round"
          animate={reduce ? undefined : { d: [s.tangled, s.tangled, s.straight, s.straight, s.tangled] }}
          transition={{
            duration: 9,
            times: [0, 0.12, 0.45, 0.8, 1],
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.12,
          }}
        />
      ))}
      <motion.circle
        cx={300}
        cy={90}
        r={7}
        fill="#FF6F61"
        animate={reduce ? undefined : { scale: [1, 1.5, 1], opacity: [0.9, 0.5, 0.9] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </svg>
  );
}
