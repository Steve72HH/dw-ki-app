# DW KI App

Self-hosted KI-Dashboard fuer Chat, Research, Workflows und Agenten.

![DW KI App Preview](assets/dashboard-preview.png)

## Overview

`DW KI App` ist die rekonstruierte Startversion des frueheren `DW KI Dashboard`.
Der Fokus liegt auf einer klaren Workspace-Oberflaeche, schnellen Prompt-Vorlagen,
lokaler Zustandsverwaltung und einem Self-hosted-Feeling fuer interne Demos und
operative KI-Workflows.

## Highlights

- Persistenter Chat mit lokaler Speicherung im Browser
- Workflow-Steuerung mit Run, Pause und Statusanzeige
- Prompt-Vorlagen zum schnellen Wiederverwenden
- Import und Export des App-Zustands als JSON
- Reset-Funktion fuer einen frischen Demo-Zustand
- Responsive Dark-UI ohne Build-Schritt

## Quick Start

```bash
npm start
```

Danach im Browser oeffnen:

```text
http://127.0.0.1:4173/
```

## Project Structure

| File | Purpose |
| --- | --- |
| `index.html` | Dashboard-Oberflaeche |
| `style.css` | Layout, Farben und responsive Darstellung |
| `main.js` | Interaktion, State und Speicherung |
| `serve.js` | lokaler Static Server ohne Build-Tooling |
| `assets/dashboard-preview.png` | Screenshot fuer die Projektvorschau |

## Status

- Aktueller Stand ist auf GitHub gespeichert
- Default-Branch ist `main`
- Tag `v0.1.0` markiert den ersten oeffentlichen Snapshot

## Notes

- Die App speichert den Zustand lokal im Browser ueber `localStorage`.
- Mit `Reset Demo` kannst du den gespeicherten Zustand zuruecksetzen.
- Import und Export helfen dir, den Arbeitsstand zwischen Sessions mitzunehmen.

## License

Siehe [LICENSE](LICENSE).
