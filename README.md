# Teide — Marketing-Website

Eigenständige, statische Marketing-Website für **Teide: Glide the Canaries**.
Kein Build-Schritt, keine Abhängigkeiten — reines HTML/CSS/JS. Im Design der App
(Inconsolata, Papier `#F4F1E8` / Tinte `#2A3338` / Himmel `#C5D3DC`, Frosted-Glass).

## Struktur

```
website/
├── index.html          Landing-Page (Hero, Features, Inseln, Screenshots, Download)
├── impressum.html      Impressum (Daten aus der App übernommen)
├── datenschutz.html    Datenschutzerklärung (auf GitHub-Pages-Hosting zugeschnitten)
├── lizenzen.html       Open-Source-Lizenzen (three.js, Capacitor, Inconsolata, Material Symbols)
├── css/styles.css      Komplettes Design-System
├── js/main.js          Scroll-Reveal, Parallax, Navigation (respektiert prefers-reduced-motion)
├── fonts/              Selbst-gehostete Fonts (aus src/fonts/ kopiert)
├── assets/             Logo, OG-Image, Favicons
│   └── screens/        ← hier die Screenshots ablegen (siehe unten)
└── .nojekyll           GitHub Pages: Jekyll-Verarbeitung aus
```

## Platzhalter, die noch befüllt / geprüft werden müssen

Alle im Code mit `PLATZHALTER` markiert (Suche im Projekt nach dem Wort).

- **Store-Links** in `index.html` — App-Store- und Google-Play-URL (`href="#"`).
- **Screenshots** — `assets/screens/shot-1.png` … `shot-4.png` (Querformat, ~16:9).
  Solange keine Datei existiert, zeigen die Rahmen einen Platzhalter.
- **Key-Art / Feature-Grafik** — optional als `assets/feature-graphic.png` (1024×500);
  wird im Hero genutzt, falls vorhanden, sonst greift die animierte SVG-Szene.
- **Impressum** — optionale vertretungsberechtigte Person / CHE-UID (auskommentiert).
- **Datenschutz** — „Stand"-Datum prüfen; GitHub-Pages-Account/Domain bestätigen.

## Hosting (GitHub Actions + Pages) — Zwei-Repo-Setup

Quelle ist dieses Repo (`GabRealityy/teide-glide-the-canaries`). Zwei Workflows
deployen bei Push auf `main` per PAT (`secrets.DEPLOY_PAT`) in zwei öffentliche
Org-Repos:

| Workflow | Quelle | Ziel-Repo | URL |
|---|---|---|---|
| `.github/workflows/deploy.yml`        | `dist/` (Vite-Build, `base:/teide-game/`) | `SwissInnovationStudios/teide-game` | `…github.io/teide-game/` (Game) |
| `.github/workflows/deploy-website.yml` | `website/` (statisch, relative Pfade)      | `SwissInnovationStudios/teide`       | `…github.io/teide/` (Marketing) |

Pfad-Filter sorgen dafür, dass nur das jeweils geänderte Ziel neu deployt wird
(`website/**` → Website, alles andere → Game). Die Website verlinkt das Game per
Button auf `https://swissinnovationstudios.github.io/teide-game/`.

**Einmalige GitHub-Schritte (Org-Account `swissinnovationstudios`):**
1. Repo `SwissInnovationStudios/teide` **neu anlegen** (gibt den durch das Rename
   entstandenen Redirect `teide → teide-game` wieder frei).
2. `DEPLOY_PAT` (Secret im Quell-Repo) braucht Schreibrechte auf **beide** Org-Repos.
3. Nach dem ersten Workflow-Lauf in **beiden** Ziel-Repos: Settings → Pages →
   Source = Branch `gh-pages` / root.
4. CDN/Cache ~1–10 Min; mit Strg+F5 hart neu laden.

Eigene Domain → `CNAME`-Datei in `website/` ablegen (wird mitdeployt).
