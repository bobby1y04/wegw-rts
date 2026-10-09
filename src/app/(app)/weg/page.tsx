import { ArrowRight, CheckCircle2, Circle, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LOCAL_USER_ID } from "@/db/local-user";
import { calculateRoadmapProgress } from "@/features/roadmap/progress";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { RoadmapRepository } from "@/server/repositories/roadmap-repository";

export const metadata: Metadata = { title: "Mein Weg" };

const statusMeta = {
  offen: { label: "Offen", icon: Circle },
  in_bearbeitung: { label: "In Bearbeitung", icon: Clock3 },
  erledigt: { label: "Erledigt", icon: CheckCircle2 },
} as const;

export default async function RoadmapPage() {
  const profile = await new ProfileRepository().getLocalProfile();
  if (!profile?.onboardingComplete) redirect("/onboarding");
  const tasks = await new RoadmapRepository().listForUser(
    LOCAL_USER_ID,
    profile.phase,
  );
  const progress = calculateRoadmapProgress(tasks);

  return (
    <div className="space-y-8">
      <header className="grid gap-6 md:grid-cols-[1fr_18rem] md:items-end">
        <div>
          <p className="mb-2 font-semibold text-[var(--primary)]">Mein Weg</p>
          <h1 className="page-title">Schritt für Schritt.</h1>
          <p className="mt-4 max-w-2xl text-[var(--muted-foreground)]">
            Dein Fahrplan ist eine Orientierung. Du bestimmst Reihenfolge und Tempo.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex justify-between text-sm">
            <span>{progress.completed} von {progress.total} erledigt</span>
            <strong>{progress.percent} %</strong>
          </div>
          <Progress value={progress.percent} label="Fortschritt im Fahrplan" />
        </div>
      </header>

      <ol className="space-y-3">
        {tasks.map((task, index) => {
          const meta = statusMeta[task.status];
          const Icon = meta.icon;
          const checklistDone = task.checklistItems.filter(
            (item) => item.isCompleted,
          ).length;
          return (
            <li key={task.id}>
              <Link href={`/weg/${task.id}`} className="group block">
                <Card className="transition group-hover:-translate-y-0.5 group-hover:border-[var(--primary)] group-hover:shadow-md">
                  <CardContent className="grid gap-4 p-5 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center sm:p-6">
                    <span className="grid size-10 place-items-center rounded-full bg-[var(--secondary)] text-sm font-bold text-[var(--primary)]">
                      {index + 1}
                    </span>
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge>{task.category}</Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <Icon className="size-3.5" aria-hidden />
                          {meta.label}
                        </span>
                      </div>
                      <h2 className="font-semibold sm:text-lg">{task.title}</h2>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {checklistDone} von {task.checklistItems.length} Teilschritten
                      </p>
                    </div>
                    <ArrowRight
                      className="hidden size-5 text-[var(--muted-foreground)] transition group-hover:translate-x-1 sm:block"
                      aria-hidden
                    />
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
