# 🌲 WILDNIS · Protokoll 247

**Ein Survival-RPG im Browser – mit Pixel-Grafik, Pokémon-artigen Rundenkämpfen, Bossen und einem dunklen Geheimnis.**

Du erwachst in einem Wald. Kein Gedächtnis. Nur eine Nummer auf dem Handgelenk: **#247**.
Sammle, baue, kämpfe – und finde heraus, was das ARKON-Institut mit dir vorhat.

▶ **Spielen:** einfach `index.html` im Browser öffnen – keine Installation, läuft auf Handy und PC.

---

## ✨ Features

- **Überleben:** Leben, Energie, Hunger, Durst, Wärme · Krankheit durch rohes Essen und trübes Wasser · Temperatur nach Jahreszeit, Wetter, Gebiet und Kleidung
- **Lebendige Welt:** 20 Hex-Gebiete, 16 Biome mit eigener Pixel-Landschaft, Tag/Nacht-Zyklus, Regen, Schnee, Nebel, Gewitter, 4 Jahreszeiten
- **Pokémon-Kämpfe:** KAMPF · TASCHE · BLOCK · FLUCHT – Elemente (Feuer/Eis/Volt), Statuseffekte, aufgeladene Angriffe, 12 Gegnerarten + 7 Bosse mit Dialogen
- **RPG:** Level 1–50, Attribute (STR/VIT/GES/INT), Trainingsplatz, 13 Fähigkeiten, Waffenklassen mit eigenem Grundangriff
- **Lager & Crafting:** 14 Gebäude, 60 Rezepte an 6 Stationen, Ausrüstung mit Seltenheit und Haltbarkeit, geheime Baupläne
- **Story:** ARKON-Geheimnisse, Funksignale, 3 Raketenteile, Finalboss, 2 Enden, Neues Spiel+
- **Motivation:** Hauptziele mit Tutorial, Tagesaufträge, 39 Erfolge, Bestiarium, Händlerin, Hardcore-Modus, Ergebnis als Bild teilen
- **Sound:** prozedural erzeugte Effekte, Ambiente und Musik (WebAudio)

## 🛠 Entwickeln

Der Quellcode liegt modular in `src/`:

| Datei | Inhalt |
|---|---|
| `src/index.html` | HTML-Gerüst und komplettes CSS |
| `src/js/00_util.js` | Helfer, Zufall, Audio-Engine |
| `src/js/01_data_items.js` | Gegenstände, Ausrüstung, Rezepte, Gebäude |
| `src/js/02_data_world.js` | Sammelaktionen, Biome, Waben, Gegner, Fähigkeiten, Story, Quests, Erfolge |
| `src/js/03_sprites.js` | Pixel-Sprite-Engine, prozedurale Gegner und Objekte |
| `src/js/04_state.js` | Spielstand, Speichern, abgeleitete Werte, Inventar |
| `src/js/05_scene.js` | Szenen-Renderer (Ebenen, Licht, Wetter, Titelbild) |
| `src/js/06_ui.js` | Oberfläche, Tabs, Karte |
| `src/js/07_game.js` | Spiellogik, Tick, Nacht, Tod |
| `src/js/08_combat.js` | Rundenkampf und Kampf-Rendering, Enden |
| `src/js/09_main.js` | Start, Steuerung, Teilen, Spielschleifen |

`assets/` enthält die Pixel-Art (Held, Wolf, Wald-Hintergrund, Unterschlupf-Stufen).

**Bauen** (erzeugt eine einzige HTML-Datei mit allen Bildern eingebettet):

```bash
python3 build.py        # → dist/wildnis-v3.html
cp dist/wildnis-v3.html index.html
```

**Auf den Server laden:**

```powershell
scp "$HOME\Downloads\wildnis-v3.html" root@173.249.10.225:/var/www/wildnis/v3.html
```

Live: https://wildnis.socialrewardcoin.com/v3.html

---

Gemacht von Selcuk · Pixel-Art von Selcuk
