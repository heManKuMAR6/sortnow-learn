import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-4xl font-semibold">Not found</h1>
      <p className="mt-3 text-secondary">That page is not on sortNow Learn.</p>
      <p className="mt-6">
        <Link href="/" data-track="not-found-home" className="pill-teal text-sm">
          Back to notes
        </Link>
      </p>
    </div>
  );
}
