export default function SkipLink() {
  return (
    <a
      href="#main"
      className="mono sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-button focus:border focus:border-[var(--accent)] focus:bg-[var(--bg-raised)] focus:px-4 focus:py-3 focus:text-[13px] focus:text-[var(--text)]"
    >
      Skip to main content
    </a>
  );
}
