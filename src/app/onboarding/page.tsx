import { Compass } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/profile/profile-form";
import { ProfileRepository } from "@/server/repositories/profile-repository";

export const metadata: Metadata = { title: "Willkommen" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const profile = await new ProfileRepository().getLocalProfile();
  if (profile?.onboardingComplete) redirect("/dashboard");

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[var(--primary)] text-white shadow-lg">
          <Compass className="size-7" aria-hidden />
        </span>
        <p className="mb-2 font-semibold text-[var(--primary)]">Wegwärts</p>
        <h1 className="page-title">Dein Weg beginnt hier.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-[var(--muted-foreground)]">
          In wenigen Minuten entsteht dein persönlicher Bildungsfahrplan.
          Dein Weg. Dein Tempo. Nicht allein.
        </p>
      </div>
      <ProfileForm onboarding />
    </main>
  );
}
