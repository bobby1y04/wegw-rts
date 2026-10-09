import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzhinweise für die Wegwärts-Demo.",
};
export const dynamic = "force-dynamic";

const sectionClassName =
  "rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_8px_30px_rgba(28,55,48,0.06)] sm:p-8";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-8">
        <p className="mb-2 font-semibold text-[var(--primary)]">Wegwärts</p>
        <h1 className="page-title">Datenschutzhinweise</h1>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted-foreground)]">
          Diese Hinweise beschreiben die geplante öffentliche Demo. Sie ersetzen keine
          individuelle Rechtsberatung und müssen vor dem Start zusammen mit der
          tatsächlichen technischen Konfiguration rechtlich geprüft werden.
        </p>
      </header>

      <div className="space-y-5">
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-lg font-semibold">Private Portfolio-Demo</h2>
          <p className="mt-2 leading-7">
            Wegwärts wird unentgeltlich als privates Demonstrationsprojekt betrieben.
            Der Betreiber veröffentlicht bewusst keine Wohnanschrift und nimmt das
            damit verbundene rechtliche Restrisiko in Kauf. Technische und rechtliche
            Angaben werden bei Änderungen der eingesetzten Dienste aktualisiert.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">1. Verantwortliche Stelle</h2>
          <div className="mt-3 space-y-2 leading-7 text-[var(--muted-foreground)]">
            <p>Bobby Ly</p>
            <p>
              Projekt- und Kontaktseite:{" "}
              <a
                className="font-semibold text-[var(--primary)] underline"
                href="https://www.bobbyly.com"
                rel="noreferrer"
              >
                www.bobbyly.com
              </a>
            </p>
            <p>
              Datenschutzkontakt:{" "}
              <a
                className="font-semibold text-[var(--primary)] underline"
                href="mailto:bobbyly04@gmail.com"
              >
                bobbyly04@gmail.com
              </a>
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">2. Demo, Alter und Datenminimierung</h2>
          <div className="mt-3 space-y-3 leading-7 text-[var(--muted-foreground)]">
            <p>
              Wegwärts ist eine freiwillige Demo für Personen ab 16 Jahren. Es gibt
              keine Registrierung mit Klarnamen. Stattdessen wird eine anonyme,
              technisch notwendige Sitzung angelegt, die höchstens sieben Tage besteht.
            </p>
            <p>
              Bitte gib keine Namen, Adressen, Kontaktdaten, Zugangsdaten oder andere
              Informationen ein, die dich oder Dritte identifizieren. Gib insbesondere
              keine sensiblen Daten ein, etwa zu Gesundheit, Behinderung, Herkunft,
              Religion, politischen Ansichten, Gewerkschaftszugehörigkeit, Sexualleben
              oder sexueller Orientierung.
            </p>
            <p>
              Die Demo ist nicht für Notfälle, verbindliche Entscheidungen oder die
              Verarbeitung vertraulicher Unterlagen bestimmt.
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">3. Welche Daten verarbeitet werden</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-[var(--muted-foreground)]">
            <li>
              eine zufällige Sitzungskennung in einem technisch notwendigen Cookie,
              Erstellungs- und Ablaufzeitpunkt,
            </li>
            <li>
              freiwillige Demo-Eingaben wie Bildungsphase, Ziele, Aufgabenstatus und
              Mentor-Nachrichten,
            </li>
            <li>
              technisch erforderliche Verbindungs- und Sicherheitsdaten wie IP-Adresse,
              Zeitpunkt, aufgerufene URL, Browserinformationen und Fehlerdaten,
            </li>
            <li>
              Turnstile-Prüfdaten zur Erkennung automatisierter oder missbräuchlicher
              Zugriffe.
            </li>
          </ul>
          <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
            Es ist keine Werbe-, Profiling- oder Reichweitenanalyse vorgesehen.
            Server- und Sicherheitsprotokolle der eingesetzten Anbieter können
            unabhängig von der Demo-Sitzung entstehen.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">4. Zwecke und Rechtsgrundlagen</h2>
          <div className="mt-3 space-y-3 leading-7 text-[var(--muted-foreground)]">
            <p>
              Sitzungs- und Eingabedaten werden verarbeitet, um die von dir aufgerufene
              Demo bereitzustellen (Art. 6 Abs. 1 lit. b DSGVO). Technische Protokolle,
              Turnstile und Schutzmaßnahmen dienen dem sicheren, stabilen und
              missbrauchsarmen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Das berechtigte
              Interesse liegt im Schutz der Demo und ihrer begrenzten Ressourcen.
            </p>
            <p>
              Falls für eine konkrete Funktion eine Einwilligung abgefragt wird, ist
              Art. 6 Abs. 1 lit. a DSGVO die Rechtsgrundlage. Eine Einwilligung kann mit
              Wirkung für die Zukunft widerrufen werden. Die endgültige Zuordnung der
              Rechtsgrundlagen ist vor dem Start rechtlich zu prüfen.
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">5. Empfänger und Dienstleister</h2>
          <ul className="mt-3 list-disc space-y-3 pl-5 leading-7 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">Vercel:</strong> Hosting,
              Auslieferung und technische Protokolle.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Neon:</strong> gehostete
              PostgreSQL-Datenbank für Sitzungs- und Demo-Daten.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">
                Cloudflare Workers AI:
              </strong>{" "}
              Verarbeitung der an den KI-Mentor gesendeten Eingaben und Erzeugung der
              Antwort.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">
                Cloudflare Turnstile:
              </strong>{" "}
              Missbrauchs- und Bot-Schutz; dabei werden technische Nutzungsdaten an
              Cloudflare übermittelt.
            </li>
          </ul>
          <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
            Mit den Dienstleistern sind vor dem Start die erforderlichen
            Auftragsverarbeitungsverträge abzuschließen. Soweit Daten außerhalb des
            Europäischen Wirtschaftsraums verarbeitet werden, müssen die anwendbaren
            Garantien, etwa Angemessenheitsbeschlüsse oder
            EU-Standardvertragsklauseln, dokumentiert und geprüft werden.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">6. Speicherdauer und Löschung</h2>
          <div className="mt-3 space-y-3 leading-7 text-[var(--muted-foreground)]">
            <p>
              Die anonyme Sitzung und die ihr zugeordneten Demo-Daten werden spätestens
              sieben Tage nach der letzten Nutzung automatisch gelöscht. Ein erneuter
              Besuch kann eine neue Sitzung erzeugen.
            </p>
            <p>
              Du kannst außerdem die vorzeitige Löschung verlangen. Nutze dafür den auf{" "}
              <a
                className="font-semibold text-[var(--primary)] underline"
                href="https://www.bobbyly.com"
                rel="noreferrer"
              >
                www.bobbyly.com
              </a>{" "}
              angegebenen Kontakt und sende keine zusätzlichen sensiblen Daten.
              Aufgrund der anonymen Nutzung kann eine Zuordnung nur möglich sein, wenn
              du die noch gültige Sitzungskennung bereitstellst.
            </p>
            <p>
              Technische Protokolle und Sicherheitsdaten werden nach den konfigurierten
              Fristen der Anbieter gelöscht. Diese Fristen sind vor dem Start zu
              prüfen, zu minimieren und hier konkret zu ergänzen.
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">7. KI-Hinweis</h2>
          <div className="mt-3 space-y-3 leading-7 text-[var(--muted-foreground)]">
            <p>
              Mentor-Antworten werden automatisiert mit künstlicher Intelligenz
              erstellt. Eingaben können dafür an Cloudflare Workers AI übertragen
              werden. KI-Ausgaben können falsch, unvollständig, veraltet oder
              missverständlich sein.
            </p>
            <p>
              Wegwärts ersetzt keine Rechts-, Finanz-, Medizin-, psychologische,
              Studien- oder Berufsberatung. Prüfe Fristen, Voraussetzungen und wichtige
              Entscheidungen immer bei einer zuständigen offiziellen oder fachkundigen
              Stelle. Es findet keine ausschließlich automatisierte Entscheidung mit
              rechtlicher oder ähnlich erheblicher Wirkung statt.
            </p>
          </div>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">8. Deine Rechte</h2>
          <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
            Soweit die gesetzlichen Voraussetzungen vorliegen, hast du Rechte auf
            Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
            Datenübertragbarkeit und Widerspruch. Du kannst dich außerdem bei einer
            Datenschutzaufsichtsbehörde beschweren. Wegen der anonymen Nutzung können
            diese Rechte nur erfüllt werden, soweit die betreffenden Daten deiner
            Sitzung zugeordnet werden können.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className="text-xl font-semibold">9. Stand und Änderungen</h2>
          <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
            Stand: 9. Oktober 2026. Diese Hinweise müssen angepasst werden, sobald sich
            Funktionen, Anbieter, Speicherfristen oder die rechtlichen Anforderungen
            ändern.
          </p>
        </section>
      </div>

      <nav className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-[var(--primary)]">
        <Link className="underline" href="/">
          Zur Anwendung
        </Link>
        <Link className="underline" href="/impressum">
          Impressum
        </Link>
      </nav>
    </main>
  );
}
