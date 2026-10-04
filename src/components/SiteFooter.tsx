import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container-learn grid gap-8 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-heading text-2xl text-ink">
            sortNow <span className="text-secondary">Learn</span>
            <span className="dot">.</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-secondary">
            Short videos, the points that matter, and a place to ask while you watch. Free, and no code required.
          </p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-2 text-sm">
          <p className="eyebrow mb-1">Explore</p>
          <Link href="/learn" data-track="footer-lessons" className="footer-link">Lessons</Link>
          <Link href="/notes" data-track="footer-notes" className="footer-link">Notes</Link>
          <Link href="/week" data-track="footer-week" className="footer-link">This week</Link>
          <Link href="/ig" data-track="footer-ig" className="footer-link">From the reels</Link>
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <p className="eyebrow mb-1">sortNow &amp; Company</p>
          <a href="https://sortnow.co" data-track="footer-company" className="footer-link">sortnow.co</a>
          <a href="https://sortnow.co/contact" data-track="footer-contact" className="footer-link">Work with us</a>
          <a href="mailto:hello@sortnow.co" data-track="footer-email" className="footer-link">hello@sortnow.co</a>
        </div>
      </div>
      <div className="container-learn border-t border-black/5 py-4 text-xs text-muted">
        © {new Date().getFullYear()} sortNow &amp; Company. All rights reserved.
      </div>
    </footer>
  );
}
