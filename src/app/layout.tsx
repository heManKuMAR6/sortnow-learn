import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Backdrop } from "@/components/Backdrop";
import { DailyCheckIn } from "@/components/DailyCheckIn";
import { NewsletterPrompt } from "@/components/NewsletterPrompt";
import { ToastHost } from "@/components/ToastHost";
import { PageEnter } from "@/components/PageEnter";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Tracker } from "@/components/Tracker";
import { getCurrentProfile } from "@/lib/current-profile";
import { isSupabaseConfigured } from "@/lib/env";
import { liveStreak, utcToday } from "@/lib/platform/dates";
import { getCurrentUser } from "@/lib/session";
import { SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "sortNow Learn",
    template: "%s · sortNow Learn",
  },
  description: "Short video lessons, plain-English notes, and a coach you can ask while you watch. From sortNow & Company.",
  openGraph: {
    type: "website",
    siteName: "sortNow Learn",
    title: "sortNow Learn",
    description: "Short video lessons, plain-English notes, and a coach you can ask while you watch.",
    url: SITE_URL,
  },
  twitter: { card: "summary" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile(user);

  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Backdrop />
        <ScrollProgress />
        <SiteHeader
          limbo={user && !profile ? user.mode : undefined}
          profile={
            profile && user
              ? {
                  displayName: profile.displayName,
                  handle: profile.handle,
                  avatarUrl: profile.avatarUrl,
                  mode: user.mode,
                  points: profile.points,
                  streak: liveStreak(profile, utcToday()),
                }
              : null
          }
        />
        <ToastHost />
        {user ? <DailyCheckIn userId={user.id} /> : null}
        <NewsletterPrompt signedIn={Boolean(user)} />
        <div className="page-scroll">
          <Tracker signedIn={Boolean(user)} />
          <PageEnter>
            <main id="main" className="container-learn py-10">
              {children}
            </main>
          </PageEnter>
          <SiteFooter preview={!isSupabaseConfigured()} />
        </div>
      </body>
    </html>
  );
}
