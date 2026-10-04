import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";
import { getCurrentProfile } from "@/lib/current-profile";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Edit profile" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  const profile = await getCurrentProfile(user);
  if (!profile) redirect("/login?next=/settings");
  const portfolio = await getStore().portfolio(user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Settings</p>
      <h1 className="mt-2 text-5xl">
        Your profile<span className="dot">.</span>
      </h1>
      <p className="mt-3 text-secondary">
        This is how other people see you.{" "}
        <Link href={`/u/${profile.handle}`} className="text-link">
          View my profile
        </Link>
      </p>
      <SettingsForm profile={profile} portfolio={portfolio} />
    </div>
  );
}
