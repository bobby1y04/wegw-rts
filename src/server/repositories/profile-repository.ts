import { eq } from "drizzle-orm";

import { LOCAL_USER_ID } from "../../db/local-user";
import { profiles, users, type Profile } from "../../db/schema";
import {
  profileInputSchema,
  type ProfileInput,
} from "../../features/profile/schema";
import { getDatabase, type Database } from "../db";
import { instantiateRoadmapTasks } from "./roadmap-repository";

export interface ProfileWithDisplayName extends Profile {
  displayName: string | null;
}

export class ProfileRepository {
  constructor(private readonly database: Database = getDatabase()) {}

  async getForUser(userId: string): Promise<ProfileWithDisplayName | null> {
    const user = await this.database.query.users.findFirst({
      where: eq(users.id, userId),
      with: { profile: true },
    });

    if (!user?.profile) return null;

    return {
      ...user.profile,
      displayName: user.displayName,
    };
  }

  getLocalProfile(): Promise<ProfileWithDisplayName | null> {
    return this.getForUser(LOCAL_USER_ID);
  }

  async upsert(
    userId: string,
    rawInput: ProfileInput,
  ): Promise<ProfileWithDisplayName> {
    const input = profileInputSchema.parse(rawInput);

    return this.database.transaction(async (transaction) => {
      await transaction
        .insert(users)
        .values({
          id: userId,
          displayName: input.displayName ?? null,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            displayName: input.displayName ?? null,
            updatedAt: new Date(),
          },
        });

      const [profile] = await transaction
        .insert(profiles)
        .values({
          userId,
          phase: input.phase,
          studyProgram: input.studyProgram ?? null,
          university: input.university ?? null,
          semester: input.semester ?? null,
          interests: input.interests,
          orientationSupport: input.orientationSupport ?? null,
          onboardingComplete: input.onboardingComplete,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            phase: input.phase,
            studyProgram: input.studyProgram ?? null,
            university: input.university ?? null,
            semester: input.semester ?? null,
            interests: input.interests,
            orientationSupport: input.orientationSupport ?? null,
            onboardingComplete: input.onboardingComplete,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!profile) {
        throw new Error("Das Profil konnte nicht gespeichert werden.");
      }

      await instantiateRoadmapTasks(transaction, userId, input.phase);

      return {
        ...profile,
        displayName: input.displayName ?? null,
      };
    });
  }

  upsertLocal(rawInput: ProfileInput): Promise<ProfileWithDisplayName> {
    return this.upsert(LOCAL_USER_ID, rawInput);
  }
}
