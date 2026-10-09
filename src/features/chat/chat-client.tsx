"use client";

import {
  Bot,
  LoaderCircle,
  Plus,
  Send,
  Square,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
};

const examples = [
  "Wie funktioniert eine Hochschulbewerbung grundsätzlich?",
  "Welche Möglichkeiten zur Studienfinanzierung sollte ich prüfen?",
  "Was bedeutet eigentlich Modulhandbuch?",
];

export function ChatClient({
  initialConversationId,
  initialMessages,
  conversations,
  task,
  turnstileSiteKey,
  aiNotice,
}: {
  initialConversationId: string | null;
  initialMessages: Message[];
  conversations: Conversation[];
  task?: { id: string; title: string } | null;
  turnstileSiteKey?: string;
  aiNotice: string;
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || streaming) return;
    if (turnstileSiteKey && !turnstileToken) {
      setError("Bitte bestätige zuerst den Bot-Schutz.");
      return;
    }

    setError("");
    setInput("");
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: message },
      { id: `assistant-${Date.now()}`, role: "assistant", content: "" },
    ]);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          conversationId: conversationId ?? undefined,
          taskId: task?.id,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Der Mentor ist gerade nicht erreichbar.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const payload = JSON.parse(line) as {
            type: string;
            content?: string;
            conversationId?: string;
            message?: string;
          };
          if (payload.type === "meta" && payload.conversationId) {
            setConversationId(payload.conversationId);
            router.replace(
              `/mentor?conversationId=${payload.conversationId}${task ? `&taskId=${task.id}` : ""}`,
            );
          }
          if (payload.type === "token" && payload.content) {
            setMessages((current) => {
              const copy = [...current];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                copy[copy.length - 1] = {
                  ...last,
                  content: last.content + payload.content,
                };
              }
              return copy;
            });
          }
          if (payload.type === "error") {
            throw new Error(payload.message ?? "Der Mentor konnte nicht antworten.");
          }
          if (payload.type === "done") completed = true;
        }
      }

      if (!completed) throw new Error("Die Antwort wurde unerwartet unterbrochen.");
      router.refresh();
    } catch (caught) {
      const aborted = caught instanceof DOMException && caught.name === "AbortError";
      setError(
        aborted
          ? "Antwort abgebrochen. Deine Frage wurde im Verlauf gespeichert."
          : caught instanceof Error
            ? caught.message
            : "Der Mentor konnte nicht antworten.",
      );
      setMessages((current) => {
        const last = current[current.length - 1];
        return last?.role === "assistant" && !last.content
          ? current.slice(0, -1)
          : current;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
      setTurnstileToken(null);
      setTurnstileVersion((current) => current + 1);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  async function deleteConversation() {
    if (!conversationId || !window.confirm("Diese Unterhaltung löschen?")) return;
    setError("");
    const response = await fetch(
      `/api/chat/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: "{}",
      },
    );
    if (!response.ok) {
      setError("Die Unterhaltung konnte nicht gelöscht werden.");
      return;
    }
    router.push("/mentor?new=1");
    router.refresh();
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] gap-5 lg:grid-cols-[15rem_1fr]">
      <aside className="hidden rounded-2xl border border-[var(--border)] bg-white p-3 lg:block">
        <Button asChild variant="outline" className="mb-3 w-full">
          <Link href="/mentor?new=1">
            <Plus className="size-4" aria-hidden />
            Neue Unterhaltung
          </Link>
        </Button>
        <nav className="space-y-1" aria-label="Unterhaltungen">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/mentor?conversationId=${conversation.id}`}
              className={cn(
                "block truncate rounded-lg px-3 py-2 text-sm",
                conversation.id === conversationId
                  ? "bg-[var(--secondary)] font-semibold"
                  : "hover:bg-[var(--muted)]",
              )}
            >
              {conversation.title}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <header className="border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Dein Wegwärts-Mentor</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {aiNotice} · Antworten bitte bei offiziellen Stellen prüfen
              </p>
            </div>
            <div className="flex items-center gap-1">
              {conversationId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={deleteConversation}
                  aria-label="Unterhaltung löschen"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
              <Button asChild variant="ghost" size="icon" className="lg:hidden">
                <Link href="/mentor?new=1" aria-label="Neue Unterhaltung">
                  <Plus className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
          {task && (
            <div className="mt-3 rounded-lg bg-[var(--secondary)] px-3 py-2 text-sm">
              Kontext: <strong>{task.title}</strong>
            </div>
          )}
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-xl flex-col items-center py-12 text-center">
              <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                <Bot className="size-6" aria-hidden />
              </span>
              <h2 className="text-2xl font-semibold">Wobei kann ich dir helfen?</h2>
              <p className="mt-2 text-[var(--muted-foreground)]">
                Ich erkläre Begriffe und sortiere nächste Schritte – ohne erfundene
                Fristen oder Förderversprechen.
              </p>
              <div className="mt-6 grid gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => sendMessage(example)}
                    className="rounded-xl border border-[var(--border)] px-4 py-3 text-left text-sm hover:border-[var(--primary)]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "justify-end",
                )}
              >
                {message.role === "assistant" && (
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--secondary)] text-[var(--primary)]">
                    <Bot className="size-4" aria-hidden />
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    message.role === "user"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--muted)]",
                  )}
                >
                  {message.role === "assistant" ? (
                    message.content ? (
                      <div className="prose-mentor">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : index === messages.length - 1 && streaming ? (
                      <span className="inline-flex items-center gap-2 text-[var(--muted-foreground)]">
                        <LoaderCircle className="size-4 animate-spin" aria-hidden />
                        Denkt nach …
                      </span>
                    ) : null
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-white">
                    <UserRound className="size-4" aria-hidden />
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={submit} className="border-t border-[var(--border)] p-4">
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
              {error}
              {(error.includes("Ollama") || error.includes("Modell")) && (
                <span className="mt-1 block font-mono text-xs">
                  ollama serve · ollama pull qwen3:4b
                </span>
              )}
            </p>
          )}
          {turnstileSiteKey && (
            <div className="mb-3">
              <TurnstileWidget
                key={turnstileVersion}
                siteKey={turnstileSiteKey}
                onToken={setTurnstileToken}
              />
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frag nach Bewerbung, Finanzierung oder Studienalltag …"
              aria-label="Nachricht an den Mentor"
              className="min-h-12 max-h-40"
              disabled={streaming}
              maxLength={1_500}
            />
            {streaming ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => abortRef.current?.abort()}
                aria-label="Antwort abbrechen"
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={
                  !input.trim() || Boolean(turnstileSiteKey && !turnstileToken)
                }
                aria-label="Nachricht senden"
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Enter sendet · Shift+Enter fügt eine neue Zeile ein · Bitte keine
            sensiblen persönlichen Daten eingeben.
          </p>
        </form>
      </section>
    </div>
  );
}
