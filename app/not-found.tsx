import Button from "@/components/ui/Button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-shell flex-col justify-center px-5 pt-28 sm:px-6">
      <p className="mono text-meta text-[var(--dim)]">404</p>
      <h1 className="text-title mt-4 font-semibold text-[var(--text)]">
        That page is not here
      </h1>
      <p className="prose-measure mt-4 text-body-lg text-[var(--dim)]">
        The link may be old, or I may have moved something. The work is all on
        the home page.
      </p>
      <div className="mt-8">
        <Button href="/">Back to the start</Button>
      </div>
    </div>
  );
}
