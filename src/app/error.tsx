"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <h1 className="text-4xl">That did not load</h1>
      <p className="mt-3 text-secondary">Something went wrong on our side. Try again, and if it keeps happening, email hello@sortnow.co.</p>
      <button type="button" onClick={reset} className="pill-teal mt-6">
        Try again
      </button>
    </div>
  );
}
