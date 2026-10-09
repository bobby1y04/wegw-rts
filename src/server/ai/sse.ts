export interface SSEParserOptions {
  readonly signal?: AbortSignal;
}

/**
 * Parses the data fields of a Server-Sent Events stream. Chunk boundaries may
 * occur between UTF-8 bytes, lines, or events.
 */
export async function* parseSSEDataStream(
  stream: ReadableStream<Uint8Array>,
  options: SSEParserOptions = {},
): AsyncGenerator<string, void, void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let dataLines: string[] = [];
  let streamEnded = false;
  const onAbort = (): void => {
    void reader.cancel(options.signal?.reason).catch(() => undefined);
  };

  function consumeLine(lineWithPossibleCarriageReturn: string): string | null {
    const line = lineWithPossibleCarriageReturn.endsWith("\r")
      ? lineWithPossibleCarriageReturn.slice(0, -1)
      : lineWithPossibleCarriageReturn;

    if (line === "") {
      if (dataLines.length === 0) {
        return null;
      }
      const data = dataLines.join("\n");
      dataLines = [];
      return data;
    }

    if (line.startsWith(":")) {
      return null;
    }

    const colonIndex = line.indexOf(":");
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
    if (field !== "data") {
      return null;
    }

    let value = colonIndex === -1 ? "" : line.slice(colonIndex + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }
    dataLines.push(value);
    return null;
  }

  options.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    while (true) {
      if (options.signal?.aborted) {
        throw options.signal.reason ?? new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) {
        streamEnded = true;
        buffer += decoder.decode();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const event = consumeLine(buffer.slice(0, newlineIndex));
        buffer = buffer.slice(newlineIndex + 1);
        if (event !== null) {
          yield event;
        }
        newlineIndex = buffer.indexOf("\n");
      }
    }

    if (options.signal?.aborted) {
      throw options.signal.reason ?? new DOMException("Aborted", "AbortError");
    }

    if (buffer !== "") {
      const event = consumeLine(buffer);
      if (event !== null) {
        yield event;
      }
    }
    if (dataLines.length > 0) {
      yield dataLines.join("\n");
    }
  } finally {
    options.signal?.removeEventListener("abort", onAbort);
    if (!streamEnded) {
      await reader.cancel().catch(() => undefined);
    }
    reader.releaseLock();
  }
}
