import { AiIcon } from "@/components/AiIcon";
import type { Badge } from "@/lib/badges";

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <ul className="badge-grid">
      {badges.map((b) => (
        <li key={b.id} className={`badge${b.earned ? " earned" : ""}`} title={b.earned ? b.label : `Locked: ${b.hint}`}>
          <span className="badge-icon">
            <AiIcon name={b.icon} size={22} />
          </span>
          <span className="badge-label">{b.label}</span>
          <span className="badge-hint">{b.earned ? "Earned" : b.hint}</span>
        </li>
      ))}
    </ul>
  );
}
