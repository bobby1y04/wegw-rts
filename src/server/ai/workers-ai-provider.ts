import type { WorkersAIConfig } from "./config";
import {
  AIInvalidResponseError,
  AIProviderError,
  AIQuotaExceededError,
  AIRequestAbortedError,
  AITimeoutError,
  AIUnavailableError,
} from "./errors";
import { parseSSEDataStream } from "./sse";
import type { AIChatRequest, AIProvider } from "./types";

type FetchImplementation = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isSafeInteger(seconds) && seconds >= 0) {
    return seconds;
  }

  const retryDate = Date.parse(value);
  if (Number.isNaN(retryDate)) {
    return undefined;
  }
  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1_000));
}

function buildEndpoint(config: WorkersAIConfig): string {
  const endpoint = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/ai/run/`,
  );
  endpoint.pathname += config.model;
  return endpoint.toString();
}

export class WorkersAIProvider implements AIProvider {
  readonly #config: WorkersAIConfig;
  readonly #fetch: FetchImplementation;

  constructor(
    config: WorkersAIConfig,
    fetchImplementation: FetchImplementation = fetch,
  ) {
    this.#config = config;
    this.#fetch = fetchImplementation;
  }

  async *streamChat(request: AIChatRequest): AsyncGenerator<string, void, void> {
    const timeoutMs = request.timeoutMs ?? this.#config.timeoutMs;
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
      throw new RangeError("timeoutMs muss eine positive ganze Zahl sein.");
    }

    const controller = new AbortController();
    let timedOut = false;
    let callerAborted = request.signal?.aborted ?? false;

    const onCallerAbort = (): void => {
      callerAborted = true;
      controller.abort(request.signal?.reason);
    };

    if (request.signal?.aborted) {
      onCallerAbort();
    } else {
      request.signal?.addEventListener("abort", onCallerAbort, { once: true });
    }

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      let response: Response;
      try {
        response = await this.#fetch(buildEndpoint(this.#config), {
          method: "POST",
          headers: {
            accept: "text/event-stream",
            authorization: `Bearer ${this.#config.apiToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            messages: request.messages,
            max_tokens: this.#config.maxOutputTokens,
            stream: true,
          }),
          signal: controller.signal,
        });
      } catch (cause) {
        if (timedOut) {
          throw new AITimeoutError(timeoutMs, { cause });
        }
        if (callerAborted) {
          throw new AIRequestAbortedError({ cause });
        }
        throw new AIUnavailableError(
          "Cloudflare Workers AI ist derzeit nicht erreichbar.",
          { cause },
        );
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new AIQuotaExceededError(
            parseRetryAfter(response.headers.get("retry-after")),
          );
        }
        if (response.status >= 500) {
          throw new AIUnavailableError(
            "Cloudflare Workers AI ist derzeit nicht verfügbar.",
          );
        }
        throw new AIInvalidResponseError(
          `Cloudflare Workers AI hat die Anfrage abgelehnt (HTTP ${response.status}).`,
        );
      }

      if (response.body === null) {
        throw new AIInvalidResponseError(
          "Cloudflare Workers AI hat keinen Streaming-Antworttext geliefert.",
        );
      }

      let receivedFrame = false;
      for await (const data of parseSSEDataStream(response.body, {
        signal: controller.signal,
      })) {
        if (data.trim() === "[DONE]") {
          break;
        }

        let frame: unknown;
        try {
          frame = JSON.parse(data);
        } catch (cause) {
          throw new AIInvalidResponseError(
            "Cloudflare Workers AI hat ein ungültiges Stream-Element geliefert.",
            { cause },
          );
        }

        if (!isRecord(frame) || typeof frame.response !== "string") {
          throw new AIInvalidResponseError(
            "Cloudflare Workers AI hat ein ungültiges Stream-Element geliefert.",
          );
        }

        receivedFrame = true;
        if (frame.response !== "") {
          yield frame.response;
        }
      }

      if (!receivedFrame) {
        throw new AIInvalidResponseError(
          "Cloudflare Workers AI hat keine Antwort geliefert.",
        );
      }
    } catch (cause) {
      if (timedOut) {
        throw new AITimeoutError(timeoutMs, { cause });
      }
      if (callerAborted) {
        throw new AIRequestAbortedError({ cause });
      }
      if (cause instanceof AIProviderError) {
        throw cause;
      }
      throw new AIUnavailableError(
        "Die Streaming-Verbindung zu Cloudflare Workers AI wurde unerwartet beendet.",
        { cause },
      );
    } finally {
      clearTimeout(timeout);
      request.signal?.removeEventListener("abort", onCallerAbort);
    }
  }
}
