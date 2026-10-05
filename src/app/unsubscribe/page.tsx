import type { Metadata } from "next";
import Link from "next/link";
import { UnsubscribeButton } from "@/components/UnsubscribeButton";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-4xl">Unsubscribe</h1>
      {token ? (
        <>
          <p className="mt-3 text-secondary">Stop the weekly newsletter for the email address this link was sent to?</p>
          <div className="mt-6">
            <UnsubscribeButton token={token} />
          </div>
        </>
      ) : (
        <p className="mt-3 text-secondary">
          This link is missing its code. Use the unsubscribe link at the bottom of any newsletter, or email{" "}
          <a className="text-link" href="mailto:hello@sortnow.co">hello@sortnow.co</a> and we will remove you.
        </p>
      )}
      <p className="mt-8 text-sm text-muted">
        <Link href="/privacy" className="text-link">Privacy notice</Link>
      </p>
    </div>
  );
}
