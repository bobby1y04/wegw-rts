import { redirect } from "next/navigation";

import { ProfileRepository } from "@/server/repositories/profile-repository";
import { requireCurrentUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await requireCurrentUserId();
  const profile = await new ProfileRepository().getForUser(userId);
  redirect(profile?.onboardingComplete ? "/dashboard" : "/onboarding");
}
