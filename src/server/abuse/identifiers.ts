import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export const UNKNOWN_CLIENT_IDENTIFIER = "unknown-client";

export interface HeadersLike {
  get(name: string): string | null;
}

function normalizeIpCandidate(candidate: string): string | null {
  let value = candidate.trim();

  const forwardedMatch = /^for=(.+)$/i.exec(value);
  if (forwardedMatch?.[1]) value = forwardedMatch[1].trim();
  value = value.replace(/^"|"$/g, "");

  const bracketedIpv6 = /^\[([^\]]+)\](?::\d+)?$/.exec(value);
  if (bracketedIpv6?.[1]) value = bracketedIpv6[1];

  const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(value);
  if (ipv4WithPort?.[1]) value = ipv4WithPort[1];

  return isIP(value) === 0 ? null : value.toLowerCase();
}

function firstValidIp(value: string | null): string | null {
  if (!value) return null;

  for (const candidate of value.split(",")) {
    const normalized = normalizeIpCandidate(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function forwardedHeaderIp(value: string | null): string | null {
  if (!value) return null;

  for (const element of value.split(",")) {
    for (const parameter of element.split(";")) {
      if (!parameter.trim().toLowerCase().startsWith("for=")) continue;
      const normalized = normalizeIpCandidate(parameter);
      if (normalized) return normalized;
    }
  }

  return null;
}

/**
 * Returns the best proxy-provided client hint available. These headers are only
 * trustworthy when the deployment proxy overwrites them; callers must not use
 * this as an authentication identity.
 */
export function deriveClientIdentifier(headers: HeadersLike): string {
  return (
    firstValidIp(headers.get("x-vercel-forwarded-for")) ??
    firstValidIp(headers.get("x-forwarded-for")) ??
    firstValidIp(headers.get("x-real-ip")) ??
    forwardedHeaderIp(headers.get("forwarded")) ??
    UNKNOWN_CLIENT_IDENTIFIER
  );
}

export function hmacIdentifier(
  identifier: string,
  secret: string,
  namespace = "identifier",
): string {
  if (identifier.trim() === "") {
    throw new Error("Der zu hashende Bezeichner darf nicht leer sein.");
  }
  if (secret === "") {
    throw new Error("Das HMAC-Secret darf nicht leer sein.");
  }

  return createHmac("sha256", secret)
    .update(`${namespace}\0${identifier}`)
    .digest("hex");
}

export function hashClientIdentifier(
  headers: HeadersLike,
  secret: string,
): string {
  return hmacIdentifier(deriveClientIdentifier(headers), secret, "client-ip");
}
