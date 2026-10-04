import Link from "next/link";
import { PuzzleMark } from "@/components/PuzzleMark";

/** Shown to a signed-in person when their profile cannot load (for example, the database is not set up yet). */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="flex justify-center">
        <PuzzleMark size={72} />
      </div>
      <h1 className="mt-5 text-4xl">
        Almost ready<span className="dot">.</span>
      </h1>
      <p className="mt-3 text-secondary">
        Your account works, but your profile space is still being set up. Please check back in a little while.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/learn" className="pill-teal">
          Keep learning
        </Link>
        <Link href="/challenges" className="pill-white">
          Try a challenge
        </Link>
      </div>
      <p className="mt-6 text-xs text-muted">
        Running the site? Open <Link href="/status" className="text-link">/status</Link> to see what is missing.
      </p>
    </div>
  );
}
