import { describe, expect, it, vi } from "vitest";

import {
  AIModelNotFoundError,
  AITimeoutError,
  AIUnavailableError,
} from "../../src/server/ai/errors";
import { FakeAIProvider } from "../../src/server/ai/fake-provider";
import { OllamaProvider } from "../../src/server/ai/ollama-provider";
import { createAIProvider } from "../../src/server/ai/provider";

const CONFIG = {
  baseUrl: "http://ollama.test",
  model: "qwen3:4b",
  timeoutMs: 1_000,
} as const;

async function collect(iterable: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of iterable) {
    chunks.push(chunk);
  }
  return chunks;
}

describe("OllamaProvider", () => {
  it("streams content from /api/chat", async () => {
    const fetchImplementation: typeof fetch = vi.fn(async (_input, init) => {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toMatchObject({
        model: "qwen3:4b",
        stream: true,
      });
      return new Response(
        [
          '{"message":{"role":"assistant","content":"Hallo "},"done":false}',
          '{"message":{"role":"assistant","content":"Welt"},"done":false}',
          '{"message":{"role":"assistant","content":""},"done":true}',
          "",
        ].join("\n"),
        { status: 200 },
      );
    });
    const provider = new OllamaProvider(CONFIG, fetchImplementation);

    await expect(
      collect(
        provider.streamChat({
          messages: [{ role: "user", content: "Hallo" }],
        }),
      ),
    ).resolves.toEqual(["Hallo ", "Welt"]);

    expect(fetchImplementation).toHaveBeenCalledWith(
      "http://ollama.test/api/chat",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns a typed unavailable error when Ollama cannot be reached", async () => {
    const fetchImplementation: typeof fetch = vi.fn(async () => {
      throw new TypeError("connect ECONNREFUSED");
    });
    const provider = new OllamaProvider(CONFIG, fetchImplementation);

    await expect(
      collect(
        provider.streamChat({
          messages: [{ role: "user", content: "Test" }],
        }),
      ),
    ).rejects.toBeInstanceOf(AIUnavailableError);
  });

  it("returns a typed model error with the pull command", async () => {
    const fetchImplementation: typeof fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: 'model "qwen3:4b" not found, try pulling it first',
        }),
        { status: 404 },
      );
    });
    const provider = new OllamaProvider(CONFIG, fetchImplementation);

    const result = collect(
      provider.streamChat({
        messages: [{ role: "user", content: "Test" }],
      }),
    );

    await expect(result).rejects.toBeInstanceOf(AIModelNotFoundError);
    await expect(result).rejects.toThrow("ollama pull qwen3:4b");
  });

  it("aborts a stalled request at its timeout", async () => {
    const fetchImplementation: typeof fetch = vi.fn(
      async (_input, init): Promise<Response> =>
        await new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );
    const provider = new OllamaProvider(CONFIG, fetchImplementation);

    await expect(
      collect(
        provider.streamChat({
          messages: [{ role: "user", content: "Test" }],
          timeoutMs: 5,
        }),
      ),
    ).rejects.toBeInstanceOf(AITimeoutError);
  });
});

describe("createAIProvider", () => {
  it("selects the deterministic fake through AI_PROVIDER=mock", async () => {
    const provider = createAIProvider({ AI_PROVIDER: "mock" });

    expect(provider).toBeInstanceOf(FakeAIProvider);
    await expect(
      collect(
        provider.streamChat({
          messages: [{ role: "user", content: "Test" }],
        }),
      ),
    ).resolves.toEqual([
      "Gern. ",
      "Wir schauen uns deinen nächsten Schritt gemeinsam an.",
    ]);
  });
});
