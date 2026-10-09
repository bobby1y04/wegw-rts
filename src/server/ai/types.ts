export type AIMessageRole = "system" | "user" | "assistant";

export interface AIMessage {
  readonly role: AIMessageRole;
  readonly content: string;
}

export interface AIChatRequest {
  readonly messages: readonly AIMessage[];
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

/**
 * Provider-neutral streaming boundary. Providers emit text only; transport
 * metadata stays inside the adapter.
 */
export interface AIProvider {
  streamChat(request: AIChatRequest): AsyncIterable<string>;
}
