import { AIInvalidResponseError } from "./errors";

const DEFAULT_MAX_LINE_LENGTH = 1_000_000;

export interface NDJSONParserOptions {
  readonly signal?: AbortSignal;
  readonly maxLineLength?: number;
}

function parseLine(line: string, lineNumber: number): unknown {
  const normalized = line.endsWith("\r") ? line.slice(0, -1) : line;
  if (normalized.trim() === "") {
    return undefined;
  }

  try {
    return JSON.parse(normalized) as unknown;
  } catch (cause) {
    throw new AIInvalidResponseError(
      `Ollama hat in NDJSON-Zeile ${lineNumber} ungültiges JSON geliefert.`,
      { cause },
    );
  }
}

/**
 * Parses a byte stream without assuming that network chunks align with lines
 * or UTF-8 character boundaries.
 */
export async function* parseNDJSONStream(
  stream: ReadableStream<Uint8Array>,
  options: NDJSONParserOptions = {},
): AsyncGenerator<unknown, void, void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const maxLineLength = options.maxLineLength ?? DEFAULT_MAX_LINE_LENGTH;
  let buffer = "";
  let lineNumber = 0;

  if (!Number.isSafeInteger(maxLineLength) || maxLineLength <= 0) {
    reader.releaseLock();
    throw new RangeError("maxLineLength muss eine positive ganze Zahl sein.");
  }

  try {
    while (true) {
      options.signal?.throwIfAborted();
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        lineNumber += 1;

        const parsed = parseLine(line, lineNumber);
        if (parsed !== undefined) {
          yield parsed;
        }

        newlineIndex = buffer.indexOf("\n");
      }

      if (buffer.length > maxLineLength) {
        throw new AIInvalidResponseError(
          `Eine Ollama-NDJSON-Zeile überschreitet ${maxLineLength} Zeichen.`,
        );
      }

      if (done) {
        break;
      }
    }

    if (buffer.trim() !== "") {
      lineNumber += 1;
      const parsed = parseLine(buffer, lineNumber);
      if (parsed !== undefined) {
        yield parsed;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
