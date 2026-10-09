import { z } from "zod";

export const educationPhases = [
  "vor_dem_studium",
  "im_studium",
] as const;
export type EducationPhase = (typeof educationPhases)[number];

export const profileInterests = [
  "studienwahl",
  "bewerbung",
  "finanzierung",
  "stipendien",
  "studienalltag",
  "karriere",
] as const;

export const orientationSupportOptions = [
  "ja",
  "nein",
  "keine_angabe",
] as const;

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, `Bitte verwende höchstens ${maxLength} Zeichen.`)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional();

const optionalSemester = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce
    .number()
    .int("Das Fachsemester muss eine ganze Zahl sein.")
    .positive("Das Fachsemester muss größer als 0 sein.")
    .max(100, "Bitte prüfe das Fachsemester.")
    .optional(),
);

export const profileInputSchema = z
  .object({
    displayName: optionalText(120),
    phase: z.enum(educationPhases, {
      error: "Bitte wähle deine aktuelle Phase.",
    }),
    studyProgram: optionalText(200),
    university: optionalText(200),
    semester: optionalSemester,
    interests: z
      .array(z.enum(profileInterests))
      .max(profileInterests.length)
      .refine((values) => new Set(values).size === values.length, {
        message: "Ein Interessenschwerpunkt darf nur einmal ausgewählt werden.",
      })
      .default([]),
    orientationSupport: z
      .enum(orientationSupportOptions)
      .nullish()
      .transform((value) => value ?? undefined),
    onboardingComplete: z.boolean().default(true),
  })
  .superRefine((value, context) => {
    if (value.phase !== "im_studium" && value.semester !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["semester"],
        message:
          "Ein Fachsemester kann nur für die Phase „Im Studium“ angegeben werden.",
      });
    }
  });

export type ProfileInput = z.input<typeof profileInputSchema>;
export type ValidatedProfileInput = z.output<typeof profileInputSchema>;

export const onboardingSchema = profileInputSchema;
