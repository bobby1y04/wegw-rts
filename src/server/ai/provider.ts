import { readAIConfig } from "./config";
import { FakeAIProvider } from "./fake-provider";
import { OllamaProvider } from "./ollama-provider";
import type { AIProvider } from "./types";

export function createAIProvider(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AIProvider {
  const config = readAIConfig(env);

  if (config.provider === "mock") {
    return new FakeAIProvider();
  }

  return new OllamaProvider(config.ollama);
}
