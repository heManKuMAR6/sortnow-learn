import { AiIcon } from "@/components/AiIcon";
import type { IconName } from "@/lib/challenges";

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "teal",
}: {
  icon: IconName;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "teal" | "coral" | "sun" | "mint";
}) {
  return (
    <div className="card stat-card p-5">
      <span className={`stat-icon tone-${tone}`}>
        <AiIcon name={icon} size={20} />
      </span>
      <p className="mt-4 font-heading text-4xl font-light text-teal">{value}</p>
      <p className="mt-1 text-sm font-medium text-ink">{label}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
