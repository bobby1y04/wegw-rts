import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LOCAL_USER_ID } from "@/db/local-user";
import { calculateChecklistProgress } from "@/features/roadmap/progress";
import { TaskControls } from "@/features/roadmap/task-controls";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { RoadmapRepository } from "@/server/repositories/roadmap-repository";

export const metadata: Metadata = { title: "Aufgabe" };

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const profile = await new ProfileRepository().getLocalProfile();
  if (!profile?.onboardingComplete) redirect("/onboarding");

  const { taskId } = await params;
  const task = await new RoadmapRepository().getById(LOCAL_USER_ID, taskId);
  if (!task) notFound();
  const checklistProgress = calculateChecklistProgress(task.checklistItems);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/weg"
        className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Zurück zu „Mein Weg“
      </Link>

      <header className="mb-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>{task.category}</Badge>
          <Badge>{task.status === "erledigt" ? "Erledigt" : task.status === "in_bearbeitung" ? "In Bearbeitung" : "Offen"}</Badge>
        </div>
        <h1 className="page-title">{task.title}</h1>
        <p className="mt-5 text-lg leading-8 text-[var(--muted-foreground)]">
          {task.description}
        </p>
      </header>

      <Card className="mb-8 bg-[var(--secondary)]">
        <CardContent className="p-5">
          <div className="mb-3 flex justify-between text-sm">
            <span>
              {checklistProgress.completed} von {checklistProgress.total} Teilschritten
            </span>
            <strong>{checklistProgress.percent} %</strong>
          </div>
          <Progress value={checklistProgress.percent} label="Checklistenfortschritt" />
        </CardContent>
      </Card>

      <TaskControls
        taskId={task.id}
        initialStatus={task.status}
        initialDueDate={task.dueDate}
        checklist={task.checklistItems.map((item) => ({
          id: item.id,
          text: item.text,
          isCompleted: item.isCompleted,
        }))}
      />

      {task.links.length > 0 && (
        <section className="mt-10 border-t border-[var(--border)] pt-8">
          <h2 className="text-xl font-semibold">Offizielle Einstiegspunkte</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Bedingungen und Fristen bitte auf der offiziellen Seite prüfen.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {task.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold hover:border-[var(--primary)]"
              >
                {link.label}
                <ExternalLink className="size-4" aria-hidden />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
