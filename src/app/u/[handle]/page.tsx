import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiIcon } from "@/components/AiIcon";
import { Avatar } from "@/components/Avatar";
import { BadgeGrid } from "@/components/BadgeGrid";
import { Heatmap } from "@/components/Heatmap";
import { Reveal } from "@/components/Reveal";
import { badgesFor } from "@/lib/badges";
import { challenges } from "@/lib/challenges";
import { lessons } from "@/lib/content";
import { formatDay } from "@/lib/format";
import { liveStreak, utcToday } from "@/lib/platform/dates";
import { getStore } from "@/lib/platform/store";
import { getCurrentUser } from "@/lib/session";

type Params = { handle: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getStore().getProfileByHandle(handle).catch(() => null);
  if (!profile) return { title: "Profile" };
  return {
    title: profile.displayName,
    description: profile.headline || `${profile.displayName} is learning AI on sortNow Learn.`,
  };
}

const linkLabels = { linkedin: "LinkedIn", github: "GitHub", website: "Website" } as const;

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="px-4 py-3 text-center">
      <p className="font-heading text-3xl font-light text-teal">{value}</p>
      <p className="text-xs font-medium text-ink">{label}</p>
      {hint ? <p className="text-[0.7rem] text-muted">{hint}</p> : null}
    </div>
  );
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { handle } = await params;
  const store = getStore();
  const profile = await store.getProfileByHandle(handle);
  if (!profile) notFound();

  const [activity, portfolio, viewer] = await Promise.all([
    store.activity(profile.id),
    store.portfolio(profile.id),
    getCurrentUser(),
  ]);
  const isOwner = viewer?.id === profile.id;
  const today = utcToday();
  const badges = badgesFor({
    longestStreak: profile.longestStreak,
    challengesDone: profile.challengesDone,
    lessonsDone: profile.lessonsDone,
    portfolioCount: portfolio.length,
    hasBio: profile.bio.trim().length > 0,
  });
  const links = (Object.keys(linkLabels) as (keyof typeof linkLabels)[]).filter((k) => profile.links[k]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[19rem_1fr]">
      <Reveal className="lg:sticky lg:top-24">
        <aside className="glass p-6">
          <div className="flex justify-center">
            <Avatar name={profile.displayName} seed={profile.handle} src={profile.avatarUrl} size={120} />
          </div>
          <h1 className="mt-4 text-center text-3xl">{profile.displayName}</h1>
          <p className="text-center text-sm text-muted">@{profile.handle}</p>
          {profile.headline ? <p className="mt-3 text-center text-secondary">{profile.headline}</p> : null}
          {isOwner ? (
            <Link href="/settings" data-track="profile-edit" className="pill-teal mt-5 w-full text-sm">
              Edit profile
            </Link>
          ) : null}
          <dl className="mt-5 grid gap-2 text-sm">
            {profile.location ? (
              <div className="flex items-center gap-2 text-secondary">
                <span aria-hidden="true">📍</span> {profile.location}
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-secondary">
              <AiIcon name="compass" size={16} /> Joined {formatDay(profile.createdAt.slice(0, 10))}
            </div>
          </dl>
          {links.length ? (
            <ul className="mt-4 grid gap-2 border-t border-black/5 pt-4 text-sm">
              {links.map((key) => (
                <li key={key}>
                  <a href={profile.links[key]} target="_blank" rel="noopener noreferrer nofollow" className="text-link" data-track={`profile-link-${key}`}>
                    {linkLabels[key]} ↗
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {profile.skills.length ? (
            <div className="mt-4 border-t border-black/5 pt-4">
              <p className="eyebrow mb-2">Skills</p>
              <ul className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <li key={skill} className="chip chip-mint">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </Reveal>

      <div className="grid min-w-0 gap-6">
        <Reveal>
          <section className="glass grid grid-cols-2 divide-black/5 sm:grid-cols-5 sm:divide-x">
            <Stat label="Points" value={profile.points} />
            <Stat label="Day streak" value={liveStreak(profile, today)} hint={`Best ${profile.longestStreak}`} />
            <Stat label="Challenges" value={`${profile.challengesDone}/${challenges.length}`} />
            <Stat label="Lessons" value={`${profile.lessonsDone}/${lessons.length}`} />
            <Stat label="Badges" value={badges.filter((b) => b.earned).length} hint={`of ${badges.length}`} />
          </section>
        </Reveal>

        {profile.bio ? (
          <Reveal>
            <section className="glass p-6">
              <h2 className="text-3xl">About</h2>
              <p className="mt-3 whitespace-pre-line text-ink">{profile.bio}</p>
            </section>
          </Reveal>
        ) : isOwner ? (
          <Reveal>
            <section className="card p-6">
              <h2 className="text-2xl">Tell people about yourself</h2>
              <p className="mt-1 text-secondary">Your career, your work, the skills you are building.</p>
              <Link href="/settings" className="pill-white mt-4 text-sm">
                Write your bio
              </Link>
            </section>
          </Reveal>
        ) : null}

        <Reveal>
          <section className="glass p-6">
            <h2 className="text-3xl">Portfolio</h2>
            {portfolio.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {portfolio.map((item) => (
                  <article key={item.id} className="card p-5">
                    <h3 className="text-xl">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="card-link" data-track="portfolio-open">
                          {item.title} ↗
                        </a>
                      ) : (
                        item.title
                      )}
                    </h3>
                    {item.description ? <p className="mt-2 text-sm text-secondary">{item.description}</p> : null}
                    {item.tags.length ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {item.tags.map((t) => (
                          <li key={t} className="chip chip-sun">
                            {t}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-secondary">
                {isOwner ? "Nothing here yet. Add a prompt library, a write-up, or a project you built." : "No portfolio pieces yet."}
              </p>
            )}
            {isOwner ? (
              <Link href="/settings#portfolio" className="pill-white mt-5 text-sm" data-track="profile-add-portfolio">
                {portfolio.length ? "Manage portfolio" : "Add a piece"}
              </Link>
            ) : null}
          </section>
        </Reveal>

        <Reveal>
          <section className="glass p-6">
            <h2 className="text-3xl">Activity</h2>
            <div className="mt-5">
              <Heatmap activity={activity} today={today} />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="glass p-6">
            <h2 className="text-3xl">Badges</h2>
            <div className="mt-5">
              <BadgeGrid badges={badges} />
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
