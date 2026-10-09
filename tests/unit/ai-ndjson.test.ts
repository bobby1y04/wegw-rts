import { describe, expect, it } from "vitest";

import { AIInvalidResponseError } from "../../src/server/ai/errors";
import { parseNDJSONStream } from "../../src/server/ai/ndjson";

function byteStream(chunks: readonly Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<unknown[]> {
  const values: unknown[] = [];
  for await (const value of parseNDJSONStream(stream)) {
    values.push(value);
  }
  return values;
}

describe("parseNDJSONStream", () => {
  it("buffers split lines and split UTF-8 characters", async () => {
    const encoder = new TextEncoder();
    const source = '{"message":{"content":"Los 🚀"}}\r\n\n{"done":true}';
    const bytes = encoder.encode(source);
    const emojiStart = encoder.encode('{"message":{"content":"Los ').length;

    const values = await collect(
      byteStream([
        bytes.slice(0, 7),
        bytes.slice(7, emojiStart + 1),
        bytes.slice(emojiStart + 1, emojiStart + 3),
        bytes.slice(emojiStart + 3),
      ]),
    );

    expect(values).toEqual([
      { message: { content: "Los 🚀" } },
      { done: true },
    ]);
  });

  it("parses a final line without a newline", async () => {
    const values = await collect(
      byteStream([new TextEncoder().encode('{"done":true}')]),
    );

    expect(values).toEqual([{ done: true }]);
  });

  it("reports malformed JSON as an invalid provider response", async () => {
    const consume = collect(
      byteStream([new TextEncoder().encode('{"done":false}\nnot-json\n')]),
    );

    await expect(consume).rejects.toBeInstanceOf(AIInvalidResponseError);
  });
});
