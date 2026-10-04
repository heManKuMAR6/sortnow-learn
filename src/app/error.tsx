"use client";

import Link from "next/link";
import { PuzzleMark } from "@/components/PuzzleMark";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="flex justify-center">
        <PuzzleMark size={88} />
      </div>
      <h1 className="mt-6 text-5xl">
        A piece went missing<span className="dot">.</span>
      </h1>
      <p className="mt-3 text-secondary">
        That page hit a snag on our side. Nothing you did. Try again, or head somewhere that works while we fix it.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="pill-teal pill-lg">
          Try again
        </button>
        <Link href="/learn" className="pill-white pill-lg">
          Browse lessons
        </Link>
        <Link href="/challenges" className="pill-white pill-lg">
          Try a challenge
        </Link>
      </div>
      <p className="mt-6 text-xs text-muted">Still stuck? Email hello@sortnow.co</p>
    </div>
  );
}
