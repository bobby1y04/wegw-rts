const DEFAULT_MAX_BODY_BYTES = 16_384;

export class RequestSecurityError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RequestSecurityError";
  }
}

function allowedOrigins(request: Request): Set<string> {
  const origins = new Set<string>();
  if (process.env.APP_ORIGIN) {
    origins.add(new URL(process.env.APP_ORIGIN).origin);
  } else if (process.env.PUBLIC_DEMO !== "true") {
    const requestUrl = new URL(request.url);
    origins.add(requestUrl.origin);
    origins.add(`http://127.0.0.1${requestUrl.port ? `:${requestUrl.port}` : ""}`);
    origins.add(`http://localhost${requestUrl.port ? `:${requestUrl.port}` : ""}`);
  } else {
    throw new Error("APP_ORIGIN is required in production.");
  }
  return origins;
}

export async function readSecureJson(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new RequestSecurityError(
      "UNSUPPORTED_MEDIA_TYPE",
      "Diese Anfrage muss JSON verwenden.",
      415,
    );
  }

  const origin = request.headers.get("origin");
  if (
    origin &&
    !allowedOrigins(request).has(origin)
  ) {
    throw new RequestSecurityError(
      "INVALID_ORIGIN",
      "Die Anfrage stammt nicht von Wegwärts.",
      403,
    );
  }
  if (process.env.PUBLIC_DEMO === "true" && !origin) {
    throw new RequestSecurityError(
      "ORIGIN_REQUIRED",
      "Für diese Anfrage fehlt der Sicherheitsnachweis.",
      403,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestSecurityError(
      "PAYLOAD_TOO_LARGE",
      "Die Anfrage ist zu groß.",
      413,
    );
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new RequestSecurityError(
      "PAYLOAD_TOO_LARGE",
      "Die Anfrage ist zu groß.",
      413,
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new RequestSecurityError(
      "INVALID_JSON",
      "Die Anfrage enthält kein gültiges JSON.",
      400,
    );
  }
}
