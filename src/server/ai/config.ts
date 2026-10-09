export interface OllamaConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly timeoutMs: number;
}

export type AIProviderName = "ollama" | "mock";

export interface AIConfig {
  readonly provider: AIProviderName;
  readonly ollama: OllamaConfig;
}

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "qwen3:4b";
const DEFAULT_TIMEOUT_MS = 60_000;

function parseTimeout(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_TIMEOUT_MS;
  }

  const timeoutMs = Number(value);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("OLLAMA_TIMEOUT_MS muss eine positive ganze Zahl sein.");
  }

  return timeoutMs;
}

function parseBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch (cause) {
    throw new Error("OLLAMA_BASE_URL muss eine gültige URL sein.", { cause });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("OLLAMA_BASE_URL muss http oder https verwenden.");
  }

  return url.toString().replace(/\/+$/, "");
}

export function readAIConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AIConfig {
  const providerValue = env.AI_PROVIDER?.trim().toLowerCase() ?? "ollama";
  if (providerValue !== "ollama" && providerValue !== "mock") {
    throw new Error('AI_PROVIDER muss entweder "ollama" oder "mock" sein.');
  }

  const model = env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;

  return {
    provider: providerValue,
    ollama: {
      baseUrl: parseBaseUrl(
        env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL,
      ),
      model,
      timeoutMs: parseTimeout(env.OLLAMA_TIMEOUT_MS),
    },
  };
}
