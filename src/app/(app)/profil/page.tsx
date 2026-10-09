import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DeleteDataButton } from "@/features/profile/delete-data-button";
import { ProfileForm } from "@/features/profile/profile-form";
import { ProfileRepository } from "@/server/repositories/profile-repository";
import { requireCurrentUserId } from "@/server/session";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const userId = await requireCurrentUserId();
  const profile = await new ProfileRepository().getForUser(userId);
  if (!profile?.onboardingComplete) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="mb-2 font-semibold text-[var(--primary)]">Profil</p>
        <h1 className="page-title">Das passt zu dir.</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted-foreground)]">
          Passe deine Angaben an. Erledigte Aufgaben bleiben dabei erhalten.
        </p>
      </header>
      <ProfileForm
        initialData={{
          displayName: profile.displayName ?? "",
          phase: profile.phase,
          studyProgram: profile.studyProgram ?? "",
          university: profile.university ?? "",
          semester: profile.semester?.toString() ?? "",
          interests: profile.interests,
          orientationSupport: profile.orientationSupport ?? "",
        }}
      />
      <DeleteDataButton />
    </div>
  );
}
