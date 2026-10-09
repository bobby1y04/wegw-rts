import { describe, expect, it, vi } from "vitest";

import { readAIConfig } from "../../src/server/ai/config";
import {
  AIQuotaExceededError,
  AIUnavailableError,
} from "../../src/server/ai/errors";
import { createAIProvider } from "../../src/server/ai/provider";
import { WorkersAIProvider } from "../../src/server/ai/workers-ai-provider";

const CONFIG = {
  accountId: "account-id",
  apiToken: "secret-token",
  model: "@cf/qwen/qwen3-30b-a3b-fp8",
  maxOutputTokens: 500,
  timeoutMs: 1_000,
} as const;

async function collect(iterable: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of iterable) {
    chunks.push(chunk);
  }
  return chunks;
}

function chunkedStream(value: string, chunkSize: number): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  return new ReadableStream({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        controller.enqueue(bytes.slice(offset, offset + chunkSize));
      }
      controller.close();
    },
  });
}

describe("Workers AI config", () => {
  it("uses the documented model and output-token defaults", () => {
    const config = readAIConfig({
      AI_PROVIDER: "workers-ai",
      CLOUDFLARE_ACCOUNT_ID: "account-id",
      CLOUDFLARE_AI_API_TOKEN: "secret-token",
    });

    expect(config.provider).toBe("workers-ai");
    expect(config.workersAi).toMatchObject({
      accountId: "account-id",
      apiToken: "secret-token",
      model: "@cf/qwen/qwen3-30b-a3b-fp8",
      maxOutputTokens: 500,
    });
  });

  it("requires Cloudflare credentials only when Workers AI is selected", () => {
    expect(() => readAIConfig({ AI_PROVIDER: "workers-ai" })).toThrow(
      "CLOUDFLARE_ACCOUNT_ID",
    );
    expect(() => readAIConfig({ AI_PROVIDER: "mock" })).not.toThrow();
  });

  it("rejects output limits above the public demo cap", () => {
    expect(() =>
      readAIConfig({
        AI_PROVIDER: "workers-ai",
        CLOUDFLARE_ACCOUNT_ID: "account-id",
        CLOUDFLARE_AI_API_TOKEN: "secret-token",
        AI_MAX_OUTPUT_TOKENS: "501",
      }),
    ).toThrow("höchstens 500");
  });

  it("selects Workers AI without falling back to another provider", () => {
    const provider = createAIProvider({
      AI_PROVIDER: "workers-ai",
      CLOUDFLARE_ACCOUNT_ID: "account-id",
      CLOUDFLARE_AI_API_TOKEN: "secret-token",
    });

    expect(provider).toBeInstanceOf(WorkersAIProvider);
  });
});

describe("WorkersAIProvider", () => {
  it("posts an explicitly bounded streaming request and parses split SSE chunks", async () => {
    const fetchImplementation: typeof fetch = vi.fn(async (input, init) => {
      expect(String(input)).toBe(
        "https://api.cloudflare.com/client/v4/accounts/account-id/ai/run/@cf/qwen/qwen3-30b-a3b-fp8",
      );
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer secret-token",
      );
      expect(JSON.parse(String(init?.body))).toEqual({
        messages: [{ role: "user", content: "Hallo" }],
        max_tokens: 500,
        stream: true,
      });

      return new Response(
        chunkedStream(
          [
            ': keep-alive\r\n',
            'data: {"response":"Grüße "}\r\n\r\n',
            'data: {"response":"aus der Cloud"}\n\n',
            "data: [DONE]\n\n",
          ].join(""),
          3,
        ),
        {
          headers: { "content-type": "text/event-stream" },
          status: 200,
        },
      );
    });
    const provider = new WorkersAIProvider(CONFIG, fetchImplementation);

    await expect(
      collect(
        provider.streamChat({
          messages: [{ role: "user", content: "Hallo" }],
        }),
      ),
    ).resolves.toEqual(["Grüße ", "aus der Cloud"]);
  });

  it("returns a typed quota error for HTTP 429 without exposing provider details", async () => {
    const fetchImplementation: typeof fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          errors: [{ message: "secret-token exceeded account-id quota" }],
        }),
        {
          headers: { "retry-after": "60" },
          status: 429,
        },
      );
    });
    const provider = new WorkersAIProvider(CONFIG, fetchImplementation);

    let thrown: unknown;
    try {
      await collect(
        provider.streamChat({
          messages: [{ role: "user", content: "Test" }],
        }),
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AIQuotaExceededError);
    expect(thrown).toMatchObject({ retryAfterSeconds: 60 });
    expect(String(thrown)).not.toContain("secret-token");
    expect(String(thrown)).not.toContain("account-id");
  });

  it("sanitizes upstream server errors", async () => {
    const fetchImplementation: typeof fetch = vi.fn(async () => {
      return new Response("internal trace with secret-token", { status: 503 });
    });
    const provider = new WorkersAIProvider(CONFIG, fetchImplementation);

    const result = collect(
      provider.streamChat({
        messages: [{ role: "user", content: "Test" }],
      }),
    );

    await expect(result).rejects.toBeInstanceOf(AIUnavailableError);
    await expect(result).rejects.not.toThrow("secret-token");
  });
});
