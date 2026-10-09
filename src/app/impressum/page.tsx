import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Vorläufige Anbieterinformationen für Wegwärts.",
};
export const dynamic = "force-dynamic";

export default function ImprintPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-8">
        <p className="mb-2 font-semibold text-[var(--primary)]">Wegwärts</p>
        <h1 className="page-title">Impressum</h1>
        <p className="mt-4 leading-7 text-[var(--muted-foreground)]">
          Vorläufige Anbieterinformationen für die Wegwärts-Demo.
        </p>
      </header>

      <div className="space-y-5">
        <section className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-950">
          <h2 className="text-lg font-semibold">Nicht veröffentlichungsfertig</h2>
          <p className="mt-2 leading-7">
            Dieses Impressum ist unvollständig. Die gesetzlich erforderlichen Angaben
            hängen von der tatsächlichen Anbieter- und Geschäftssituation ab und müssen
            vor einem öffentlichen Start fachkundig geprüft und vollständig ergänzt
            werden. Insbesondere fehlen eine ladungsfähige Anschrift und ein direkter
            elektronischer Kontakt.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_8px_30px_rgba(28,55,48,0.06)] sm:p-8">
          <h2 className="text-xl font-semibold">
            Angaben gemäß § 5 Digitale-Dienste-Gesetz
          </h2>
          <dl className="mt-4 space-y-4 leading-7">
            <div>
              <dt className="font-semibold">Anbieter und inhaltlich verantwortlich</dt>
              <dd className="text-[var(--muted-foreground)]">Bobby Ly</dd>
            </div>
            <div>
              <dt className="font-semibold">Ladungsfähige Anschrift</dt>
              <dd className="text-[var(--muted-foreground)]">
                Vor Veröffentlichung ergänzen.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Direkter Kontakt</dt>
              <dd className="text-[var(--muted-foreground)]">
                E-Mail-Adresse und gegebenenfalls Telefonnummer vor Veröffentlichung
                ergänzen.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Website</dt>
              <dd>
                <a
                  className="font-semibold text-[var(--primary)] underline"
                  href="https://www.bobbyly.com"
                  rel="noreferrer"
                >
                  www.bobbyly.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Weitere Pflichtangaben</dt>
              <dd className="text-[var(--muted-foreground)]">
                Rechtsform, Vertretungsberechtigung, Register- und
                Umsatzsteuerangaben sowie berufsrechtliche Angaben sind – soweit im
                konkreten Fall anwendbar – vor Veröffentlichung zu ergänzen.
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_8px_30px_rgba(28,55,48,0.06)] sm:p-8">
          <h2 className="text-xl font-semibold">Hinweis zu den Inhalten</h2>
          <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
            Wegwärts ist eine unverbindliche Demo zur Bildungsorientierung. Inhalte und
            KI-generierte Antworten können fehlerhaft, unvollständig oder veraltet
            sein. Sie sind keine Rechts-, Finanz-, Medizin-, psychologische, Studien-
            oder Berufsberatung. Verbindliche Informationen, Voraussetzungen und
            Fristen müssen bei den jeweils zuständigen offiziellen Stellen geprüft
            werden.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_8px_30px_rgba(28,55,48,0.06)] sm:p-8">
          <h2 className="text-xl font-semibold">Redaktionell verantwortlich</h2>
          <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
            Ob und welche Angabe nach § 18 Abs. 2 Medienstaatsvertrag erforderlich ist,
            muss vor Veröffentlichung geprüft werden. Falls die Vorschrift anwendbar
            ist, sind Name und vollständige Anschrift der verantwortlichen Person hier
            zu ergänzen.
          </p>
        </section>
      </div>

      <nav className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-[var(--primary)]">
        <Link className="underline" href="/">
          Zur Anwendung
        </Link>
        <Link className="underline" href="/datenschutz">
          Datenschutz
        </Link>
      </nav>
    </main>
  );
}
