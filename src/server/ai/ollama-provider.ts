import type { OllamaConfig } from "./config";
import {
  AIInvalidResponseError,
  AIModelNotFoundError,
  AIProviderError,
  AIRequestAbortedError,
  AITimeoutError,
  AIUnavailableError,
} from "./errors";
import { parseNDJSONStream } from "./ndjson";
import type { AIChatRequest, AIProvider } from "./types";

type FetchImplementation = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describesMissingModel(message: string): boolean {
  return /model.+(?:not found|missing)|(?:not found|missing).+model|pull (?:the )?model/i.test(
    message,
  );
}

async function readResponseError(response: Response): Promise<string> {
  let body: string;
  try {
    body = await response.text();
  } catch {
    return "";
  }

  if (body.trim() === "") {
    return "";
  }

  try {
    const parsed = JSON.parse(body) as unknown;
    if (isRecord(parsed) && typeof parsed.error === "string") {
      return parsed.error;
    }
  } catch {
    // Non-JSON proxy and server responses are still useful as plain text.
  }

  return body.trim();
}

export class OllamaProvider implements AIProvider {
  readonly #config: OllamaConfig;
  readonly #fetch: FetchImplementation;

  constructor(config: OllamaConfig, fetchImplementation: FetchImplementation = fetch) {
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
        response = await this.#fetch(`${this.#config.baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: this.#config.model,
            messages: request.messages,
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
          `Ollama ist unter ${this.#config.baseUrl} nicht erreichbar. Starte Ollama und versuche es erneut.`,
          { cause },
        );
      }

      if (!response.ok) {
        const detail = await readResponseError(response);
        if (response.status === 404 || describesMissingModel(detail)) {
          throw new AIModelNotFoundError(this.#config.model);
        }
        if (response.status >= 500) {
          throw new AIUnavailableError(
            detail || `Ollama antwortete mit HTTP ${response.status}.`,
          );
        }
        throw new AIInvalidResponseError(
          detail || `Ollama lehnte die Anfrage mit HTTP ${response.status} ab.`,
        );
      }

      if (response.body === null) {
        throw new AIInvalidResponseError(
          "Ollama hat keinen Streaming-Antworttext geliefert.",
        );
      }

      let receivedFrame = false;
      let receivedDone = false;

      for await (const frame of parseNDJSONStream(response.body, {
        signal: controller.signal,
      })) {
        receivedFrame = true;
        if (!isRecord(frame)) {
          throw new AIInvalidResponseError(
            "Ein Ollama-Stream-Element ist kein JSON-Objekt.",
          );
        }

        if (typeof frame.error === "string") {
          if (describesMissingModel(frame.error)) {
            throw new AIModelNotFoundError(this.#config.model);
          }
          throw new AIInvalidResponseError(`Ollama-Fehler: ${frame.error}`);
        }

        if (typeof frame.done !== "boolean") {
          throw new AIInvalidResponseError(
            "Ein Ollama-Stream-Element enthält kein gültiges done-Feld.",
          );
        }

        if (frame.message !== undefined) {
          if (
            !isRecord(frame.message) ||
            typeof frame.message.content !== "string"
          ) {
            throw new AIInvalidResponseError(
              "Ein Ollama-Stream-Element enthält keinen gültigen Nachrichtentext.",
            );
          }

          if (frame.message.content !== "") {
            yield frame.message.content;
          }
        } else if (!frame.done) {
          throw new AIInvalidResponseError(
            "Ein unvollständiges Ollama-Stream-Element enthält keine Nachricht.",
          );
        }

        if (frame.done) {
          receivedDone = true;
        }
      }

      if (!receivedFrame || !receivedDone) {
        throw new AIInvalidResponseError(
          "Der Ollama-Stream endete ohne vollständige Abschlussmeldung.",
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
        "Die Streaming-Verbindung zu Ollama wurde unerwartet beendet.",
        { cause },
      );
    } finally {
      clearTimeout(timeout);
      request.signal?.removeEventListener("abort", onCallerAbort);
    }
  }
}
