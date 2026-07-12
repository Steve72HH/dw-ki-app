# DW KI App

Self-hosted KI-Dashboard fuer Chat, Research, Workflows und Agenten.

![DW KI App Preview](assets/dashboard-preview.png)

## Was das ist

`DW KI App` ist die rekonstruierte Startversion des frueheren `DW KI Dashboard`.
Sie kombiniert eine klare Workspace-Oberflaeche mit Chat, schnellen Prompt-Vorlagen,
Workflow-Steuerung und einer lokalen Preview fuer Entwicklung und Demo.

## Features

- Persistenter Chat mit lokaler Speicherung im Browser
- Workflow-Steuerung mit Run, Pause und Statusanzeige
- Prompt-Vorlagen zum schnellen Wiederverwenden
- Reset-Funktion fuer einen frischen Demo-Zustand
- Responsive Dark-UI mit Fokus auf einen self-hosted AI Workspace

## Lokaler Start

```bash
npm start
```

Danach im Browser oeffnen:

```text
http://127.0.0.1:4173/
```

## Inhalt

- `index.html` - Dashboard-Oberflaeche
- `style.css` - Layout und Styling
- `main.js` - Interaktion, State und Speicherung
- `serve.js` - kleiner lokaler Static Server
- `assets/dashboard-preview.png` - Screenshot fuer die Projektvorschau

## Projektstatus

- Aktueller Stand ist auf GitHub gespeichert
- Default-Branch ist `main`
- Tag `v0.1.0` markiert den ersten oeffentlichen Snapshot

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Lokaler Node-Server ohne Build-Schritt

## Hinweise

- Die App speichert den Zustand lokal im Browser ueber `localStorage`.
- Mit `Reset Demo` kannst du den gespeicherten Zustand zuruecksetzen.
