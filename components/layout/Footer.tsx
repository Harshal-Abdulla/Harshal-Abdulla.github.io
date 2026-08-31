import { PROFILE } from "@/content/profile";

/**
 * One line of contact. No sitemap columns, no newsletter, no "built with" list.
 */
export default function Footer() {
  const linkClass =
    "text-[var(--text)] underline decoration-[var(--stroke-bright)] underline-offset-4 transition-colors hover:decoration-[var(--accent)]";

  return (
    <footer className="mx-auto max-w-shell px-5 pb-14 pt-24 sm:px-6">
      <div className="border-t border-[var(--stroke)] pt-8">
        <p className="text-body text-[var(--dim)]">
          <a href={`mailto:${PROFILE.email}`} className={linkClass}>
            {PROFILE.email}
          </a>
          {" · "}
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            GitHub
          </a>
          {" · "}
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            LinkedIn
          </a>
        </p>
        <p className="mono mt-3 text-meta text-[var(--dim)]">
          {PROFILE.name}, {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
