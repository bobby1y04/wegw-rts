import { redirect } from "next/navigation";

import { ProfileRepository } from "@/server/repositories/profile-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await new ProfileRepository().getLocalProfile();
  redirect(profile?.onboardingComplete ? "/dashboard" : "/onboarding");
}
