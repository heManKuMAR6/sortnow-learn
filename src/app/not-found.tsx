import Link from "next/link";
import { LearningMark } from "@/components/LearningMark";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="flex justify-center">
        <LearningMark size="hero" />
      </div>
      <h1 className="mt-4 text-5xl">
        Still looking<span className="dot">.</span>
      </h1>
      <p className="mt-3 text-secondary">That page is not on sortNow Learn. Here is where most people start.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/learn" data-track="not-found-lessons" className="pill-teal">
          Browse lessons
        </Link>
        <Link href="/" data-track="not-found-home" className="pill-white">
          Back home
        </Link>
      </div>
    </div>
  );
}
