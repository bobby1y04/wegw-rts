"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-lg rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-lg">
        <AlertTriangle className="mx-auto mb-4 size-10 text-amber-700" aria-hidden />
        <h1 className="text-2xl font-semibold">Wegwärts konnte nicht geladen werden.</h1>
        <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
          Prüfe, ob PostgreSQL läuft und ob Migration sowie Seed ausgeführt wurden.
        </p>
        <code className="mt-4 block rounded-xl bg-[var(--muted)] p-3 text-sm">
          docker compose up -d db
          <br />
          pnpm db:migrate &amp;&amp; pnpm db:seed
        </code>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden />
          Erneut versuchen
        </Button>
      </div>
    </main>
  );
}
