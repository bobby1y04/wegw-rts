# Codex-Implementierungsauftrag: Wegwärts – KI-gestützter Bildungsnavigator

> **Arbeitsmodus:** Du bist ein autonom arbeitender Senior-Fullstack-Engineer mit ausgeprägtem Produkt-, UX- und DevOps-Verständnis. Implementiere ein tatsächlich startbares MVP in diesem Repository. Erstelle nicht nur ein Konzept, Mockups oder Platzhalter. Triff bei kleineren offenen Fragen selbst sinnvolle Entscheidungen, dokumentiere sie und arbeite ohne unnötige Rückfragen.


## 0. GitHub-Repository und Arbeitsverzeichnis

**Offizielles GitHub-Repository:** https://github.com/bobby1y04/wegw-rts.git  
**Repository-Name auf GitHub:** `bobby1y04/wegw-rts`  
**Projekt-/Produktname in der Anwendung:** **Wegwärts**

Arbeite **in diesem bestehenden Repository** und lege **kein zusätzliches GitHub-Repository** an.

- Wenn Codex bereits im ausgecheckten Repository arbeitet, verwende das vorhandene Arbeitsverzeichnis. **Nicht erneut klonen** und keine zweite verschachtelte Projektstruktur erzeugen.
- Wenn noch kein lokales Repository vorhanden ist und Netzwerk-/Git-Zugriff verfügbar ist, klone das oben genannte Repository und arbeite in dessen Wurzelverzeichnis.
- Prüfe zu Beginn `git status` und `git remote -v`. Falls das Repository ausgecheckt ist, aber `origin` fehlt, setze `origin` auf die oben genannte URL; verändere einen bereits korrekt gesetzten Remote nicht.
- Beachte, dass der GitHub-Slug `wegw-rts` lautet, auch wenn der sichtbare Produktname **Wegwärts** ist. Verwende für interne Paket-/Datenbankbezeichner bei Bedarf die ASCII-Schreibweise `wegwaerts`.
- Respektiere vorhandene Commits und Dateien. **Kein `git push`, Force-Push, Reset oder Löschen fremder Arbeit ohne ausdrücklichen Auftrag.** Lokale Änderungen und neue Dateien sind ausdrücklich erwünscht.
- Fasse in der Abschlussantwort die geänderten Dateien und den Git-Status zusammen.


## 1. Produktvision

**Produktname:** Wegwärts  
**Claim:** „Dein Weg. Dein Tempo. Nicht allein.“  
**Sprache der Benutzeroberfläche:** Deutsch (informelles „du“).  
**Zunächst einziger Nutzer:** der Projektentwickler; private lokale Entwicklungs- und Testumgebung.  
**Ziel:** Ein digitaler Bildungsnavigator, der insbesondere jungen Menschen ohne akademisches familiäres Umfeld hilft, ihren Bildungsweg eigenständig zu planen und die nächsten Schritte zu verstehen.

Wegwärts ist **kein generischer Chatbot**. Der Kern ist ein **personalisierter, handlungsorientierter Bildungsfahrplan**, der auch Themen sichtbar macht, nach denen ein Nutzer noch gar nicht gefragt hat. Ein lokales Sprachmodell ergänzt diesen Fahrplan durch verständliche Erklärungen.

Typische Situationen:

- „Ich möchte studieren, weiß aber nicht, wie die Bewerbung funktioniert.“
- „Meine Familie kennt sich mit Hochschulen nicht aus. Was muss ich beachten?“
- „Welche Finanzierungsmöglichkeiten oder Stipendien sollte ich überhaupt prüfen?“
- „Was muss ich vor der Einschreibung erledigen?“
- „Was bedeutet Modulhandbuch, Sprechstunde oder ECTS?“
- „Wie finde ich heraus, welche Stelle für meine Frage zuständig ist?“

**Produktversprechen:** „Du musst deinen Bildungsweg nicht alleine herausfinden.“

### Zielgruppen für das MVP

1. Menschen **vor dem Studium**, insbesondere in der Phase Studienorientierung, Bewerbung und Finanzierung.
2. Menschen, die **bereits studieren** und Unterstützung bei Studienorganisation, Fördermöglichkeiten und Karriereorientierung suchen.

Vermeide eine defizitorientierte oder bevormundende Ansprache. „Erstakademiker:in“ ist eine mögliche Zielgruppenbeschreibung, kein zwingendes Identitätslabel in der UI. Die Anwendung soll allen offenstehen.

## 2. Nicht verhandelbare technische Rahmenbedingungen

Erstelle ein Fullstack-Monorepo, zunächst **ohne separates Backend-Projekt**:

| Bereich | Technologie |
| --- | --- |
| Webframework | Aktuelles stabiles **Next.js** mit **App Router** |
| UI | **React**, **TypeScript** im Strict Mode |
| Designsystem | **Tailwind CSS**, **shadcn/ui**, **lucide-react** |
| Serverseitige API | **Next.js Route Handlers** (Node.js Runtime) |
| Persistenz | **PostgreSQL** |
| ORM/Migrationen | **Drizzle ORM** und drizzle-kit |
| Eingabevalidierung | **Zod** |
| Lokale KI | **Ollama**, zunächst Modell **`qwen3:4b`** |
| Infrastruktur | **Docker** und **Docker Compose** |
| Unit-/Integrationstests | **Vitest** |
| Browser-E2E-Tests | **Playwright** |
| Paketmanagement | **npm** mit versionierter Lockdatei |

Bevorzuge die zum Implementierungszeitpunkt dokumentierten stabilen APIs. Vermeide unnötige Dependencies, experimentelle Features und unnötige Microservices.

**Keine externen kostenpflichtigen Dienste**: keine Cloud-LLM-API, kein Supabase, kein Clerk, kein externer E-Mail-Dienst, keine Telemetrie, keine Analytics-SaaS. Die Anwendung soll lokal ohne API-Schlüssel und ohne Abonnement laufen. npm- und Docker-Image-Downloads sowie der einmalige Modelldownload sind zulässig.

## 3. Architekturprinzipien

- **Modularer Monolith**: klare Trennung von `app` (Routen/UI), `features` (Anwendungsfälle), `server` (Datenzugriff und KI), `db` (Schema/Migrationen) sowie wiederverwendbaren UI-Komponenten. Passe die Ordnerstruktur an die aktuellen Next.js-Konventionen an.
- **Serverseitige KI-Kommunikation**: Der Browser spricht nur mit Next.js. Nur das Backend spricht mit Ollama.
- **Austauschbarer KI-Anbieter**: Definiere eine kleine `AIProvider`-Abstraktion mit einem funktionierenden `OllamaProvider`. Später sollen weitere Provider möglich sein, ohne die Produktlogik umzuschreiben. Keine verfrühte Implementierung anderer Provider.
- **Deterministische Kernfunktionen**: Onboarding, Aufgabenerstellung, Fortschritt und Fälligkeiten müssen auch funktionieren, wenn Ollama ausgeschaltet ist. Die KI darf kein zentraler Single Point of Failure für die gesamte Anwendung sein.
- **Privacy by Design**: personenbezogene Angaben minimal erheben und nur lokal speichern; keine unnötigen Protokolle von Chatinhalten; keine sensiblen Daten an fremde Dienste.
- **Lokale Entwicklung zuerst**: Das MVP ist ausdrücklich **nicht öffentlich erreichbar**. Docker-Portfreigaben möglichst an `127.0.0.1` binden. Schreibe im README deutlich, dass vor öffentlichem Deployment eine echte Authentifizierung, Autorisierung, Sicherheitsprüfung und Datenschutzkonzeption erforderlich sind.

## 4. Entwicklungs- und Docker-Betriebsarten

Implementiere **beide** folgenden Modi und beschreibe sie exakt im README.

### Modus A – Empfohlene tägliche Entwicklung

- PostgreSQL läuft in Docker Compose.
- Next.js läuft auf dem Host über `npm run dev` (schnelles Hot Reloading).
- Ollama läuft **nativ auf dem Host**; dies ist insbesondere auf macOS/Apple Silicon oft die bessere Wahl für Hardwarebeschleunigung.
- Host-Umgebungsvariablen z. B.:
  - `DATABASE_URL=postgresql://...@127.0.0.1:5432/wegwaerts`
  - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
  - `OLLAMA_MODEL=qwen3:4b`
- Die README muss das Installieren/Starten von Ollama sowie `ollama pull qwen3:4b` und das Starten der DB/Migrationen erläutern.

### Modus B – Vollständig containerisierte lokale Entwicklung

- Docker Compose startet **Next.js, PostgreSQL und Ollama**.
- Die Anwendung erreicht PostgreSQL über den Compose-Servicenamen und Ollama z. B. über `http://ollama:11434`.
- Persistente benannte Volumes für PostgreSQL und Ollama-Modelle.
- DB-Healthcheck und sinnvolle `depends_on`-Bedingungen.
- Einen klar dokumentierten Befehl zum Herunterladen von `qwen3:4b` in den Ollama-Container bereitstellen.
- Das Modell muss **nicht** bei jedem Start neu heruntergeladen werden.
- Nutze gegebenenfalls Compose-Profile, sodass im empfohlenen Modus nicht unnötig ein zweiter Ollama-Dienst startet.
- Containerfreundlicher Start (Migrationen reproduzierbar; keine verlorenen Daten bei Neustart).
- **Keinen GPU-Support für alle Betriebssysteme versprechen**. Dokumentiere, dass Docker-Ollama je nach Betriebssystem ohne GPU-Beschleunigung laufen kann.

Wichtig: Teste die Docker-Konfiguration soweit in der Umgebung möglich. Verhindere Portkonflikte zwischen lokalem und containerisiertem Ollama durch eindeutige Betriebsanweisungen.

## 5. MVP-Umfang: vollständig umsetzen

Implementiere die folgenden **fünf Produktbereiche** und alle dafür nötigen Serverendpunkte, Datenbanktabellen sowie Zustandsübergänge.

### 5.1 Onboarding

Beim ersten Start wird ein ansprechender, mehrstufiger Einrichtungsprozess angezeigt. Er soll in ca. zwei bis drei Minuten abschließbar sein.

Felder:

1. Vorname oder Spitzname (optional).
2. Aktuelle Phase: `vor_dem_studium` oder `im_studium` (Pflicht).
3. Ziel-Studienfach bzw. aktueller Studiengang (optional, Freitext).
4. Ziel-Hochschule bzw. aktuelle Hochschule (optional, Freitext).
5. Bei Studierenden: aktuelles Fachsemester (optional, positive Ganzzahl).
6. Interessenschwerpunkte als Mehrfachauswahl: Studienwahl, Bewerbung, Finanzierung, Stipendien, Studienalltag, Karriere.
7. Optional: „Wünschst du dir mehr Orientierung, weil in deinem Umfeld wenig Erfahrung mit Studium vorhanden ist?“ (Ja / Nein / Möchte ich nicht angeben). Frage respektvoll formulieren und nicht als Voraussetzung für Features verwenden.

Anforderungen:

- Zod-Validierung clientseitig zur Nutzerführung und immer zusätzlich serverseitig.
- Abbrechen/Zurückgehen ohne ungewollten Datenverlust innerhalb des Wizards.
- Nach Abschluss Profil dauerhaft in PostgreSQL speichern.
- Danach automatisch einen **initialen Bildungsfahrplan** aus vordefinierten, versionierbaren Aufgaben-Templates anlegen; idempotent, ohne doppelte Aufgaben beim erneuten Speichern.
- Profil später editierbar machen; bereits erledigte Aufgaben nicht stillschweigend löschen.

### 5.2 Startseite „Heute“ (nicht der Chat!)

Die Startseite ist das Herzstück der Anwendung. Zeige:

- Persönliche Begrüßung.
- Eine prominent dargestellte **nächste sinnvolle Aufgabe** mit konkretem CTA.
- Fortschritt im persönlichen Fahrplan (z. B. `3 von 8 Schritten abgeschlossen`).
- Maximal drei weitere offene Aufgaben mit Links zur Detailansicht.
- Eine kontextabhängige, kuratierte Empfehlung wie „Stipendien recherchieren“, **ohne erfundene individuelle Förderberechtigung oder Frist**.
- Einen leicht erreichbaren Einstieg in den KI-Mentor.
- Einen klaren Leerzustand vor Abschluss des Onboardings.

Die Reihenfolge und Auswahl der Aufgaben muss nachvollziehbar und deterministisch sein, nicht bei jeder Darstellung durch einen KI-Aufruf neu erfunden werden.

### 5.3 „Mein Weg“ – personalisierter Bildungsfahrplan

Für beide Phasen vordefinierte, gut geschriebene Aufgaben-Sets einrichten.

**Beispiele vor dem Studium:**

1. Studieninteressen und Ziele sammeln.
2. Geeignete Studiengänge recherchieren.
3. Zulassungsvoraussetzungen der Zielhochschule prüfen.
4. Offizielle Bewerbungswege und Fristen finden.
5. Bewerbungsunterlagen zusammenstellen.
6. BAföG und andere Finanzierungsmöglichkeiten prüfen.
7. Stipendien recherchieren.
8. Einschreibung und Studienstart vorbereiten.

**Beispiele während des Studiums:**

1. Studienverlaufsplan und Modulhandbuch finden.
2. Prüfungsordnung und Prüfungsanmeldung verstehen.
3. Ansprechpersonen und Beratungsangebote kennenlernen.
4. Studienfinanzierung prüfen.
5. Stipendien und Förderprogramme recherchieren.
6. Eigene Lern- und Semesterorganisation festlegen.
7. Berufliche Orientierung und Praxisoptionen erkunden.

Jede Aufgabe braucht:

- Titel und kurze, leicht verständliche Erläuterung.
- Kategorie/Phase, Reihenfolge/Priorität, Status (`offen`, `in_bearbeitung`, `erledigt`).
- Konkrete **Checkliste** mit 2–5 Teilschritten oder einer handlungsorientierten Anleitung.
- Optionale Links zu neutralen/offiziellen Einstiegspunkten, falls bekannt und stabil.
- „Mentor dazu fragen“-Aktion, die den Aufgabenkontext in den Chat übergibt.
- Optionales vom Nutzer selbst gesetztes Fälligkeitsdatum.

**Besonders wichtig:** Erfinde keine hochschul- oder personenbezogenen Fristen. Ohne geprüfte Quelle oder eigene Nutzereingabe bleibt das Fälligkeitsdatum leer. Zeige ggf. „Frist auf der offiziellen Hochschulseite prüfen“.

Statuswechsel, Checklistenfortschritt und Nutzerfristen müssen in PostgreSQL persistiert werden. Stelle eine einfache Fortschrittsanzeige bereit.

### 5.4 „Mentor“ – lokaler KI-Chat mit Ollama

Bau einen vollständig nutzbaren Chat mit:

- Nachrichtenverlauf (Nutzer/Assistent), lokal persistiert in PostgreSQL.
- Einem klaren Eingabefeld, Absenden mit Enter sowie Shift+Enter für Zeilenumbrüche.
- **Streaming-Antworten** (Text erscheint fortlaufend).
- Ladezustand, Abbruchmöglichkeit und verständliche Fehlerzustände.
- Chatverlauf wieder öffnen; zumindest eine Unterhaltung, gern auch mehrere Unterhaltungen, wenn ohne wesentliche Mehrkomplexität machbar.
- Einleitende Beispiel-Fragen im Leerzustand.
- Kontext aus dem Nutzerprofil und optional einer ausgewählten Fahrplanaufgabe.
- Begrenztem Kontextfenster: sende nicht unkontrolliert den gesamten Verlauf; nutze nachvollziehbare Begrenzung der letzten Nachrichten.
- Sicherem Rendern von Markdown-Antworten; keine unkontrollierte HTML-Ausführung.

**Serverseitiges Systemverhalten des Mentors:**

> Du bist Wegwärts, ein freundlicher, sachkundiger Bildungsmentor für Menschen, die Orientierung rund um Studienwahl, Hochschulbewerbung, Finanzierung, Stipendien, Studienalltag und Berufseinstieg benötigen. Erkläre Begriffe ohne Vorwissen vorauszusetzen. Sei respektvoll, konkret, ermutigend und nicht bevormundend. Formuliere klare nächste Schritte. Stelle höchstens eine gezielte Rückfrage, wenn wirklich nötig. Behaupte keine aktuellen Bewerbungsfristen, Rechtsansprüche, Förderberechtigungen, hochschulspezifischen Prüfungsregeln oder Stipendienbedingungen ohne verifizierte Quelle. Wenn keine aktuelle Quelle vorliegt, kennzeichne Unsicherheit und verweise auf die offizielle zuständige Stelle. Erfinde keine Links, Quellen oder überprüften Tatsachen. Deine Antworten sind Orientierung, keine verbindliche Rechts-, Finanz- oder Studienberatung.

Technische Anforderungen:

- `OLLAMA_BASE_URL` und `OLLAMA_MODEL` ausschließlich über Server-Umgebungsvariablen konfigurierbar.
- Nutze die dokumentierte lokale Ollama-API (z. B. `/api/chat`) mit echter Streaming-Verarbeitung; keine simulierten Streaming-Effekte.
- Serverseitige Zeitlimits/Abort-Signal und vernünftige Behandlung von Verbindungsabbrüchen.
- Falls Ollama nicht erreichbar oder das Modell nicht installiert ist: **keine leere Chatfläche, kein App-Crash**, sondern ein hilfreicher Status mit den notwendigen lokalen Start-/Pull-Befehlen.
- Bei Abbruch oder Fehler keine fälschlich als vollständig gespeicherte KI-Antwort; definiere eine saubere Persistenzstrategie.
- Implementiere einen kleinen, isolierten Fake-/Mock-Provider für automatisierte Tests, damit Tests keinen Modelldownload und keine GPU benötigen.

### 5.5 „Chancen“ – Kuratierte Einstiegspunkte

Baue eine **kleine, statische und transparente** Übersicht für das MVP, keine vorgetäuschte Live-Suchmaschine.

Zeige in sinnvollen Kategorien:

- Stipendien und Begabtenförderung.
- Deutschlandstipendium als Beispiel eines Förderprogramms.
- BAföG und Studienfinanzierung.
- Hochschulberatung und Studierendenwerke.
- Praktika, HiWi- und Werkstudententätigkeit (für Studierende).

Jede Karte soll enthalten:

- Was ist das?
- Für wen könnte es interessant sein?
- Erster sinnvoller Schritt.
- Wenn möglich einen offiziellen, stabilen Einstiegspunkt.
- Den deutlich sichtbaren Hinweis: **„Bedingungen und Fristen bitte auf der offiziellen Seite prüfen.“**

Keine KI-berechneten „90 % Chance auf Stipendium“, keine erfundenen Förderbeträge, keine ungeprüften Bewerbungsdeadlines. Das Matching und eine live gepflegte Stipendiendatenbank sind bewusst **nicht** Teil von Version 0.1.

## 6. Datenmodell und Datenzugriff

Nutze PostgreSQL und Drizzle mit versionierten Migrationen. Plane mindestens folgende logischen Entitäten (konkrete Tabellennamen frei wählbar):

- `users`: technische ID, optionale Anzeigeinformationen; **ein lokaler Entwicklungsnutzer**, vorbereitet für späteren Mehrnutzerbetrieb.
- `profiles`: Phase, Hochschule/Studiengang, Fachsemester, Interessen, optionale Orientierungshilfe-Angabe, Onboarding-Status, Zeitstempel.
- `roadmap_tasks`: Eigentümer, stabile Template-ID, Titel, Beschreibung, Kategorie, Sortierreihenfolge, Status, Fälligkeitsdatum (nullable), Zeitstempel.
- `task_checklist_items`: Aufgabe, Text, Reihenfolge, erledigt.
- `chat_conversations`: Eigentümer, Titel, Zeitstempel.
- `chat_messages`: Konversation, Rolle, Inhalt, Zeitstempel.

Anforderungen:

- UUIDs oder eine gleichwertige robuste ID-Strategie.
- Foreign Keys, sinnvolle Indizes und Constraints.
- Aufgaben-Templates als gut auffindbare, versionierbare Quelldateien; bei Initialisierung idempotent auf Nutzeraufgaben abbilden.
- Datenbank-Migrationen und ein reproduzierbares Seed-Skript für den lokalen Entwicklungsnutzer.
- Keine rein clientseitige Speicherung der produktrelevanten Daten.
- Datenbankoperationen, die mehrere zusammengehörige Datensätze ändern, bei Bedarf in Transaktionen ausführen.

**Authentifizierung in V0.1:** Keine vorgetäuschte Login-Sicherheit. Da die App ausschließlich lokal für einen Tester läuft, darf ein explizit dokumentierter, deterministischer Entwicklungsnutzer verwendet werden. Implementiere **kein öffentlich erreichbares Mehrnutzerprodukt ohne echte Authentifizierung und Autorisierung**. Strukturiere die Daten jedoch so, dass diese später ergänzt werden können.

## 7. UX/UI – warm, ruhig, seriös

Wegwärts soll **nicht** wie ein Behördenportal, ein generisches KI-Dashboard oder eine überladene SaaS-Verwaltung aussehen.

Designziele:

- Ruhiges, freundliches, vertrauenswürdiges Erscheinungsbild.
- Helle warme Grundfläche, dunkle gut lesbare Typografie, dezente Grün-/Petrol-Akzente; ein zusammenhängendes Designsystem über alle Screens.
- Klare visuelle Hierarchie und genügend Weißraum.
- Kleine, sinnvolle Illustrations-/Icon-Akzente statt dekorativer Überladung.
- Gute mobile Nutzung ab ca. 360 px Breite; sinnvolle Desktop-Sidebar und mobile Navigation.
- Barrierearme Formulare: echte Labels, Tastaturbedienbarkeit, sichtbare Fokuszustände, ausreichende Kontraste, semantische HTML-Struktur, sinnvolle ARIA-Angaben.
- Kein unnötiger Dark Mode im MVP.
- Deutsche, verständliche UI-Texte, keine englischen Placeholder wie „Lorem ipsum“.
- Produktname konsequent **„Wegwärts“** und Claim **„Dein Weg. Dein Tempo. Nicht allein.“** verwenden.

### Seiten und Navigation

- `/` – falls kein Onboarding vorhanden, zum Onboarding; sonst zur Startseite leiten.
- `/onboarding` – mehrstufiger Wizard.
- `/dashboard` – „Heute“.
- `/weg` – Bildungsfahrplan und Aufgaben.
- `/weg/[taskId]` – Aufgabendetails und Checkliste.
- `/mentor` – KI-Chat.
- `/chancen` – kuratierte Chancen.
- `/profil` – Profil ansehen/bearbeiten.

Auf Desktop Sidebar, mobil platzsparende gut bedienbare Navigation. Jeder angezeigte Button muss eine sinnvolle Funktion haben; keine klickbaren Attrappen.

## 8. Fehlerfälle und Sicherheit

Setze mindestens Folgendes um:

- Zod-Validierung für alle schreibenden API-Routen.
- API-Fehler konsistent in einem dokumentierten JSON-Format; keine Stacktraces im Frontend.
- Klare Statuscodes und informative nutzerfreundliche Fehlermeldungen.
- Serverseitige Prüfung von IDs und gültigen Statusübergängen.
- Keine SQL-Stringverkettung mit Nutzereingaben; Drizzle verwenden.
- Keine Hardcodierung von Zugangsdaten im Quellcode; lokale Beispielwerte in `.env.example` oder dokumentierter Docker-Entwicklungskonfiguration sind zulässig.
- `.env*` mit Ausnahme der bewusst freigegebenen `.env.example` gitignorieren.
- Chatantworten und Nutzereingaben XSS-sicher rendern.
- Keine implizite automatische Ausführung von Shell-Befehlen oder Dateizugriffen durch LLM-Ausgaben.
- Lokale Ports standardmäßig nicht ins öffentliche Netzwerk exponieren.
- Keine sensiblen Beispiel-Profildaten in Seed-Datensätzen verwenden.
- Klare UI-Kennzeichnung bei nicht belegbaren, aktuellen oder rechtlich relevanten Aussagen.

## 9. Projektstruktur und Dokumentation

Erstelle eine nachvollziehbare Struktur, beispielsweise:

```text
wegwaerts/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── weg/
│   │   ├── mentor/
│   │   ├── chancen/
│   │   └── profil/
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── features/
│   ├── server/
│   │   ├── ai/
│   │   └── repositories/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── migrations/
│   │   └── seed.ts
│   └── lib/
├── tests/
├── public/
├── Dockerfile
├── compose.yaml
├── .env.example
├── README.md
└── package.json
```

Die konkrete Struktur darfst du an bewährte Next.js-Konventionen anpassen. Vermeide zyklische Abhängigkeiten und übergroße Dateien.

**README.md** in deutscher Sprache mit:

1. Produktbeschreibung und Grenzen von V0.1.
2. Voraussetzungen (Node/npm, Docker Compose, optional lokales Ollama).
3. Schnellstart **Modus A** mit vollständigen Befehlen.
4. Schnellstart **Modus B** mit vollständigen Befehlen.
5. Download und Wechsel des Ollama-Modells.
6. `.env`-Konfiguration inklusive aller Variablen.
7. Datenbank-Migration und Seed.
8. Test-, Lint-, Typecheck- und Build-Befehle.
9. Bekannte Einschränkungen (lokaler Nutzer, keine Live-Fristen, keine Stipendiensuche, keine echte Authentifizierung).
10. Fehlerbehebung bei „Ollama nicht erreichbar“, „Modell fehlt“, Portkonflikt und nicht verfügbarer Datenbank.
11. Vor einer öffentlichen Bereitstellung notwendige Sicherheits- und Datenschutzmaßnahmen.

## 10. Tests und Qualitätssicherung

Richte ausführbare npm-Skripte ein, mindestens:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run db:migrate
npm run db:seed
```

Schreibe sinnvolle Tests für:

- Onboarding-Validierung und Profilspeicherung.
- Erzeugung von Aufgaben-Templates ohne Duplikate.
- Statuswechsel, Checklisten-Updates und Fortschrittsberechnung.
- Auswahl der nächsten Aufgabe.
- Behandlung ungültiger API-Eingaben.
- Erstellung eines KI-Prompts aus Profil und optionalem Aufgabenkontext.
- Fehlerfall: Ollama nicht erreichbar oder Modell nicht vorhanden.
- Streaming-Verarbeitung mit einem **Mock-AI-Provider**.

Mindestens ein Playwright-E2E-Pfad soll den Kernfluss ohne echte KI abdecken:

`Onboarding → Dashboard → Mein Weg → Aufgabe abhaken → Fortschritt sichtbar`.

Optional ein zweiter E2E-Test für Chat mit Mock-Provider.

Führe alle in deiner Umgebung ausführbaren Prüfungen tatsächlich aus und behebe Fehler. Falls Docker/Ollama oder ein Browser in deiner Ausführungsumgebung nicht verfügbar sind, dokumentiere konkret, welche Tests nicht ausgeführt werden konnten, statt einen Erfolg vorzutäuschen.

## 11. Ausdrücklich NICHT Teil von Version 0.1

Bitte nicht implementieren oder nur als rein konzeptionellen Zukunftspunkt im README nennen:

- Native iOS-/Android-Apps oder App-Store-Veröffentlichung.
- Mehrnutzer-Registrierung, OAuth, echte Authentifizierung.
- Zahlungssysteme, Sponsoren-Dashboards oder Abonnements.
- Automatische E-Mails und Push-Notifications.
- Web-Scraping von Hochschulen oder Stipendienportalen.
- Behauptete Echtzeit-Fristen, rechtsverbindliche Studienberatung.
- PDF-/Foto-Upload und Dokumentenauswertung.
- Hochschulspezifische RAG-Wissensdatenbank oder `pgvector`.
- Automatisches Stipendien-Matching mit erfundenen Bewertungen.
- Agenten, die selbständig Bewerbungen abschicken oder externe Konten bedienen.
- Komplexe Eventbusse, Queue-Systeme, Microservices, Kubernetes.

Entscheidend ist **eine kleine, durchgehend funktionierende Anwendung statt vieler halbfertiger Features**.

## 12. Vorgehensweise für Codex

1. **Repository inspizieren:** Prüfe vorhandene Dateien; überschreibe vorhandene sinnvolle Arbeit nicht unbegründet.
2. **Kurz planen:** Lege eine kompakte interne Implementierungsreihenfolge fest; frage nur, wenn ein echter Blocker vorliegt.
3. **Projekt initialisieren:** Next.js/TypeScript/Tailwind, UI-Bibliothek, Linting, Testing, Docker.
4. **Datenbank umsetzen:** Drizzle-Schema, Migrationen, Seed, serverseitige Repositories.
5. **Produktlogik umsetzen:** Onboarding, Aufgaben-Templates, Fortschritt, Dashboard, Profileditierung.
6. **Screens umsetzen:** konsistentes responsives Layout und voll funktionsfähige Navigation.
7. **KI integrieren:** austauschbarer Provider, Ollama, Streaming, Fehlermeldungen, Persistenz.
8. **Chancen-Seite umsetzen:** kuratierte, ehrlich gekennzeichnete Inhalte.
9. **Tests schreiben und ausführen:** Unit, Integration, soweit möglich E2E und Docker-Smoke-Test.
10. **Dokumentieren und aufräumen:** README, `.env.example`, bekannte Einschränkungen, keine ungenutzten Platzhalter.

Implementiere selbständig bis zum lauffähigen Ergebnis. Wenn die Ausführungsumgebung ein Tool nicht bereitstellt, arbeite an den übrigen Teilen weiter und benenne die genaue Einschränkung.

## 13. Definition of Done / Abnahmekriterien

Das MVP gilt erst als fertig, wenn diese Punkte erfüllt sind:

- [ ] Das Projekt lässt sich nach README ohne kostenpflichtigen Account lokal starten.
- [ ] PostgreSQL-Daten bleiben nach Neustart erhalten.
- [ ] Ein neuer lokaler Nutzer kann den Onboarding-Wizard abschließen.
- [ ] Das Profil ist gespeichert und später editierbar.
- [ ] Nach dem Onboarding existiert ein passender Bildungsfahrplan.
- [ ] Aufgaben lassen sich öffnen, bearbeiten und abhaken.
- [ ] Der Fortschritt aktualisiert sich nachvollziehbar und bleibt nach Reload erhalten.
- [ ] Die Startseite zeigt sinnvolle nächste Schritte und keinen leeren Chat als Hauptinhalt.
- [ ] Die Chancen-Seite zeigt transparente, brauchbare Orientierungspunkte.
- [ ] Der Mentor kommuniziert mit einem lokalen Ollama-Modell und streamt Antworten.
- [ ] Chatnachrichten werden persistiert und können wieder angezeigt werden.
- [ ] Ohne gestartetes Ollama bleiben Dashboard, Profil und Fahrplan verwendbar.
- [ ] Fehlendes Ollama/Modell führt zu einer verständlichen Fehlermeldung.
- [ ] Die App ist auf Smartphone und Desktop nutzbar und per Tastatur grundlegend bedienbar.
- [ ] Secrets und persönliche Daten landen nicht versehentlich im Git-Repository.
- [ ] Lint, Typecheck, Tests und Production-Build sind erfolgreich oder präzise als blockiert dokumentiert.
- [ ] Beide dokumentierten Betriebsarten besitzen konkrete reproduzierbare Startbefehle.
- [ ] Alle sichtbaren Funktionen sind echt implementiert; keine Fake-Daten als vermeintliche Live-Information.

## 14. Erwartete Abschlussantwort von Codex

Nach der Implementierung gib eine knappe, konkrete Übergabe **auf Deutsch**:

1. Was implementiert wurde.
2. Wichtige Architekturentscheidungen und eventuelle Abweichungen vom Auftrag.
3. **Exakte Befehle** zum lokalen Starten (Modus A und Modus B).
4. Wie Ollama und `qwen3:4b` eingerichtet werden.
5. Welche Tests du ausgeführt hast und ihre tatsächlichen Ergebnisse.
6. Welche Einschränkungen noch bestehen und was der logisch nächste Entwicklungsschritt wäre.

**Starte jetzt mit der Implementierung im aktuellen Repository. Erzeuge echten, ausführbaren Code – keinen bloßen Implementierungsplan.**
