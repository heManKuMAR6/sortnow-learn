import { AiIcon } from "@/components/AiIcon";
import { LeadForm } from "@/components/LeadForm";
import { PuzzleMark } from "@/components/PuzzleMark";
import type { IgPost } from "@/lib/ig-posts";

/** What a visitor sees before they leave their details. None of the drop itself is in this HTML. */
export function LockedDrop({ post }: { post: IgPost }) {
  const inside = [
    { icon: "prompt", text: "A prompt you can copy and use today" },
    { icon: "bulb", text: `${post.notes.length} short notes that make it stick` },
    ...(post.resources?.length
      ? ([{ icon: "target", text: `${post.resources.length} download${post.resources.length === 1 ? "" : "s"} and links` }] as const)
      : ([{ icon: "compass", text: "Where to go next" }] as const)),
  ] as const;

  return (
    <div className="mx-auto grid max-w-4xl items-start gap-8 md:grid-cols-[1.1fr_1fr]">
      <div>
        <PuzzleMark size={64} />
        <p className="eyebrow mt-5">{post.dateLabel}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg text-secondary">{post.explanation}</p>
        <p className="eyebrow mt-8">Inside this drop</p>
        <ul className="mt-3 grid gap-3">
          {inside.map((item) => (
            <li key={item.text} className="flex items-center gap-3">
              <span className="perk-icon">
                <AiIcon name={item.icon} size={18} />
              </span>
              {item.text}
            </li>
          ))}
        </ul>
        <div className="locked-preview mt-8" aria-hidden="true">
          <i style={{ width: "92%" }} />
          <i style={{ width: "78%" }} />
          <i style={{ width: "86%" }} />
          <i style={{ width: "54%" }} />
        </div>
      </div>
      <div className="glass p-6 sm:p-7 md:sticky md:top-24">
        <h2 className="text-3xl">Unlock it, free</h2>
        <p className="mt-1 mb-5 text-secondary">Tell us who you are and it opens right here. No account needed.</p>
        <LeadForm cta="Unlock this drop" />
      </div>
    </div>
  );
}
