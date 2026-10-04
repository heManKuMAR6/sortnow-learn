import type { IconName } from "@/lib/challenges";

// Small line icons for points, streaks, badges and challenges. currentColor.
const paths: Record<IconName, React.ReactNode> = {
  spark: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />,
  prompt: (
    <>
      <path d="M4 5h16v11H9l-5 4V5z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </>
  ),
  puzzle: <path d="M9 4h3v2a2 2 0 104 0V4h3v5h-2a2 2 0 100 4h2v7H9v-2a2 2 0 10-4 0v2H4V9h5V4z" transform="translate(0 -0.5)" />,
  eye: (
    <>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />
    </>
  ),
  flame: <path d="M12 3c.5 3-1.5 4.5-3 6.5-1.3 1.7-2 3.200-2 5A5 5 0 0017 14.500c0-2-1-3.200-2-4.500.3 1.500-.3 2.300-1 2.500.5-3-.5-6.500-2-9.500z" transform="translate(0 1)" />,
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 01-8 0V4z" />
      <path d="M8 6H4v1.500A3.500 3.500 0 007.500 11M16 6h4v1.500A3.500 3.500 0 0116.500 11M12 13v4M8.500 20h7M10 17h4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.500" />
    </>
  ),
};

export function AiIcon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.700"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
