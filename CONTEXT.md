# GitGroove

GitGroove macht die Beitragshistorie eines GitHub-Profils als Raster und musikalische Folge erfahrbar. Ein Beitragskalender liefert die Zeitstruktur; eine Wiedergabe-Session spielt die daraus erzeugte Folge über drei Synth-Stimmen ab.

## Language

**Beitragskalender**:
Der nach Wochen geordnete Schnappschuss der GitHub-Beiträge eines Profils. Jede normalisierte Beitragswoche besitzt sieben Tagesschritte; Tage außerhalb des abgefragten Zeitraums bleiben leer.
_Avoid_: Heatmap als Datenmodell

**Beitragswoche**:
Eine Kalenderwoche im Beitragskalender und zugleich ein 4/4-Takt in GitGroove. Sie enthält genau sieben gleichmäßig verteilte Tagesschritte.
_Avoid_: Bar ohne Kalenderbezug

**Tagesschritt**:
Eine von sieben Positionen einer Beitragswoche. Sie repräsentiert einen Beitragstag oder einen stummen Platzhalter in einer Teilwoche.
_Avoid_: Beat, wenn die Position innerhalb des Takts gemeint ist

**Musikalische Sequenz**:
Die unveränderliche, reproduzierbare Folge von Notenereignissen aus einem ausgewählten Bereich des Beitragskalenders und festgelegten Klang-Einstellungen. Eine Sequenz hält eine Mapping-Version, damit gespeicherte Stücke später gleich bleiben.
_Avoid_: Pattern für das gesamte Stück

**Wiedergabe-Session**:
Die eine laufende Wiedergabe einer musikalischen Sequenz mit Position, Tempo und Status. Sie verbindet den hörbaren Ablauf mit dem Playhead des Rasters.
_Avoid_: Sequencer und Orchestrator als getrennte Eigentümer der Wiedergabe

**Synth-Mix**:
Die Hörbarkeit von Bass, Pad und Lead aus Grundpegel, Mute, Solo und Wiedergabezustand. Solo übersteuert Mute vorübergehend, ohne den Grundpegel zu verändern.
_Avoid_: Lautstärke als einziger Zustand einer Synth-Stimme

## Relationships

- Ein **Beitragskalender** enthält mehrere **Beitragswochen**; jede Beitragswoche enthält sieben **Tagesschritte**.
- Ein gewählter Bereich des Beitragskalenders erzeugt eine **musikalische Sequenz**.
- Eine **Wiedergabe-Session** spielt eine musikalische Sequenz und verwendet einen **Synth-Mix**.

## Example dialogue

> Entwickler: „Die letzte Beitragswoche hat nur drei GitHub-Tage. Wird der Takt kürzer?“
> Domänenexpertin: „Nein. Die Beitragswoche behält sieben Tagesschritte; die vier fehlenden Positionen sind stumm.“
> Entwickler: „Wenn ich Lead trotz Mute solo schalte?“
> Domänenexpertin: „Der Synth-Mix macht Lead während Solo hörbar. Nach Solo gilt sein Mute wieder.“
