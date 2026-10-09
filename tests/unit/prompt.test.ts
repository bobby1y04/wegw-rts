import { describe, expect, it } from "vitest";

import { streamMentorReply } from "../../src/features/chat/mentor-service";
import {
  buildMentorPrompt,
  MENTOR_SYSTEM_PROMPT,
} from "../../src/features/chat/prompt";
import { FakeAIProvider } from "../../src/server/ai/fake-provider";

const PROFILE = {
  displayName: "Mika",
  phase: "vor_dem_studium",
  studyProgram: "Informatik",
  institution: "Beispielhochschule",
  interests: ["Bewerbung", "Finanzierung"],
} as const;

async function collect(iterable: AsyncIterable<string>): Promise<string> {
  let result = "";
  for await (const chunk of iterable) {
    result += chunk;
  }
  return result;
}

describe("buildMentorPrompt", () => {
  it("adds the German mentor policy, profile and optional task", () => {
    const messages = buildMentorPrompt({
      profile: PROFILE,
      task: {
        title: "Bewerbungsweg prüfen",
        description: "Finde die offizielle Bewerbungsseite.",
        checklist: ["Hochschulseite öffnen"],
      },
      userMessage: "Was mache ich zuerst?",
    });

    expect(messages[0]).toMatchObject({ role: "system" });
    expect(messages[0]?.content).toContain(MENTOR_SYSTEM_PROMPT);
    expect(messages[0]?.content).toContain("Beispielhochschule");
    expect(messages[0]?.content).toContain("Bewerbungsweg prüfen");
    expect(messages[0]?.content).toContain("keine verbindliche Rechts-");
    expect(messages.at(-1)).toEqual({
      role: "user",
      content: "Was mache ich zuerst?",
    });
  });

  it("includes only the newest completed messages", () => {
    const messages = buildMentorPrompt(
      {
        profile: PROFILE,
        recentMessages: [
          { role: "user", content: "zu alt", status: "completed" },
          { role: "assistant", content: "wird verworfen", status: "incomplete" },
          { role: "user", content: "neu eins", status: "completed" },
          { role: "assistant", content: "neu zwei", status: "completed" },
        ],
        userMessage: "aktuell",
      },
      { maxRecentMessages: 2 },
    );

    expect(messages.slice(1)).toEqual([
      { role: "user", content: "neu eins" },
      { role: "assistant", content: "neu zwei" },
      { role: "user", content: "aktuell" },
    ]);
  });

  it("bounds history and the current message deterministically", () => {
    const messages = buildMentorPrompt(
      {
        profile: PROFILE,
        recentMessages: [
          {
            role: "assistant",
            content: "abcdefghijklmnopqrstuvwxyz",
            status: "completed",
          },
        ],
        userMessage: "123456789",
      },
      {
        maxHistoryCharacters: 6,
        maxMessageCharacters: 6,
        maxUserMessageCharacters: 5,
      },
    );

    expect(messages[1]?.content).toBe("abcde…");
    expect(messages[2]?.content).toBe("1234…");
  });
});

describe("streamMentorReply", () => {
  it("streams through the provider-neutral application boundary", async () => {
    const provider = new FakeAIProvider(["A", "B"]);

    await expect(
      collect(
        streamMentorReply(provider, {
          profile: PROFILE,
          userMessage: "Hilf mir.",
        }),
      ),
    ).resolves.toBe("AB");
    expect(provider.requests[0]?.messages[0]?.role).toBe("system");
  });
});
