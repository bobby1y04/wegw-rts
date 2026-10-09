import { expect, test } from "@playwright/test";
import postgres from "postgres";

test.beforeAll(async () => {
  const sql = postgres(
    process.env.E2E_DATABASE_URL ??
      "postgresql://wegwaerts:wegwaerts@127.0.0.1:55432/wegwaerts_test",
    { max: 1 },
  );
  try {
    await sql`delete from users`;
  } finally {
    await sql.end();
  }
});

test("Onboarding bis sichtbarer Fahrplanfortschritt", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole("button", { name: /Vor dem Studium/ }).click();
  await page.getByRole("button", { name: "Weiter" }).click();

  await page.getByLabel("Vorname oder Spitzname").fill("Alex");
  await page.getByLabel("Ziel-Studienfach").fill("Informatik");
  await page.getByRole("button", { name: "Weiter" }).click();

  await page.getByRole("button", { name: "Bewerbung" }).click();
  await page.getByRole("button", { name: "Meinen Weg starten" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Hallo Alex," })).toBeVisible();
  await expect(page.getByText("0 von 8 Schritten abgeschlossen")).toBeVisible();

  const isolatedContext = await browser.newContext();
  const isolatedPage = await isolatedContext.newPage();
  await isolatedPage.goto("/");
  await expect(isolatedPage).toHaveURL(/\/onboarding$/);
  await expect(
    isolatedPage.getByRole("heading", { name: "Dein Weg beginnt hier." }),
  ).toBeVisible();
  await isolatedContext.close();

  await page.getByRole("link", { name: "Mein Weg" }).first().click();
  await expect(page).toHaveURL(/\/weg$/);
  await page
    .getByRole("link", { name: /Studieninteressen und Ziele sammeln/ })
    .click();

  const firstChecklistItem = page.getByRole("checkbox").first();
  await firstChecklistItem.check();
  await expect(firstChecklistItem).toBeChecked();

  await page.getByRole("button", { name: "Als erledigt markieren" }).click();
  await page.getByRole("link", { name: /Zurück zu „Mein Weg“/ }).click();
  await expect(page.getByText("1 von 8 erledigt")).toBeVisible();

  await page.getByRole("link", { name: "Mentor" }).first().click();
  await page.getByLabel("Nachricht an den Mentor").fill("Was ist mein nächster Schritt?");
  await page.getByRole("button", { name: "Nachricht senden" }).click();
  await expect(
    page.getByText("Wir schauen uns deinen nächsten Schritt gemeinsam an."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Wir schauen uns deinen nächsten Schritt gemeinsam an."),
  ).toBeVisible();

  await page.getByRole("link", { name: "Profil" }).first().click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Alle Demo-Daten löschen" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
});
