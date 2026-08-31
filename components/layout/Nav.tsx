"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { PROFILE } from "@/content/profile";

const LINKS = [
  { href: "/#work", label: "Work" },
  { href: "/about/", label: "About" },
];

export default function Nav() {
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Animation H. Condense after ~80px of scroll. Passive listener, and it only
  // ever flips a boolean, so there is no layout read in the scroll path.
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Escape closes, and Tab is kept inside the sheet while it is open.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a[href]")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const linkClass =
    "rounded-button px-3 py-2 text-[15px] text-[var(--dim)] transition-colors duration-[180ms] hover:text-[var(--text)]";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main"
        className={`panel mx-auto flex max-w-shell items-center justify-between transition-all duration-200 ${
          condensed ? "px-4 py-2.5 sm:px-5" : "px-4 py-3.5 sm:px-6 sm:py-4"
        }`}
        style={{
          backgroundColor: condensed
            ? "rgba(16, 20, 28, 0.82)"
            : "var(--glass)",
        }}
      >
        {/* Sits large while the hero is on screen, then shrinks into the
            condensed bar on scroll, along with animation H. */}
        <Link
          href="/"
          className={`rounded-button px-1 font-semibold tracking-tight text-[var(--text)] transition-[font-size] duration-200 ease-out ${
            condensed ? "text-[15px]" : "text-[19px] sm:text-[21px]"
          }`}
        >
          {PROFILE.name}
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass}>
              {l.label}
            </Link>
          ))}
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} inline-flex items-center gap-1`}
          >
            GitHub
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          {/* Real download, not a page. See PROFILE.cvPath before replacing. */}
          <a
            href={PROFILE.cvPath}
            download=""
            className="ml-2 rounded-button border border-[var(--stroke)] bg-[var(--glass)] px-4 py-2 text-[15px] font-medium text-[var(--text)] transition-all duration-[180ms] hover:border-[var(--stroke-bright)] hover:bg-[var(--glass-strong)]"
          >
            CV
          </a>
        </div>

        {/* Mobile */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="rounded-button border border-[var(--stroke)] bg-[var(--glass)] p-2 text-[var(--text)] md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-menu"
          ref={sheetRef}
          className="panel fixed inset-x-4 top-[76px] z-50 flex flex-col gap-1 p-4 md:hidden"
          style={{ backgroundColor: "rgba(16, 20, 28, 0.94)" }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-button px-3 py-3 text-[17px] text-[var(--text)]"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-button px-3 py-3 text-[17px] text-[var(--text)]"
          >
            GitHub
          </a>
          <a
            href={PROFILE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-button px-3 py-3 text-[17px] text-[var(--text)]"
          >
            LinkedIn
          </a>
          <a
            href={PROFILE.cvPath}
            download=""
            className="mt-1 rounded-button bg-[var(--accent)] px-3 py-3 text-center text-[16px] font-semibold text-[#0B0E14]"
          >
            Download CV (PDF, {PROFILE.cvSize})
          </a>
        </div>
      ) : null}
    </header>
  );
}
