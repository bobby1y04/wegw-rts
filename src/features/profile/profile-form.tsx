"use client";

import { ArrowLeft, ArrowRight, Check, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/form-controls";
import {
  profileInputSchema,
  type ProfileInput,
} from "@/features/profile/schema";
import { cn } from "@/lib/utils";

const interests = [
  ["studienwahl", "Studienwahl"],
  ["bewerbung", "Bewerbung"],
  ["finanzierung", "Finanzierung"],
  ["stipendien", "Stipendien"],
  ["studienalltag", "Studienalltag"],
  ["karriere", "Karriere"],
] as const;

type FormData = {
  displayName: string;
  phase: "" | "vor_dem_studium" | "im_studium";
  studyProgram: string;
  university: string;
  semester: string;
  interests: NonNullable<ProfileInput["interests"]>;
  orientationSupport: "" | "ja" | "nein" | "keine_angabe";
};

const emptyForm: FormData = {
  displayName: "",
  phase: "",
  studyProgram: "",
  university: "",
  semester: "",
  interests: [],
  orientationSupport: "",
};

export function ProfileForm({
  initialData,
  onboarding = false,
}: {
  initialData?: Partial<FormData>;
  onboarding?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(onboarding ? 0 : 2);
  const [data, setData] = useState<FormData>({ ...emptyForm, ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  function validateCurrentStep() {
    if (step === 0 && !data.phase) {
      setErrors({ phase: "Bitte wähle deine aktuelle Phase." });
      return false;
    }
    setErrors({});
    return true;
  }

  async function save() {
    setServerError("");
    const parsed = profileInputSchema.safeParse({
      ...data,
      semester: data.semester,
      orientationSupport: data.orientationSupport || undefined,
      onboardingComplete: true,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0] ?? "form")] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? "Dein Profil konnte nicht gespeichert werden.",
        );
      }
      router.push(onboarding ? "/dashboard" : "/profil?gespeichert=1");
      router.refresh();
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Dein Profil konnte nicht gespeichert werden.",
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleInterest(value: (typeof interests)[number][0]) {
    setData((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests.filter((item) => item !== value)
        : [...current.interests, value],
    }));
  }

  return (
    <Card className="overflow-hidden">
      {onboarding && (
        <div className="flex gap-2 border-b border-[var(--border)] px-6 py-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                item <= step ? "bg-[var(--primary)]" : "bg-[var(--secondary)]",
              )}
            />
          ))}
        </div>
      )}
      <CardContent className="p-6 sm:p-8">
        {step === 0 && (
          <section className="space-y-6" aria-labelledby="phase-heading">
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
                Schritt 1 von 3
              </p>
              <h2 id="phase-heading" className="text-2xl font-semibold">
                Wo stehst du gerade?
              </h2>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Damit dein Fahrplan zu deiner aktuellen Situation passt.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["vor_dem_studium", "Vor dem Studium", "Ich orientiere oder bewerbe mich."],
                ["im_studium", "Im Studium", "Ich bin bereits eingeschrieben."],
              ].map(([value, title, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setData((current) => ({
                      ...current,
                      phase: value as FormData["phase"],
                      semester: value === "im_studium" ? current.semester : "",
                    }))
                  }
                  className={cn(
                    "rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    data.phase === value
                      ? "border-[var(--primary)] bg-[var(--secondary)]"
                      : "border-[var(--border)] hover:border-[var(--primary)]",
                  )}
                >
                  <strong className="block">{title}</strong>
                  <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                    {description}
                  </span>
                </button>
              ))}
            </div>
            <FieldError>{errors.phase}</FieldError>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5" aria-labelledby="context-heading">
            <div>
              <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
                Schritt 2 von 3
              </p>
              <h2 id="context-heading" className="text-2xl font-semibold">
                Ein bisschen Kontext
              </h2>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Alle Angaben sind freiwillig.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Vorname oder Spitzname</Label>
              <Input
                id="displayName"
                value={data.displayName}
                onChange={(event) =>
                  setData({ ...data, displayName: event.target.value })
                }
                autoComplete="given-name"
              />
              <FieldError>{errors.displayName}</FieldError>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studyProgram">
                  {data.phase === "im_studium" ? "Studiengang" : "Ziel-Studienfach"}
                </Label>
                <Input
                  id="studyProgram"
                  value={data.studyProgram}
                  onChange={(event) =>
                    setData({ ...data, studyProgram: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">
                  {data.phase === "im_studium" ? "Hochschule" : "Ziel-Hochschule"}
                </Label>
                <Input
                  id="university"
                  value={data.university}
                  onChange={(event) =>
                    setData({ ...data, university: event.target.value })
                  }
                />
              </div>
            </div>
            {data.phase === "im_studium" && (
              <div className="max-w-xs space-y-2">
                <Label htmlFor="semester">Aktuelles Fachsemester</Label>
                <Input
                  id="semester"
                  type="number"
                  min={1}
                  value={data.semester}
                  onChange={(event) =>
                    setData({ ...data, semester: event.target.value })
                  }
                />
                <FieldError>{errors.semester}</FieldError>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6" aria-labelledby="interest-heading">
            <div>
              {onboarding && (
                <p className="mb-2 text-sm font-semibold text-[var(--primary)]">
                  Schritt 3 von 3
                </p>
              )}
              <h2 id="interest-heading" className="text-2xl font-semibold">
                Was ist dir wichtig?
              </h2>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Wähle beliebig viele Schwerpunkte.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map(([value, label]) => {
                const selected = data.interests.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(value)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                      selected
                        ? "border-[var(--primary)] bg-[var(--secondary)] text-[var(--primary-strong)]"
                        : "border-[var(--border)] bg-white hover:border-[var(--primary)]",
                    )}
                  >
                    {selected && <Check className="size-4" aria-hidden />}
                    {label}
                  </button>
                );
              })}
            </div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">
                Wünschst du dir mehr Orientierung, weil in deinem Umfeld wenig
                Erfahrung mit Studium vorhanden ist?
              </legend>
              <p className="text-sm text-[var(--muted-foreground)]">
                Die Antwort ist freiwillig und schaltet keine Funktionen frei oder aus.
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["ja", "Ja"],
                  ["nein", "Nein"],
                  ["keine_angabe", "Möchte ich nicht angeben"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-white p-3"
                  >
                    <input
                      type="radio"
                      name="orientationSupport"
                      value={value}
                      checked={data.orientationSupport === value}
                      onChange={() =>
                        setData({
                          ...data,
                          orientationSupport: value as FormData["orientationSupport"],
                        })
                      }
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        )}

        {serverError && (
          <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            {serverError}
          </p>
        )}
        <div className="mt-8 flex items-center justify-between gap-3">
          {onboarding && step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="size-4" aria-hidden />
              Zurück
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button
              type="button"
              onClick={() => validateCurrentStep() && setStep(step + 1)}
            >
              Weiter
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button type="button" onClick={save} disabled={saving}>
              {onboarding && <Compass className="size-4" aria-hidden />}
              {saving
                ? "Wird gespeichert …"
                : onboarding
                  ? "Meinen Weg starten"
                  : "Profil speichern"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
