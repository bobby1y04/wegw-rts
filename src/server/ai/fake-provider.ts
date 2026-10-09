import { AIRequestAbortedError } from "./errors";
import type { AIChatRequest, AIProvider } from "./types";

const DEFAULT_CHUNKS = [
  "Gern. ",
  "Wir schauen uns deinen nächsten Schritt gemeinsam an.",
] as const;

/**
 * Deterministic provider for unit and end-to-end tests. It never accesses the
 * network and deliberately emits more than one chunk.
 */
export class FakeAIProvider implements AIProvider {
  readonly requests: AIChatRequest[] = [];
  readonly #chunks: readonly string[];

  constructor(chunks: readonly string[] = DEFAULT_CHUNKS) {
    this.#chunks = [...chunks];
  }

  async *streamChat(request: AIChatRequest): AsyncGenerator<string, void, void> {
    this.requests.push({
      ...request,
      messages: request.messages.map((message) => ({ ...message })),
    });

    for (const chunk of this.#chunks) {
      await Promise.resolve();
      if (request.signal?.aborted) {
        throw new AIRequestAbortedError();
      }
      yield chunk;
    }
  }
}
