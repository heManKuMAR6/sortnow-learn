import Link from "next/link";
import { Brand } from "@/components/PuzzleMark";

export function SiteFooter({ preview = false }: { preview?: boolean }) {
  return (
    <footer className="site-footer">
      <div className="container-learn grid gap-8 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Brand size={40} />
          <p className="mt-2 max-w-xs text-sm text-secondary">
            Short videos, the points that matter, and a place to ask while you watch. Free, and no code required.
          </p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-2 text-sm">
          <p className="eyebrow mb-1">Explore</p>
          <Link href="/learn" data-track="footer-lessons" className="footer-link">Lessons</Link>
          <Link href="/notes" data-track="footer-notes" className="footer-link">Notes</Link>
          <Link href="/week" data-track="footer-week" className="footer-link">This week</Link>
          <Link href="/challenges" data-track="footer-challenges" className="footer-link">Challenges</Link>
          <Link href="/jobs" data-track="footer-jobs" className="footer-link">Jobs</Link>
          <Link href="/ig" data-track="footer-ig" className="footer-link">Reel drops</Link>
          <Link href="/newsletter" data-track="footer-newsletter" className="footer-link">Weekly email</Link>
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <p className="eyebrow mb-1">sortNow &amp; Company</p>
          <a href="https://sortnow.co" data-track="footer-company" className="footer-link">sortnow.co</a>
          <a href="https://sortnow.co/contact" data-track="footer-contact" className="footer-link">Work with us</a>
          <a href="mailto:hello@sortnow.co" data-track="footer-email" className="footer-link">hello@sortnow.co</a>
          <Link href="/privacy" data-track="footer-privacy" className="footer-link">Privacy notice</Link>
        </div>
      </div>
      <div className="container-learn border-t border-black/5 py-4 text-xs text-muted">
        © {new Date().getFullYear()} sortNow &amp; Company. All rights reserved.
        {preview ? <span className="ml-3 rounded-full bg-sun/60 px-2 py-0.5 text-ink">Preview mode: accounts are temporary until the database is connected.</span> : null}
      </div>
    </footer>
  );
}
