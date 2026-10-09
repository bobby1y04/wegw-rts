import type { AIProvider } from "../../server/ai/types";
import {
  buildMentorPrompt,
  type MentorPromptInput,
  type MentorPromptLimits,
} from "./prompt";

export interface MentorStreamOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly promptLimits?: Partial<MentorPromptLimits>;
}

/**
 * Pure application boundary for route handlers: build bounded domain context,
 * then delegate streaming to the selected provider.
 *
 * Persistence belongs to the route/repository layer. It should only mark an
 * assistant message completed after this iterable finishes without throwing.
 */
export function streamMentorReply(
  provider: AIProvider,
  input: MentorPromptInput,
  options: MentorStreamOptions = {},
): AsyncIterable<string> {
  return provider.streamChat({
    messages: buildMentorPrompt(input, options.promptLimits),
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  });
}
