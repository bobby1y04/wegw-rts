export interface OllamaConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly timeoutMs: number;
}

export interface WorkersAIConfig {
  readonly accountId: string;
  readonly apiToken: string;
  readonly model: string;
  readonly maxOutputTokens: number;
  readonly timeoutMs: number;
}

export type AIProviderName = "ollama" | "workers-ai" | "mock";

export interface AIConfig {
  readonly provider: AIProviderName;
  readonly ollama: OllamaConfig;
  readonly workersAi?: WorkersAIConfig;
}

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "qwen3:4b";
const DEFAULT_WORKERS_AI_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
const DEFAULT_MAX_OUTPUT_TOKENS = 500;
const DEFAULT_TIMEOUT_MS = 60_000;

function parsePositiveInteger(
  value: string | undefined,
  defaultValue: number,
  variableName: string,
): number {
  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${variableName} muss eine positive ganze Zahl sein.`);
  }

  return parsed;
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
  if (
    providerValue !== "ollama" &&
    providerValue !== "workers-ai" &&
    providerValue !== "mock"
  ) {
    throw new Error(
      'AI_PROVIDER muss "ollama", "workers-ai" oder "mock" sein.',
    );
  }

  const model = env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  const ollama = {
    baseUrl: parseBaseUrl(
      env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_BASE_URL,
    ),
    model,
    timeoutMs: parsePositiveInteger(
      env.OLLAMA_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
      "OLLAMA_TIMEOUT_MS",
    ),
  };

  if (providerValue === "workers-ai") {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
    if (!accountId) {
      throw new Error(
        "CLOUDFLARE_ACCOUNT_ID ist für AI_PROVIDER=workers-ai erforderlich.",
      );
    }

    const apiToken = env.CLOUDFLARE_AI_API_TOKEN?.trim();
    if (!apiToken) {
      throw new Error(
        "CLOUDFLARE_AI_API_TOKEN ist für AI_PROVIDER=workers-ai erforderlich.",
      );
    }

    const maxOutputTokens = parsePositiveInteger(
      env.AI_MAX_OUTPUT_TOKENS,
      DEFAULT_MAX_OUTPUT_TOKENS,
      "AI_MAX_OUTPUT_TOKENS",
    );
    if (maxOutputTokens > DEFAULT_MAX_OUTPUT_TOKENS) {
      throw new Error("AI_MAX_OUTPUT_TOKENS darf höchstens 500 betragen.");
    }

    return {
      provider: providerValue,
      ollama,
      workersAi: {
        accountId,
        apiToken,
        model:
          env.CLOUDFLARE_AI_MODEL?.trim() || DEFAULT_WORKERS_AI_MODEL,
        maxOutputTokens,
        timeoutMs: DEFAULT_TIMEOUT_MS,
      },
    };
  }

  return { provider: providerValue, ollama };
}
