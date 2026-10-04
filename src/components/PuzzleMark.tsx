"use client";

import { motion, useReducedMotion } from "framer-motion";

// The sortNow Learn mark: three puzzle pieces that build a staircase, the top
// one clicking into place, then a spark. Solve the puzzle, get ahead.
// The static version of the same drawing is src/app/icon.svg (the favicon).
const A = "M0 0H17V5.5a4 4 0 1 1 0 6V17H0Z";
const B = "M0 0H5.5a4 4 0 1 1 6 0H17V17H0V11.5a4 4 0 1 0 0-6Z";
const C = "M0 0H17V17H11.5a4 4 0 1 0-6 0H0Z";

export function PuzzleMark({ size = 40, animate = true }: { size?: number; animate?: boolean }) {
  const reduce = useReducedMotion();
  const live = animate && !reduce;
  const loop = { duration: 5.2, repeat: Infinity, ease: [0.16, 1, 0.3, 1] as const };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="sortNow Learn" className="puzzle-mark">
      <defs>
        <linearGradient id="pm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A8CAE" />
          <stop offset="1" stopColor="#1B607A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#pm-bg)" />
      <g strokeLinejoin="round" strokeWidth="3">
        <g transform="translate(13 34)">
          <motion.path
            d={A}
            fill="#8FDDE7"
            stroke="#8FDDE7"
            animate={live ? { x: [-5, 0, 0, 0], opacity: [0, 1, 1, 1] } : undefined}
            transition={{ ...loop, times: [0, 0.12, 0.9, 1] }}
          />
        </g>
        <g transform="translate(34 34)">
          <motion.path
            d={B}
            fill="#FF6F61"
            stroke="#FF6F61"
            animate={live ? { x: [5, 0, 0, 0], opacity: [0, 1, 1, 1] } : undefined}
            transition={{ ...loop, times: [0, 0.18, 0.9, 1] }}
          />
        </g>
        <g transform="translate(34 13)">
          <motion.path
            d={C}
            fill="#FFD166"
            stroke="#FFD166"
            animate={live ? { y: [-14, -14, 0, -1.5, 0, 0], opacity: [0, 1, 1, 1, 1, 1] } : undefined}
            transition={{ ...loop, times: [0, 0.2, 0.34, 0.4, 0.46, 1] }}
          />
        </g>
      </g>
      <motion.path
        d="M21.5 14.5 L23.2 19.8 L28.5 21.5 L23.2 23.2 L21.5 28.5 L19.8 23.2 L14.5 21.5 L19.8 19.8Z"
        fill="#fff"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={live ? { scale: [0, 0, 1.25, 1, 1, 0], rotate: [0, 0, 20, 0, 0, 0], opacity: [0, 0, 1, 1, 1, 0] } : undefined}
        transition={{ ...loop, times: [0, 0.4, 0.5, 0.58, 0.9, 1] }}
      />
    </svg>
  );
}

/** Mark + the two-line wordmark, styled like the sortNow & Company logo. */
export function Brand({ size = 44 }: { size?: number }) {
  return (
    <span className="brand-lockup">
      <PuzzleMark size={size} />
      <span className="logo-text">
        <span className="logo-line-1">sortNow</span>
        <span className="logo-line-2">
          Learn<span className="dot">.</span>
        </span>
      </span>
    </span>
  );
}
