import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { Backdrop } from "@/components/Backdrop";
import { LeadGate } from "@/components/LeadGate";
import { PageEnter } from "@/components/PageEnter";
import { SiteHeader } from "@/components/SiteHeader";
import { Tracker } from "@/components/Tracker";
import { LEAD_COOKIE } from "@/lib/lead-cookie";
import { getCurrentUser } from "@/lib/session";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://learn.sortnow.co"),
  title: {
    default: "Sortnow Learn",
    template: "%s · Sortnow Learn",
  },
  description: "Short notes and lessons from sortNow.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const jar = await cookies();
  const hasLead = jar.get(LEAD_COOKIE)?.value === "1";

  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased">
        <Backdrop />
        <SiteHeader user={user} />
        {hasLead ? null : <LeadGate />}
        <div className="page-scroll">
          <Tracker signedIn={Boolean(user)} />
          <PageEnter>
            <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
            <footer className="mx-auto max-w-6xl px-5 py-8 text-sm text-secondary">
              <p>
                sortNow Learn. The company site is{" "}
                <a href="https://sortnow.co" data-track="footer-company" className="text-link">
                  sortnow.co
                </a>
                .
              </p>
              <p className="mt-1">
                <a href="mailto:hello@sortnow.co" data-track="footer-email" className="text-link">
                  hello@sortnow.co
                </a>
              </p>
            </footer>
          </PageEnter>
        </div>
      </body>
    </html>
  );
}
