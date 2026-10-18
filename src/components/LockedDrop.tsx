import { AiIcon } from "@/components/AiIcon";
import type { IconName } from "@/lib/challenges";
import { GoogleButton } from "@/components/GoogleButton";
import { LeadForm } from "@/components/LeadForm";
import { PuzzleMark } from "@/components/PuzzleMark";
import { GOOGLE_LEAD_CONSENT_TEXT } from "@/lib/consent";
import type { IgPost } from "@/lib/ig-posts";

/** What a visitor sees before they leave their details. None of the drop itself is in this HTML. */
export function LockedDrop({ post }: { post: IgPost }) {
  const promptCount = 1 + (post.prompts?.length ?? 0);
  const inside: { icon: IconName; text: string }[] = [
    ...(post.skillFile ? ([{ icon: "target", text: "The full skill file from the reel, ready to copy" }] as const) : []),
    {
      icon: "prompt",
      text: promptCount === 1 ? "A prompt you can copy and use today" : `${promptCount} prompts you can copy and use today`,
    },
    ...(post.ideas?.length ? ([{ icon: "compass", text: `${post.ideas.length} starter ideas to build next` }] as const) : []),
    { icon: "bulb", text: `${post.notes.length} short notes that make it stick` },
    ...(post.resources?.length
      ? ([{ icon: "target", text: `${post.resources.length} download${post.resources.length === 1 ? "" : "s"} and links` }] as const)
      : ([{ icon: "compass", text: "Where to go next" }] as const)),
  ];

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
      <div className="glass grid gap-4 p-6 sm:p-7 md:sticky md:top-24">
        <div>
          <h2 className="text-3xl">Unlock it, free</h2>
          <p className="mt-1 text-secondary">One tap with Google, or just your email. It opens right here.</p>
        </div>
        <GoogleButton next={`/ig/${post.slug}`} track="ig-unlock-google" consentText={GOOGLE_LEAD_CONSENT_TEXT} asLead />
        <LeadForm cta="Unlock this drop" dividerAbove />
      </div>
    </div>
  );
}
