# GitGroove

GitGroove macht den Beitragskalender eines GitHub-Profils hörbar. Eine Woche ist ein 4/4-Takt mit sieben gleichmäßig verteilten Tagesschritten. Tage ohne Beiträge bleiben stumm. Kalender-Schnappschuss, Profil, Wochenbereich und Klang-Einstellungen erzeugen reproduzierbare Noten; die Mapping-Version steht in der Sequenz.

## Lokal entwickeln

Voraussetzung: Node.js 20 oder neuer.

1. `npm ci` ausführen.
2. `.env.example` nach `.env.local` kopieren und `GITHUB_TOKEN` dort eintragen. Der Token darf nicht mit `VITE_` beginnen; er wird nur vom lokalen Vite-Server gelesen.
3. `npm run dev` starten.
4. `npm run build`, `npm run test:unit -- --run` und `npm run lint` prüfen.

Die Tests verwenden Kalender-Fiktionen und benötigen keinen Token. Der Browser-Test läuft über `npm run test:e2e`; dafür muss die Cypress-Binary installiert sein.

## Hostinger-Webhosting mit PHP

1. Lokal `npm run build` ausführen.
2. Den **Inhalt** von `dist/` in das `public_html` der Website hochladen. Dazu gehört `dist/api/contributions.php`.
3. Die Datei `deployment/gitgroove-secret.example.php` als `gitgroove-secret.php` **eine Ebene oberhalb** von `public_html` ablegen, den Platzhalter durch einen GitHub-Token ersetzen und den Zugriff auf die Datei auf das Hosting-Konto begrenzen. Sie gehört weder in `public_html` noch ins Repository. Alternativ kann die Serverumgebung `GITHUB_TOKEN` bereitstellen.
4. PHP mit cURL aktivieren. Danach `/api/contributions.php?username=octocat` aufrufen und prüfen, dass JSON zurückkommt.

Die App fragt nur den eigenen PHP-Endpunkt ab. Dieser fragt GitHub GraphQL mit dem serverseitigen Token ab und hält Kalenderantworten fünf Minuten im temporären Verzeichnis vor. Für GitHub-Token gelten die [GitHub-Empfehlungen zu minimalen Berechtigungen und Ablaufdaten](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). Hostinger beschreibt `public_html` als Webverzeichnis im [File Manager](https://support.hostinger.com/en/articles/4548688-basic-actions-in-the-file-manager) und bietet [PHP-Erweiterungen und -Optionen](https://support.hostinger.com/en/articles/4667515-how-to-manage-php-extensions-and-options) im Hosting-Dashboard an.

## Architektur

- `src/contributions/calendar.ts`: GitHub-Kalender validieren, sortieren und auf sieben Tage pro Woche normalisieren.
- `src/music/score.ts`: aus einem Kalender-Schnappschuss eine reproduzierbare, versionierte Sequenz erzeugen.
- `src/playback/session.ts`: einziger Wiedergabezustand; der Tone-Adapter taktet Audio unabhängig von der Bildschirm-Animation.
- `src/audio/mix.ts`: Fader, Mute, Solo und Pause-Gate getrennt halten.

Bei Wechsel zu Glossar oder Impressum pausiert die Wiedergabe und behält ihre Position. Zurück zur Rasteransicht startet sie erst nach erneutem Klick auf Play. Solo übersteuert Mute vorübergehend.
