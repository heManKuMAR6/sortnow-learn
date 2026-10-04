import { initials } from "@/lib/platform/handle";

const GRADIENTS = [
  "linear-gradient(135deg,#1F6F8B,#8FDDE7)",
  "linear-gradient(135deg,#FF6F61,#FFD166)",
  "linear-gradient(135deg,#6C63C7,#B7B3F2)",
  "linear-gradient(135deg,#2A8CAE,#FFD166)",
  "linear-gradient(135deg,#E0566B,#FF9F80)",
];

function pick(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/** A picture if they set one, otherwise their initials (HK for Hemanth Kumar). */
export function Avatar({
  name,
  seed,
  src,
  size = 40,
}: {
  name: string;
  seed: string;
  src: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="avatar" style={style} />;
  }
  return (
    <span className="avatar avatar-initials" style={{ ...style, background: pick(seed) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
