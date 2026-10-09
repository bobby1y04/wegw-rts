# Wegwärts

**Dein Weg. Dein Tempo. Nicht allein.**

Wegwärts ist ein lokaler, KI-gestützter Bildungsnavigator. Die Anwendung verbindet einen
persönlichen Bildungsfahrplan mit Aufgaben, Fortschritt und einem optionalen Mentor auf
Basis eines lokal betriebenen Ollama-Modells. Der deterministische Fahrplan bleibt auch
ohne Ollama nutzbar.

Version 0.1 richtet sich an einen einzelnen lokalen Entwicklungsnutzer. Sie bietet
Orientierung vor und während des Studiums, aber keine verbindliche Rechts-, Finanz- oder
Studienberatung. Fristen, Förderbedingungen und hochschulspezifische Regeln müssen immer
bei der zuständigen offiziellen Stelle geprüft werden.

## Funktionsumfang und Grenzen

- Onboarding und editierbares lokales Profil
- persönlicher Fahrplan mit Aufgaben, Checklisten, Status und optionalen Fälligkeiten
- Dashboard mit dem nächsten nachvollziehbar bestimmten Schritt
- lokaler, streamender KI-Mentor über Ollama
- kuratierte Einstiegspunkte für Finanzierung, Stipendien, Beratung und Berufspraxis
- keine Registrierung, keine echte Authentifizierung und kein Mehrnutzerbetrieb
- keine Live-Fristen, Live-Stipendiensuche oder automatische Förderberechtigungsprüfung
- keine externen KI-, Analyse- oder Telemetriedienste

## Voraussetzungen

- Node.js 22
- Corepack und **pnpm 10.21.0**
- Docker mit Docker Compose
- für Modus A: [Ollama](https://ollama.com/download) nativ auf dem Host
- ausreichend Speicherplatz für PostgreSQL, Images und das Modell `qwen3:4b`

Corepack stellt die im Projekt festgelegte pnpm-Version bereit:

```bash
corepack enable
corepack prepare pnpm@10.21.0 --activate
pnpm --version
pnpm install --frozen-lockfile
```

## Modus A: tägliche Entwicklung (empfohlen)

In diesem Modus läuft nur PostgreSQL in Docker. Next.js und Ollama laufen nativ auf dem
Host. Das bietet schnelles Hot Reloading und ist insbesondere unter macOS/Apple Silicon
meist die sinnvollere Ollama-Konfiguration.

1. Lokale Konfiguration anlegen:

   ```bash
   cp .env.example .env.local
   ```

2. PostgreSQL starten:

   ```bash
   docker compose up -d db
   docker compose ps
   ```

3. Ollama installieren und starten. Unter macOS ist beispielsweise Homebrew möglich:

   ```bash
   brew install ollama
   ollama serve
   ```

   `ollama serve` bleibt in diesem Terminal aktiv. Alternativ kann die Ollama-App
   gestartet werden. In einem zweiten Terminal wird das Modell **einmalig** geladen:

   ```bash
   ollama pull qwen3:4b
   ollama list
   ```

4. Schema migrieren, lokalen Entwicklungsnutzer anlegen und Next.js starten:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   pnpm dev
   ```

Die Anwendung ist anschließend unter <http://127.0.0.1:3000> erreichbar. PostgreSQL
bleibt im benannten Volume `postgres_data` erhalten.

Modus A verwendet standardmäßig:

```dotenv
DATABASE_URL=postgresql://wegwaerts:wegwaerts@127.0.0.1:5432/wegwaerts
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
```

## Modus B: vollständig in Docker

Dieser Modus startet App, PostgreSQL, Initialisierung und Ollama im Compose-Profil
`full`. Alle veröffentlichten Ports sind ausschließlich an `127.0.0.1` gebunden.

Falls ein natives Ollama bereits Port `11434` verwendet, dieses zuerst beenden oder für
Compose einen anderen Host-Port setzen:

```bash
export OLLAMA_PORT=11435
```

Danach Ollama und PostgreSQL starten und das Modell **einmalig** in das persistente
Ollama-Volume laden:

```bash
docker compose --profile full up -d db ollama
docker compose --profile full exec ollama ollama pull qwen3:4b
docker compose --profile full up --build -d
docker compose --profile full ps
```

Der Dienst `init` wartet auf die gesunde Datenbank, führt Migration und Seed aus und
beendet sich erfolgreich. Erst danach startet `app`. Ein beendeter `init`-Container mit
Status `0` ist deshalb erwartetes Verhalten.

Die Anwendung ist unter <http://127.0.0.1:3000> erreichbar. App und Container-Ollama
kommunizieren intern über `http://ollama:11434`; `OLLAMA_PORT` ändert nur den vom Host
erreichbaren Port. Daten liegen in den benannten Volumes `postgres_data` und
`ollama_data`.

Container-Ollama kann je nach Betriebssystem und Docker-Installation ohne
GPU-Beschleunigung laufen und dadurch deutlich langsamer sein. Diese Konfiguration
verspricht ausdrücklich keine GPU-Unterstützung.

Stoppen, ohne Daten zu löschen:

```bash
docker compose --profile full down
```

Die Volumes werden nur auf ausdrücklichen Wunsch gelöscht:

```bash
docker compose --profile full down --volumes
```

Dieser letzte Befehl löscht die lokale Datenbank und das heruntergeladene Modell.

## Konfiguration

`.env.example` dokumentiert alle Betriebsvariablen:

- `DATABASE_URL`: PostgreSQL-Verbindung für auf dem Host gestartete Prozesse
- `OLLAMA_BASE_URL`: serverseitige Ollama-Basis-URL; niemals vom Browser direkt genutzt
- `OLLAMA_MODEL`: Modellname, standardmäßig `qwen3:4b`
- `OLLAMA_TIMEOUT_MS`: serverseitiges Zeitlimit für eine Mentor-Antwort
- `AI_PROVIDER`: `ollama` im Betrieb; `mock` ausschließlich für automatisierte Tests
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: lokale Compose-Datenbank
- `POSTGRES_PORT`: localhost-Port der Datenbank, standardmäßig `5432`
- `TEST_POSTGRES_PORT`: Port der isolierten, flüchtigen Testdatenbank, standardmäßig `55432`
- `APP_PORT`: localhost-Port der containerisierten App, standardmäßig `3000`
- `OLLAMA_PORT`: localhost-Port des Container-Ollama, standardmäßig `11434`
- `OLLAMA_IMAGE`: verwendetes Ollama-Container-Image
- `NEXT_TELEMETRY_DISABLED`: deaktiviert die Next.js-Telemetrie

Compose setzt für App und Init absichtlich interne URLs mit den Servicenamen `db` und
`ollama`; `DATABASE_URL` und `OLLAMA_BASE_URL` aus `.env.local` gelten für Modus A.
Echte Zugangsdaten gehören nicht ins Repository. Die mitgelieferten Werte sind nur für
eine lokale, nicht öffentlich erreichbare Entwicklungsumgebung gedacht.

### Ollama-Modell wechseln

Im Hostbetrieb:

```bash
ollama pull ANDERES_MODELL
```

Danach `OLLAMA_MODEL=ANDERES_MODELL` in `.env.local` setzen und Next.js neu starten.

Im Containerbetrieb:

```bash
docker compose --profile full exec ollama ollama pull ANDERES_MODELL
OLLAMA_MODEL=ANDERES_MODELL docker compose --profile full up -d --force-recreate app
```

Der Modellname muss bei beiden Befehlen identisch sein. Modelle werden im Volume
`ollama_data` gespeichert und nicht bei jedem Start erneut geladen.

## Datenbank: Migration und Seed

Auf dem Host:

```bash
pnpm db:migrate
pnpm db:seed
```

Im Container, unabhängig vom regulären Start:

```bash
docker compose --profile full run --rm init pnpm db:migrate
docker compose --profile full run --rm init pnpm db:seed
```

Migrationen sind versioniert. Das Seed-Skript muss reproduzierbar und idempotent sein;
es legt ausschließlich den deterministischen lokalen Entwicklungsnutzer und notwendige
Ausgangsdaten an.

## Entwicklung und Qualitätssicherung

Alle Projektbefehle verwenden pnpm 10.21.0:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:watch
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Unit-Tests benötigen keine laufenden Dienste. Für Integration und E2E steht eine
isolierte, flüchtige PostgreSQL-Instanz im Compose-Profil `test` bereit:

```bash
docker compose --profile test up -d db_test
DATABASE_URL=postgresql://wegwaerts:wegwaerts@127.0.0.1:55432/wegwaerts_test pnpm db:migrate
DATABASE_URL_TEST=postgresql://wegwaerts:wegwaerts@127.0.0.1:55432/wegwaerts_test pnpm test:integration
pnpm exec playwright install chromium
pnpm test:e2e
docker compose --profile test down
```

Der E2E-Kernpfad verwendet `AI_PROVIDER=mock` und benötigt weder Ollama noch einen
Modelldownload. Setze bei einem abweichenden Port `E2E_DATABASE_URL` entsprechend.

Das Produktionsimage erwartet Next.js-Standalone-Ausgabe (`output: "standalone"` in der
Next-Konfiguration). Es enthält nur den Standalone-Server, statische Assets und
öffentliche Dateien. Migrationen laufen bewusst im separaten kurzlebigen `init`-Image.

## Fehlerbehebung

### Ollama ist nicht erreichbar

Im Hostbetrieb prüfen:

```bash
curl http://127.0.0.1:11434/api/tags
ollama list
```

Falls die Anfrage fehlschlägt, Ollama mit `ollama serve` beziehungsweise über die
Ollama-App starten und `OLLAMA_BASE_URL` kontrollieren.

Im Containerbetrieb:

```bash
docker compose --profile full ps ollama
docker compose --profile full logs ollama
docker compose --profile full exec ollama ollama list
```

Dashboard, Profil und Fahrplan funktionieren weiterhin ohne Ollama; nur der Mentor ist
dann nicht verfügbar.

### Das Modell fehlt

```bash
# Modus A
ollama pull qwen3:4b

# Modus B
docker compose --profile full exec ollama ollama pull qwen3:4b
```

Anschließend prüfen, ob `OLLAMA_MODEL` exakt dem Namen in `ollama list` entspricht.

### Port ist bereits belegt

Für Modus A müssen `5432`, `3000` und bei nativem Ollama `11434` frei sein. Alternative
Compose-Hostports können vor dem Start gesetzt werden:

```bash
POSTGRES_PORT=55432 docker compose up -d db
APP_PORT=3001 OLLAMA_PORT=11435 docker compose --profile full up -d
```

Bei einem alternativen Datenbankport in Modus A muss auch `DATABASE_URL` in
`.env.local` angepasst werden. Im vollständigen Dockerbetrieb bleiben die internen Ports
und URLs unverändert.

### Datenbank ist nicht verfügbar

```bash
docker compose ps db
docker compose logs db
docker compose exec db pg_isready -U wegwaerts -d wegwaerts
```

Bei geänderten `POSTGRES_USER`- oder `POSTGRES_DB`-Werten dieselben Werte an
`pg_isready` übergeben. Danach Migration und Seed erneut ausführen. Bestehende
PostgreSQL-Volumes übernehmen geänderte Initial-Zugangsdaten nicht automatisch; in
einer entbehrlichen lokalen Umgebung kann das Volume bewusst gelöscht und neu angelegt
werden.

### Init oder App startet nicht

```bash
docker compose --profile full ps -a
docker compose --profile full logs init
docker compose --profile full logs app
```

Die App startet nur, wenn der Datenbank-Healthcheck und der Init-Schritt erfolgreich
waren. So läuft kein Server gegen ein veraltetes Schema.

## Sicherheit und öffentliche Bereitstellung

Wegwärts 0.1 ist ausschließlich für einen lokalen Tester vorgesehen. Die
localhost-Bindung der Docker-Ports ersetzt keine Authentifizierung. Vor jeder
öffentlichen Bereitstellung sind mindestens erforderlich:

- echte Authentifizierung, sichere Sitzungen und konsequente Autorisierung pro Datensatz
- produktionsgeeignete Secrets-Verwaltung und getrennte Datenbankzugänge
- TLS, sichere Proxy-Konfiguration, Security Header und Rate Limits
- Bedrohungsmodell, Abhängigkeits- und Container-Scans sowie Sicherheitsprüfung
- Datenschutzkonzept mit Rechtsgrundlage, Lösch- und Auskunftsprozessen,
  Aufbewahrungsfristen und verständlicher Datenschutzerklärung
- Prüfung von Protokollierung, Backups, Wiederherstellung und Zugriffsschutz
- fachliche und rechtliche Prüfung aller Beratungsgrenzen und sichtbaren Hinweise

Ohne diese Maßnahmen darf die Anwendung nicht ins öffentliche Netz gestellt werden.
