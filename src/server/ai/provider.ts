import { readAIConfig } from "./config";
import { FakeAIProvider } from "./fake-provider";
import { OllamaProvider } from "./ollama-provider";
import type { AIProvider } from "./types";
import { WorkersAIProvider } from "./workers-ai-provider";

export function createAIProvider(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AIProvider {
  const config = readAIConfig(env);

  if (config.provider === "mock") {
    return new FakeAIProvider();
  }

  if (config.provider === "workers-ai") {
    if (config.workersAi === undefined) {
      throw new Error("Workers-AI-Konfiguration fehlt.");
    }
    return new WorkersAIProvider(config.workersAi);
  }

  return new OllamaProvider(config.ollama);
}
