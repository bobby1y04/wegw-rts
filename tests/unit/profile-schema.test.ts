import { describe, expect, it } from "vitest";

import { profileInputSchema } from "../../src/features/profile/schema";

describe("profileInputSchema", () => {
  it("normalizes optional text and accepts a complete student profile", () => {
    const profile = profileInputSchema.parse({
      displayName: "  Alex  ",
      phase: "im_studium",
      studyProgram: "",
      university: "  Beispielhochschule  ",
      semester: "3",
      interests: ["studienalltag", "finanzierung"],
      orientationSupport: "keine_angabe",
    });

    expect(profile).toMatchObject({
      displayName: "Alex",
      phase: "im_studium",
      studyProgram: undefined,
      university: "Beispielhochschule",
      semester: 3,
      onboardingComplete: true,
    });
  });

  it("rejects a semester before the start of studies", () => {
    const result = profileInputSchema.safeParse({
      phase: "vor_dem_studium",
      semester: 1,
      interests: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["semester"]);
    }
  });

  it("rejects duplicate interests", () => {
    const result = profileInputSchema.safeParse({
      phase: "im_studium",
      interests: ["karriere", "karriere"],
    });

    expect(result.success).toBe(false);
  });
});
