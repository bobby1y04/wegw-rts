export type AIErrorCode =
  | "unavailable"
  | "model_not_found"
  | "timeout"
  | "aborted"
  | "invalid_response";

export class AIProviderError extends Error {
  readonly code: AIErrorCode;

  constructor(code: AIErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AIProviderError";
    this.code = code;
  }
}

export class AIUnavailableError extends AIProviderError {
  constructor(message = "Ollama ist nicht erreichbar.", options?: ErrorOptions) {
    super("unavailable", message, options);
    this.name = "AIUnavailableError";
  }
}

export class AIModelNotFoundError extends AIProviderError {
  readonly model: string;

  constructor(model: string, options?: ErrorOptions) {
    super(
      "model_not_found",
      `Das Ollama-Modell „${model}“ ist nicht installiert. Führe „ollama pull ${model}“ aus.`,
      options,
    );
    this.name = "AIModelNotFoundError";
    this.model = model;
  }
}

export class AITimeoutError extends AIProviderError {
  constructor(timeoutMs: number, options?: ErrorOptions) {
    super(
      "timeout",
      `Die Antwort des KI-Mentors hat länger als ${timeoutMs} ms gedauert.`,
      options,
    );
    this.name = "AITimeoutError";
  }
}

export class AIRequestAbortedError extends AIProviderError {
  constructor(options?: ErrorOptions) {
    super("aborted", "Die Anfrage an den KI-Mentor wurde abgebrochen.", options);
    this.name = "AIRequestAbortedError";
  }
}

export class AIInvalidResponseError extends AIProviderError {
  constructor(message = "Ollama hat eine ungültige Antwort geliefert.", options?: ErrorOptions) {
    super("invalid_response", message, options);
    this.name = "AIInvalidResponseError";
  }
}
