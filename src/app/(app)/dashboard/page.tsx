import { ArrowRight, Lightbulb, MessageCircle, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  calculateRoadmapProgress,
  selectNextRoadmapTask,
} from "@/features/roadmap/progress";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { RoadmapRepository } from "@/server/repositories/roadmap-repository";
import { requireCurrentUserId } from "@/server/session";

export const metadata: Metadata = { title: "Heute" };

export default async function DashboardPage() {
  const userId = await requireCurrentUserId();
  const profile = await new ProfileRepository().getForUser(userId);
  if (!profile?.onboardingComplete) redirect("/onboarding");

  const tasks = await new RoadmapRepository().listForUser(
    userId,
    profile.phase,
  );
  const progress = calculateRoadmapProgress(tasks);
  const nextTask = selectNextRoadmapTask(tasks);
  const moreTasks = tasks
    .filter((task) => task.status !== "erledigt" && task.id !== nextTask?.id)
    .slice(0, 3);
  const greeting = profile.displayName ? `Hallo ${profile.displayName},` : "Hallo,";

  return (
    <div className="space-y-8">
      <header>
        <p className="mb-2 font-semibold text-[var(--primary)]">Heute</p>
        <h1 className="page-title">{greeting}</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">
          Ein klarer nächster Schritt reicht für heute.
        </p>
      </header>

      {nextTask ? (
        <Card className="border-0 bg-[var(--primary)] text-white shadow-xl">
          <CardContent className="grid gap-6 p-7 sm:p-9 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <Badge className="mb-4 bg-white/15 text-white">Als Nächstes</Badge>
              <h2 className="text-2xl font-semibold sm:text-3xl">{nextTask.title}</h2>
              <p className="mt-3 max-w-2xl leading-7 text-white/80">
                {nextTask.description}
              </p>
            </div>
            <Link
              href={`/weg/${nextTask.id}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-[#0d594b] shadow-md transition-colors hover:bg-[#f7f2e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Aufgabe öffnen
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[var(--secondary)]">
          <CardContent className="p-8 text-center">
            <Sparkles className="mx-auto mb-3 size-8 text-[var(--primary)]" />
            <h2 className="text-2xl font-semibold">Dein Fahrplan ist geschafft.</h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Du kannst erledigte Schritte jederzeit in „Mein Weg“ erneut ansehen.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Dein Fortschritt</CardTitle>
                <CardDescription>
                  {progress.completed} von {progress.total} Schritten abgeschlossen
                </CardDescription>
              </div>
              <strong className="text-2xl text-[var(--primary)]">
                {progress.percent} %
              </strong>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress.percent} label="Fortschritt im Fahrplan" />
            {moreTasks.length > 0 && (
              <div className="mt-7 divide-y divide-[var(--border)]">
                {moreTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/weg/${task.id}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm font-medium hover:text-[var(--primary)]"
                  >
                    <span>{task.title}</span>
                    <ArrowRight className="size-4 shrink-0" aria-hidden />
                  </Link>
                ))}
              </div>
            )}
            <Button asChild variant="ghost" className="mt-4 px-0">
              <Link href="/weg">Den ganzen Fahrplan ansehen</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Lightbulb className="mb-2 size-6 text-[var(--primary)]" aria-hidden />
              <CardTitle>Gut zu wissen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                {profile.interests.includes("stipendien")
                  ? "Stipendien hängen nicht nur von Noten ab. Prüfe Programme und Bedingungen direkt bei den offiziellen Stellen."
                  : "Finanzierung und Stipendien früh anzusehen kann dir Planungssicherheit geben – auch ohne schon alle Details zu kennen."}
              </p>
              <Link
                href="/chancen"
                className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)]"
              >
                Kuratierte Einstiegspunkte ansehen
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-[#f0e9dc]">
            <CardHeader>
              <MessageCircle className="mb-2 size-6 text-[var(--primary)]" aria-hidden />
              <CardTitle>Etwas unklar?</CardTitle>
              <CardDescription>
                Der lokale Mentor erklärt Begriffe und hilft dir, einen nächsten
                Schritt zu formulieren.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/mentor">Mentor fragen</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
