import { ArrowUpRight, Info } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { opportunities } from "@/features/opportunities/catalog";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { requireCurrentUserId } from "@/server/session";

export const metadata: Metadata = { title: "Chancen" };

export default async function OpportunitiesPage() {
  const userId = await requireCurrentUserId();
  const profile = await new ProfileRepository().getForUser(userId);
  if (!profile?.onboardingComplete) redirect("/onboarding");

  const visibleOpportunities = opportunities.filter(
    (item) => !item.studentsOnly || profile.phase === "im_studium",
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="mb-2 font-semibold text-[var(--primary)]">Chancen</p>
        <h1 className="page-title">Gute Einstiegspunkte.</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted-foreground)]">
          Eine kleine, kuratierte Übersicht – transparent statt vermeintlicher
          Live-Suche oder erfundener Erfolgschancen.
        </p>
      </header>

      <div className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4 text-sm leading-6">
        <Info className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" aria-hidden />
        <p>
          Diese Hinweise sind eine erste Orientierung. Sie sagen nicht voraus, ob
          du förderberechtigt bist oder ausgewählt wirst.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {visibleOpportunities.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <CardHeader>
              <Badge className="mb-3 w-fit">{item.category}</Badge>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <dl className="space-y-4 text-sm leading-6">
                <div>
                  <dt className="font-semibold">Was ist das?</dt>
                  <dd className="text-[var(--muted-foreground)]">{item.description}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Für wen interessant?</dt>
                  <dd className="text-[var(--muted-foreground)]">{item.audience}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Erster sinnvoller Schritt</dt>
                  <dd className="text-[var(--muted-foreground)]">{item.firstStep}</dd>
                </div>
              </dl>
              <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                Bedingungen und Fristen bitte auf der offiziellen Seite prüfen.
              </p>
              {item.link && (
                <a
                  href={item.link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"
                >
                  {item.link.label}
                  <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
