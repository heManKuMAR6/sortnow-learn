import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { PuzzleMark } from "@/components/PuzzleMark";

/** Shown instead of the notes until the visitor leaves their details or signs in. Nothing of the notes is in this HTML. */
export function NotesGate({ next }: { next: string }) {
  return (
    <div className="mx-auto grid max-w-4xl items-start gap-8 md:grid-cols-[1.1fr_1fr]">
      <div>
        <PuzzleMark size={64} />
        <p className="eyebrow mt-5">Notes</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Plain-English notes, free</h1>
        <p className="mt-4 text-lg text-secondary">
          Short notes on how AI really works, written so you can use them today. Tell us who you are and they open right here.
        </p>
        <p className="mt-6 text-secondary">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-link" data-track="notes-gate-login">
            Sign in
          </Link>
          .
        </p>
      </div>
      <div className="glass p-6 sm:p-7 md:sticky md:top-24">
        <h2 className="text-3xl">Unlock the notes</h2>
        <p className="mt-1 mb-5 text-secondary">Name, email and phone. No account needed.</p>
        <LeadForm cta="Unlock the notes" />
      </div>
    </div>
  );
}
