import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-lg text-center">
        <p className="font-semibold text-[var(--primary)]">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Diese Seite gibt es nicht.</h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Kehre zu deinem Wegwärts-Fahrplan zurück.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
