export function LearningMark({ size = "header" }: { size?: "header" | "hero" }) {
  return (
    <svg
      className={size === "hero" ? "learning-mark learning-mark-hero" : "learning-mark"}
      viewBox="0 0 72 40"
      aria-hidden="true"
    >
      <g className="walker">
        <circle cx="16" cy="11" r="4" fill="#1F6F8B" />
        <path d="M16 15.5 V25" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 18.5 L9 23" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 18.5 L23 22" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
        <g className="leg leg-a">
          <path d="M16 25 L10 35" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="leg leg-b">
          <path d="M16 25 L22 35" stroke="#1D1D1F" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
      <g className="book">
        <path d="M46 18 H57 L59 30 H46 Z" fill="#FFD166" />
        <path d="M59 18 H70 L68 30 H59 Z" fill="#8FDDE7" />
        <path d="M59 17 V31" stroke="#1F6F8B" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="64" cy="12" r="2.2" fill="#FFD166" />
      </g>
    </svg>
  );
}
