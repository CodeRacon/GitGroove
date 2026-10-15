# GitGroove – UI/UX-Review und Visual Polish

Stand: 14. Oktober 2026. Ausgangspunkt: `d2a42cc`, geprüft am vorhandenen Vue-/TypeScript-Projekt. Die Analyse wurde vor Beginn der Implementierung im Chat vorgestellt.

## Phase A: Befunde und Prioritäten

| Priorität | Tatsächlicher Befund | Empfohlene Verbesserung | Wirkung / Aufwand |
| --- | --- | --- | --- |
| 1 | Die Erstansicht zeigt nur Logo, Navigation und ein leeres Eingabefeld. Ohne bekannten GitHub-Namen bleibt die Idee unsichtbar. | Kurze Erklärung, verständlicher Leerzustand, Beispielprofil mit einem Klick und drei Hinweise zum Ablauf. | Sehr hoch / klein |
| 2 | 14 gleichwertige Längenbuttons stehen vor dem Raster. Datumsangaben, Legende und ein benannter Wiedergabezustand fehlen. Der Auswahlbügel beginnt 16 Pixel links vom Raster. | Auswahl, Kalender und Transport zusammenführen; Länge als Select, Zeitraum und Farblegende anzeigen; gemeinsame Rasterausrichtung. | Sehr hoch / mittel |
| 3 | Mit 53 Wochen ist die Seite 908 Pixel breit, auch bei 390 und 768 Pixel Viewport. Bügel und Drehregler verarbeiten nur Mausereignisse. | Flexibles Seitenlayout, begrenztes Raster-Scrolling, Pointer-Gesten und Tastaturbedienung. | Sehr hoch / mittel |
| 4 | Synth-Panels sind nur 12 rem breit; Reglertexte teils 10 Pixel groß, M/S-Reihenfolge uneinheitlich. Pad-Decay startet bei 1,8 s trotz Reglermaximum 1 s. | Gemeinsame Designvariablen und Panel-Styles, klare Gruppierung, beschriftete Mute/Solo-Aktionen, passende Reglergrenzen und präzise Werte. | Hoch / mittel |
| 5 | Laden und Fehler erscheinen als einfache Texte; erneutes Laden bleibt möglich. Eine Auswahl ohne Beiträge kann lautlos spielen, ohne Erklärung. | Gesperrte Ladeaktionen, zugängliche Statusmeldungen, verständliche Hinweise für leere Daten und stumme Bereiche. | Hoch / klein |

Die Browserprüfung umfasste Erstansicht, geladenen Kalender, Wiedergabe, einen beitragslosen Kalender und einen fehlgeschlagenen Profilwechsel. Für reproduzierbare Layoutprüfungen wurde ausschließlich im Vorschau-Server ein synthetischer Kalender aus 53 Wochen verwendet. Er ist kein Datenstand von CodeRacon.

Was bereits funktioniert: die GitHub-nahe Grünpalette, die drei separaten Synth-Stimmen, native Tempo-/Lautstärke-Slider und das zuverlässige Entfernen veralteter Daten bei Profilfehlern.

## Gestalterische Richtung und Einstieg

Das vorhandene dunkle Studio wird weiterentwickelt: ruhige Flächen, einheitliche Typografie und Abstände, Grün für Beiträge und aktive Controls. Das Raster bleibt Mittelpunkt; darunter liegen Transport und drei Synth-Kanäle.

Eine automatisch startende Overlay-Tour ist vorerst nicht erforderlich. Direkte Hinweise helfen während des Handelns; der Beispielprofil-Button löst die größere Einstiegshürde ohne GitHub-Vorwissen. `CodeRacon` wird beim Anklicken über den bestehenden GitHub-Service geladen. Es gibt keinen verpflichtenden Default, keinen automatischen Profilabruf und kein Audio-Autoplay. Ein Wechsel des Beispiels zu einem anderen Profil bleibt eine kleine Produktentscheidung.

## Phase B: Umgesetzt

- Erklärte Erstansicht mit drei kurzen Ablaufhinweisen, ausdrücklich illustrativem Vorschau-Raster und Beispielprofil-Aktion.
- Nach dem Laden erhält der Kalender den Platz der Einstiegserklärung. Profil, Beitragszahl, Monate, Wochentage, Farblegende und ausgewählter Zeitraum machen die Daten verständlicher.
- Längenauswahl mit allen bisherigen Optionen einschließlich 53 Wochen; exakt am Kalender ausgerichteter Auswahlbügel mit Touch, Pfeiltasten, Home/End und PageUp/PageDown.
- Beschriftete Play/Pause-/Stop-Aktionen, Wiedergabestatus und Tempo direkt im Kalenderbereich.
- Gemeinsame Synth-Styles, Mute/Solo mit `aria-pressed`, Schalter mit nativer Tastaturbedienung und Drehregler als zugängliche Slider mit Pointer-Capture.
- Drehregler zeigen die Schrittpräzision an, beispielsweise Reverb 0,85. Pad-Decay hat einen passenden UI-Bereich, ohne den bestehenden Klangwert zu verändern.
- Lade-, Fehler-, Leer- und Stille-Hinweise; Fokusmarkierungen, Sprunglink und Berücksichtigung reduzierter Bewegung. Glossar-Einträge sind per Tastatur bedienbar.

Musikgenerierung, Audio-Engine, Playback-Session, Mix-Logik und GitHub-Datenbeschaffung sind unverändert. Es wurden keine Dependencies hinzugefügt.

## Phase C: Überprüfung

| Prüfung | Ergebnis |
| --- | --- |
| `npm run build` einschließlich TypeScript | erfolgreich |
| `npm run lint` | erfolgreich |
| `npm run test:unit -- --run` | 17 Tests erfolgreich |
| `npm run test:e2e` | 4 Cypress-Szenarien erfolgreich |
| Desktop 1280 × 800 | geprüft; Play ist nach dem Laden ohne vertikales Scrollen sichtbar |
| Tablet 768 × 1024 | geprüft; kein Seitenüberlauf, Synth-Gruppen nebeneinander innerhalb eines Kanals |
| Smartphone 390 × 844 und 320 × 740 | geprüft; kein Seitenüberlauf, horizontaler Scrollbereich nur im Kalender |
| Tatsächliche Tastaturbedienung im Browser | Auswahl bis Woche 53, Cutoff, Chorus-Schalter und Tempo erfolgreich |

Die Unit-Tests ergänzen sinnvolle Verhaltensprüfungen für Auswahlgrenzen, Pointer-Abbruch, Tastaturwerte und bestehende Regler-Schrittweite. Cypress prüft Profilwechsel, Beispiel-Einstieg, Bereichsauswahl, Mute/Solo, Wiedergabe beim Ansichtswechsel und den Hinweis bei fehlenden Beiträgen. Screenshots für Desktop, Tablet und Smartphone wurden visuell geprüft.

Die Browser-/E2E-Prüfung verwendet Testdaten; ein erneuter Live-GitHub-Abruf und ein Hörtest auf realen Mobilgeräten sind nicht Teil dieser Verifikation.

## Ergebnisbilder im Chat-Workspace

- [Desktop](review/after-desktop.png)
- [Tablet](review/after-tablet.png)
- [Smartphone](review/after-mobile.png)
- [Vorher: Desktop](review/before-desktop.jpg)
- [Vorher: Smartphone](review/before-mobile.jpg)

## Vereinbarte Folgeanpassungen: Transport und Auswahl

Die folgende Entscheidung ersetzt die frühere Übernahme eines Jahres an der Loop-Grenze:

- Ein anderes Beitragsjahr stoppt sofort. Nach dem Laden wird das neue Grid angezeigt und erst auf Play wiedergegeben. Klang, Tempo und gültige Auswahl bleiben erhalten; bei Fehlern bleibt das bisherige Grid gestoppt sichtbar. Das aktive Jahr erneut anzuklicken setzt die Wiedergabe nicht zurück.
- 4, 8, 12 und 16 Wochen erhalten eine direkte Schnellwahl; weitere Längen, Sonderlängen und Full calendar stehen unter More… bereit.
- Space steuert Play/Pause in allen Ansichten; native Eingaben, aktivierbare Controls, Dialoge und Tastenkombinationen behalten ihr Verhalten.
- Navigation zwischen Studio, Glossary und About unterbricht die Wiedergabe nicht. Der Snapshot-Hash bleibt erhalten.
- Bass und Lead beschriften ihre Auswahl mit Arpeggio Pattern.
- Ein kompakter Mini-Transport erscheint am unteren Bildschirmrand, wenn die normale Steuerung nicht vollständig sichtbar ist, und bleibt nach Pause sowie auf Infoseiten erreichbar. Er nutzt denselben Playback-Zustand wie die große Steuerung. Seitenabstand und Safe Areas verhindern verdeckte Inhalte.

Prüfentscheidung zum ergänzend vorgemerkten Live-Längenwechsel: Längen- und Bügeländerungen behalten vorerst ihren expliziten Stopp bei. Die Übernahme anderer Loop-Grenzen bei laufender Wiedergabe ist eine separate Verhaltensänderung und gehört nicht zur reinen Schnellwahl.
