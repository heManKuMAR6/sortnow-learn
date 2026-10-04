import type { ReactNode } from "react";
import { AiIcon } from "@/components/AiIcon";
import { PuzzleMark } from "@/components/PuzzleMark";
import { Reveal } from "@/components/Reveal";

const perks = [
  { icon: "flame", text: "Build a daily streak and earn points" },
  { icon: "puzzle", text: "Solve short AI challenges" },
  { icon: "trophy", text: "Show your progress on a public profile" },
] as const;

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-4xl items-center gap-10 py-4 md:grid-cols-[1fr_1.05fr]">
      <Reveal className="hidden md:block">
        <PuzzleMark size={72} />
        <h2 className="mt-6 text-4xl">
          Solve the puzzle. Get ahead<span className="dot">.</span>
        </h2>
        <ul className="mt-6 grid gap-3">
          {perks.map((perk) => (
            <li key={perk.text} className="flex items-center gap-3 text-secondary">
              <span className="perk-icon">
                <AiIcon name={perk.icon} size={18} />
              </span>
              {perk.text}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="glass p-6 sm:p-8">
          <h1 className="text-4xl">{title}</h1>
          <p className="mt-2 text-secondary">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-6 text-sm">{footer}</div>
        </div>
      </Reveal>
    </div>
  );
}
