# Wegwärts

**Dein Weg. Dein Tempo. Nicht allein.**

Wegwärts ist ein KI-gestützter Bildungsnavigator. Die Anwendung verbindet einen
persönlichen Bildungsfahrplan mit Aufgaben, Fortschritt und einem optionalen Mentor.
Lokal kann der Mentor über Ollama laufen; für eine öffentliche Demo ist Cloudflare
Workers AI vorgesehen. Der deterministische Fahrplan bleibt ohne KI-Anbieter nutzbar.

Die Demo dient der Orientierung vor und während des Studiums, aber nicht als
verbindliche Rechts-, Finanz-, Medizin-, psychologische, Studien- oder Berufsberatung.
KI-Ausgaben können falsch, unvollständig oder veraltet sein. Fristen,
Förderbedingungen und hochschulspezifische Regeln müssen immer bei der zuständigen
offiziellen Stelle geprüft werden.

## Funktionsumfang und Grenzen

- Onboarding und editierbares lokales Profil
- persönlicher Fahrplan mit Aufgaben, Checklisten, Status und optionalen Fälligkeiten
- Dashboard mit dem nächsten nachvollziehbar bestimmten Schritt
- streamender KI-Mentor über lokales Ollama oder in der Demo über Cloudflare Workers AI
- kuratierte Einstiegspunkte für Finanzierung, Stipendien, Beratung und Berufspraxis
- öffentliche Demo mit anonymen, auf sieben Tage begrenzten Sitzungen; keine Konten
- keine Live-Fristen, Live-Stipendiensuche oder automatische Förderberechtigungsprüfung
- Cloudflare Turnstile als Bot- und Missbrauchsschutz in der öffentlichen Demo
- keine Werbe-, Profiling- oder Reichweitenanalyse

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

   Geheimniswerte bleiben in der Vorlage absichtlich leer. Für die mitgelieferte
   lokale Compose-Datenbank mindestens folgende Werte in `.env.local` setzen:

   ```dotenv
   DATABASE_URL=postgresql://wegwaerts:wegwaerts@127.0.0.1:5432/wegwaerts
   POSTGRES_PASSWORD=wegwaerts
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

- `DATABASE_URL`: PostgreSQL-Verbindung für Runtime-Zugriffe; in Vercel die gepoolte
  Neon-Verbindung
- `DATABASE_MIGRATION_URL`: direkte, ungepoolte Neon-Verbindung ausschließlich für
  Migrationen
- `SESSION_SECRET`: Signatur-/Verschlüsselungssecret für anonyme Demo-Sitzungen
- `IP_HASH_SECRET`: separates Secret für pseudonymisierte Missbrauchslimits
- `CRON_SECRET`: schützt den täglichen Bereinigungsendpunkt
- `AI_ENABLED`, `AI_MAX_OUTPUT_TOKENS`: serverseitiger KI-Hard-Stop und Ausgabelimit
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_API_TOKEN`, `CLOUDFLARE_AI_MODEL`:
  serverseitige Workers-AI-Konfiguration
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: öffentlicher Turnstile-Site-Key
- `TURNSTILE_SECRET_KEY`: serverseitiger Turnstile-Secret-Key
- `OLLAMA_BASE_URL`: serverseitige Ollama-Basis-URL; niemals vom Browser direkt genutzt
- `OLLAMA_MODEL`: Modellname, standardmäßig `qwen3:4b`
- `OLLAMA_TIMEOUT_MS`: serverseitiges Zeitlimit für eine Mentor-Antwort
- `AI_PROVIDER`: `workers-ai` in der öffentlichen Demo, `ollama` lokal und `mock`
  ausschließlich für automatisierte Tests
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: lokale Compose-Datenbank
- `POSTGRES_PORT`: localhost-Port der Datenbank, standardmäßig `5432`
- `TEST_POSTGRES_PORT`: Port der isolierten, flüchtigen Testdatenbank, standardmäßig `55432`
- `APP_PORT`: localhost-Port der containerisierten App, standardmäßig `3000`
- `OLLAMA_PORT`: localhost-Port des Container-Ollama, standardmäßig `11434`
- `OLLAMA_IMAGE`: verwendetes Ollama-Container-Image
- `DATABASE_URL_TEST`, `E2E_DATABASE_URL`: isolierte Datenbanken für Integration und E2E
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

## Öffentliche Demo auf kostenlosen Tarifen

Die vorgesehene Kombination ist Vercel Hobby, Neon Free und Cloudflare für Workers AI,
Turnstile sowie eine **DNS-only** geschaltete Subdomain. Die folgenden Schritte sind
eine Anleitung; sie führen selbst keine externe Einrichtung aus.

Für die konto- und secretgebundenen Schritte gibt es einen interaktiven Wizard:

```bash
./scripts/deploy-wizard.sh
```

Er öffnet die jeweiligen Dashboards, speichert kopierte Secrets ausschließlich in der
gitignorierten `.env.production.local`, führt Migrationen nur nach Bestätigung aus und
stoppt, wenn rechtliche Angaben oder Launch-Prüfungen noch fehlen.

### 1. Neon-Datenbank

1. Ein Neon-Projekt in einer EU-Region anlegen, sofern eine passende Region verfügbar
   ist. Für Produktion und Preview mindestens getrennte Neon-Branches, besser getrennte
   Projekte mit getrennten Zugangsdaten verwenden.
2. Aus dem Neon-Dashboard beide Verbindungsarten kopieren:
   - die **gepoolte** Verbindung als `DATABASE_URL` für die Vercel-Runtime;
   - die **direkte, ungepoolte** Verbindung als `DATABASE_MIGRATION_URL`.
3. `sslmode=require` beibehalten. Zugangsdaten niemals committen, in Logs ausgeben oder
   an den Browser übertragen.
4. Migrationen von einem vertrauenswürdigen Rechner mit der direkten URL ausführen.
   Das Migrationsskript bevorzugt dafür `DATABASE_MIGRATION_URL`:

   ```bash
   DATABASE_MIGRATION_URL="<direkte Neon-URL>" pnpm db:migrate
   ```

Die gepoolte URL ist für kurzlebige und parallele Serverless-Verbindungen ausgelegt.
Migrationen brauchen dagegen eine direkte Verbindung und dürfen nicht beim Start jeder
Vercel-Instanz laufen. Produktionsdaten dürfen nicht in Preview-Deployments verwendet
werden.

### 2. Cloudflare Workers AI und Turnstile

1. Einen API-Token mit den kleinstmöglichen Berechtigungen für Workers AI erstellen und
   `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_API_TOKEN` und
   `CLOUDFLARE_AI_MODEL` notieren.
2. Ein Turnstile-Widget für die spätere Produktions-Subdomain erstellen. Den Site-Key
   als `NEXT_PUBLIC_TURNSTILE_SITE_KEY` und den geheimen Schlüssel als
   `TURNSTILE_SECRET_KEY` hinterlegen.
3. Für Preview-Deployments ein eigenes Widget beziehungsweise die offiziellen
   Turnstile-Testschlüssel und einen separaten Workers-AI-Token verwenden. Keine
   Produktionssecrets zum bequemen Testen in den Preview-Scope kopieren.
4. Hostname-Einschränkungen des Turnstile-Widgets nach jedem Domainwechsel kontrollieren.

Mentor-Eingaben werden bei `AI_PROVIDER=workers-ai` an Cloudflare Workers AI
übertragen. Deshalb dürfen Nutzerinnen und Nutzer keine sensiblen oder identifizierenden
Daten eingeben; der sichtbare KI- und Datenschutzhinweis ist Bestandteil des
Deployment-Gates.

### 3. Vercel-Hobby-Projekt

1. Das Repository in Vercel importieren, das Next.js-Framework-Preset und `pnpm` anhand
   des Repositorys erkennen lassen. Build- und Install-Overrides sind normalerweise
   nicht erforderlich.
2. In **Project Settings → Environment Variables** die Produktionswerte eintragen.
   Secrets nur für **Production** freigeben. Für **Preview** vollständig getrennte
   Werte setzen; **Development** bleibt lokal in `.env.local`.
   `DATABASE_MIGRATION_URL` nicht an die Vercel-Runtime geben, sondern nur in einer
   geschützten Migrationsumgebung vorhalten.
3. Vor dem ersten produktiven Deployment mit der direkten Neon-Verbindung migrieren.
   Danach den Production-Deploy auslösen und `/datenschutz`, `/impressum`, Turnstile,
   Sitzungsablauf und KI-Fehlerfälle prüfen.
4. In Production mindestens folgende Werte kontrollieren:

   ```dotenv
   DATABASE_URL=<gepoolte Neon-URL>
   APP_ORIGIN=https://wegwaerts.bobbyly.com
   PUBLIC_DEMO=true
   SESSION_SECRET=<zufällig, nur Production>
   IP_HASH_SECRET=<separat zufällig, nur Production>
   CRON_SECRET=<zufällig, nur Production>
   AI_PROVIDER=workers-ai
   AI_ENABLED=true
   AI_MAX_OUTPUT_TOKENS=500
   CLOUDFLARE_ACCOUNT_ID=<Production-Konto>
   CLOUDFLARE_AI_API_TOKEN=<minimal berechtigter Production-Token>
   CLOUDFLARE_AI_MODEL=<freigegebenes Workers-AI-Modell>
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=<Site-Key der Production-Subdomain>
   TURNSTILE_SECRET_KEY=<Production-Secret>
   NEXT_TELEMETRY_DISABLED=1
   ```

Zusätzlich in der getrennten Migrationsumgebung prüfen:

```dotenv
DATABASE_MIGRATION_URL=<direkte Neon-URL>
```

`SESSION_SECRET`, `IP_HASH_SECRET` und `CRON_SECRET` müssen voneinander verschieden sein
und jeweils aus mindestens 32 zufälligen Bytes bestehen. `AI_ENABLED=false` ist der
operative Hard-Stop für neue KI-Anfragen. Werte mit `NEXT_PUBLIC_` sind Bestandteil des
Browser-Bundles und dürfen nie geheim sein. Nach Änderungen an Variablen ist ein neues
Deployment erforderlich.

### 4. Tägliche Löschung

`vercel.json` plant täglich um `03:00 UTC` einen Aufruf von
`/api/cron/cleanup`:

```json
{
  "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }]
}
```

Vercel sendet bei gesetztem `CRON_SECRET` den Header
`Authorization: Bearer <CRON_SECRET>`. Der Endpunkt muss diesen Wert konstantzeitnah
prüfen, ausschließlich abgelaufene Sitzungen samt zugehörigen Daten löschen,
idempotent sein und ohne Secret mit `401` oder `403` antworten. Auf Hobby ist der
Ausführungszeitpunkt eines täglichen Cronjobs nicht minutengenau garantiert.

Der Endpunkt ist implementiert, verlangt das Bearer-Secret und löscht abgelaufene
Nutzer samt abhängigen Profil-, Fahrplan- und Chatdaten über Foreign-Key-Kaskaden.
Vor dem öffentlichen Start muss ein echter Vercel-Cronlauf im Production-Projekt
kontrolliert werden.

### 5. Cloudflare-Subdomain als DNS-only CNAME

Für die geplante Subdomain `wegwaerts.bobbyly.com` ist der Ablauf:

1. In Vercel unter **Project Settings → Domains** zuerst die vollständige Subdomain
   `wegwaerts.bobbyly.com` hinzufügen.
2. Die von Vercel angezeigte DNS-Anweisung ablesen. Für eine normale Subdomain ist sie
   üblicherweise:
   - Typ: `CNAME`
   - Name: `wegwaerts`
   - Ziel: `cname.vercel-dns.com`
3. In **Cloudflare → DNS → Records** genau diesen CNAME anlegen. **Proxy status** auf
   **DNS only** (graue Wolke) und TTL auf **Auto** setzen. Existierende A-, AAAA- oder
   CNAME-Einträge desselben Namens vorher konfliktfrei auflösen.
4. Falls Vercel ein projektspezifisches anderes Ziel anzeigt, gilt ausschließlich das
   im Vercel-Dashboard angezeigte Ziel, nicht der Beispielwert oben.
5. DNS-Auflösung abwarten, anschließend in Vercel **Refresh/Verify** ausführen und erst
   nach erfolgreicher Verifikation und ausgestelltem TLS-Zertifikat die Subdomain
   veröffentlichen.

Die orange Cloudflare-Proxy-Wolke bleibt aus. TLS und Routing der Anwendung übernimmt
für diese DNS-only-Subdomain Vercel; Cloudflare bleibt DNS-Anbieter sowie Anbieter von
Workers AI und Turnstile.

### Preview-Isolation

- Production-, Preview- und lokale Umgebungen verwenden unterschiedliche
  `DATABASE_URL`, `DATABASE_MIGRATION_URL`, `SESSION_SECRET`, `IP_HASH_SECRET`,
  `CRON_SECRET`, Cloudflare-Tokens und Turnstile-Schlüssel.
- Preview greift nie auf Produktionsdaten zu und erhält keine Production-Secrets.
- Ein Preview-Cron darf nicht gegen die Produktionsdatenbank laufen. Vercel-Cronjobs
  werden aus dem Production-Deployment konfiguriert; manuelle Preview-Tests verwenden
  ausschließlich Preview-Daten und -Secrets.
- Logs, Screenshots und Support-Anfragen dürfen keine Connection-Strings, Cookies,
  Tokens oder Nutzereingaben enthalten.
- Nicht mehr benötigte Preview-Branches und Secrets werden zeitnah gelöscht.

### Grenzen kostenloser Tarife

Kostenlose Tarife sind weder Verfügbarkeitsgarantie noch automatisch ein verlässlicher
Kosten-Hard-Stop. Limits, Abrechnungsmodell und Nutzungsbedingungen können sich ändern:

- Vercel Hobby kann Builds, Funktionen, Bandbreite und Cron-Ausführung begrenzen oder
  pausieren; tägliche Cronjobs sind nicht minutengenau.
- Neon Free kann Compute nach Inaktivität schlafen legen und Verbindungen, Laufzeit,
  Speicher oder Datentransfer begrenzen.
- Workers AI kann Neurons-/Anfragekontingente ablehnen oder – abhängig von Konto und
  aktivierter Abrechnung – kostenpflichtig weiterlaufen. Turnstile schützt nicht vor
  jeder Form von Missbrauch.

Vor dem Start sind in allen drei Konten aktuelle Limits, Abrechnung, Benachrichtigungen
und vorhandene Spend-Caps zu prüfen. Wenn ein Anbieterlimit erreicht ist, muss die
Anwendung sicher fehlschlagen: keine Ausweichspeicherung sensibler Daten, keine
ungeprüfte Anbieterumschaltung und eine verständliche Fehlermeldung. Für die Demo gibt
es keine Zusage zu Verfügbarkeit oder Datenwiederherstellung.

### Freigabe-Checkliste

- [ ] Impressum um ladungsfähige Anschrift, direkten Kontakt und alle anwendbaren
      Pflichtangaben ergänzt und rechtlich geprüft
- [ ] Datenschutzhinweise mit echten Anbieterregionen, Verträgen, Log-Fristen und
      Drittlandgarantien abgeglichen
- [ ] Auftragsverarbeitungsverträge mit Vercel, Neon und Cloudflare geprüft/geschlossen
- [ ] Nutzung erst ab 16 Jahren sowie Verbot sensibler und identifizierender Eingaben
      gut sichtbar
- [ ] KI-Hinweis und Beratungsgrenzen vor der ersten Mentor-Nachricht sichtbar
- [ ] anonyme Sitzungen auf sieben Tage begrenzt; manuelle und automatische Löschung
      getestet
- [ ] `/api/cron/cleanup` authentifiziert, idempotent und in Vercel erfolgreich gelaufen
- [ ] Production und Preview vollständig getrennt; keine Production-Secrets in Preview
- [ ] Turnstile-Hostname, Security Header, Rate Limits und Fehlerfälle geprüft
- [ ] Free-Tier-Limits, Warnungen und mögliche Kosten in allen Anbieter-Konten geprüft
- [ ] DNS-only CNAME, Vercel-Verifikation und TLS erfolgreich kontrolliert

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

Die öffentliche Variante ist nur als begrenzte, anonyme Demo vorgesehen. Anonym
bedeutet nicht automatisch datenschutzfrei: Sitzungskennungen, IP-Adressen und freie
Texte können personenbezogen sein. Die localhost-Bindung der Docker-Ports ersetzt
keine Schutzmaßnahme für Produktion.

Vor jeder Freigabe sind sichere, getrennte Sitzungen, Autorisierung pro Datensatz,
serverseitige Secrets, TLS, Security Header, Rate Limits, Bot-Schutz, ein
Bedrohungsmodell und die Löschung nach sieben Tagen praktisch zu prüfen. Ebenso nötig
sind ein Prozess für Betroffenenrechte, minimierte Provider-Logs, Zugriffsschutz,
Abhängigkeitsprüfungen und sichtbare Beratungsgrenzen.

Die Seiten `/datenschutz` und `/impressum` sind bewusst als vorläufig markiert. Solange
Pflichtangaben fehlen oder der Cleanup-Endpunkt und die tatsächlichen
Anbietereinstellungen nicht verifiziert sind, darf die Demo nicht öffentlich gestartet
werden.
