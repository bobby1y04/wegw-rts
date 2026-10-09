"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render(
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme: "light";
          size: "flexible";
        },
      ): string;
      remove(widgetId: string): void;
    };
  }
}

export function TurnstileWidget({
  siteKey,
  onToken,
}: {
  siteKey?: string;
  onToken: (token: string | null) => void;
}) {
  const reactId = useId();
  const containerId = `turnstile-${reactId.replaceAll(":", "")}`;
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
      theme: "light",
      size: "flexible",
    });
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, [containerId, onToken, siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          if (!widgetId.current && window.turnstile) {
            widgetId.current = window.turnstile.render(`#${containerId}`, {
              sitekey: siteKey,
              callback: (token) => onToken(token),
              "expired-callback": () => onToken(null),
              "error-callback": () => onToken(null),
              theme: "light",
              size: "flexible",
            });
          }
        }}
      />
      <div id={containerId} className="min-h-[65px]" />
    </>
  );
}
