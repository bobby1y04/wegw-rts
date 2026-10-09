"use client";

import { Check, LoaderCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-controls";

type TaskStatus = "offen" | "in_bearbeitung" | "erledigt";

export function TaskControls({
  taskId,
  initialStatus,
  initialDueDate,
  checklist,
}: {
  taskId: string;
  initialStatus: TaskStatus;
  initialDueDate: string | null;
  checklist: Array<{ id: string; text: string; isCompleted: boolean }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [dueDate, setDueDate] = useState(initialDueDate ?? "");
  const [items, setItems] = useState(checklist);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function patchTask(body: object) {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error?.message ?? "Änderung konnte nicht gespeichert werden.");
    }
  }

  async function changeStatus(nextStatus: TaskStatus) {
    setBusy("status");
    setError("");
    try {
      await patchTask({ status: nextStatus });
      setStatus(nextStatus);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }

  async function saveDueDate() {
    setBusy("date");
    setError("");
    try {
      await patchTask({ dueDate: dueDate || null });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleItem(itemId: string, isCompleted: boolean) {
    const previousItems = items;
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, isCompleted } : item,
      ),
    );
    setBusy(itemId);
    setError("");
    try {
      const response = await fetch(
        `/api/tasks/${taskId}/checklist/${itemId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ isCompleted }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error?.message ?? "Teilschritt konnte nicht gespeichert werden.",
        );
      }
      if (status === "offen") {
        await patchTask({ status: "in_bearbeitung" });
        setStatus("in_bearbeitung");
      }
      router.refresh();
    } catch (caught) {
      setItems(previousItems);
      setError(caught instanceof Error ? caught.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="checklist-title">
        <h2 id="checklist-title" className="mb-4 text-xl font-semibold">
          Deine Checkliste
        </h2>
        <div className="space-y-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-white p-4 transition hover:border-[var(--primary)]"
            >
              <input
                type="checkbox"
                className="mt-0.5 size-5 accent-[var(--primary)]"
                checked={item.isCompleted}
                disabled={busy !== null}
                onChange={(event) => toggleItem(item.id, event.target.checked)}
              />
              <span className={item.isCompleted ? "text-[var(--muted-foreground)] line-through" : ""}>
                {item.text}
              </span>
              {busy === item.id && (
                <LoaderCircle className="ml-auto size-4 animate-spin" aria-label="Wird gespeichert" />
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <Label htmlFor="dueDate">Eigene Frist (optional)</Label>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Nur du setzt diese Frist. Offizielle Termine bitte bei der Hochschule prüfen.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="sm:max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            onClick={saveDueDate}
            disabled={busy !== null}
          >
            Frist speichern
          </Button>
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {status === "erledigt" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => changeStatus("in_bearbeitung")}
            disabled={busy !== null}
          >
            <RotateCcw className="size-4" aria-hidden />
            Wieder öffnen
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => changeStatus("erledigt")}
            disabled={busy !== null}
          >
            <Check className="size-4" aria-hidden />
            Als erledigt markieren
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link href={`/mentor?taskId=${taskId}`}>Mentor dazu fragen</Link>
        </Button>
      </div>
    </div>
  );
}
