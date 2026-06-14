# Fitness PWA

Persönliche Trainings-App als installierbare Web-App (PWA). Komplett von Windows entwickelbar,
läuft auf dem iPhone als Icon im Vollbild.

## Features
- 📋 Mehrere Trainingspläne/Splits speichern & einen aktivieren
- 🗓️ Erkennt den heutigen Trainingstag (Wochentag) – verpasste Tage **verschieben** sich automatisch
- ✅ Übungen abhaken (pro Übung, nicht pro Satz) + Gewicht & Wdh. eintragen
- ⏱️ Satzpausen-Timer (Vollbild, hält Bildschirm wach, Ton am Ende)
- 📈 Progressions-Kurven (Gewicht & Volumen) pro Übung
- ✨ Plan-Import per JSON aus der Claude-App (fertiger Prompt zum Kopieren)
- 💾 Daten-Backup (Export/Import als JSON)

## Lokal starten (Windows)
```bash
npm install
npm run dev          # Browser: http://localhost:5173
```
Plan testen: Tab **Pläne → Plan von Claude importieren** → Inhalt von `beispiel-plan.json` einfügen.

> Hinweis: `npm run dev` läuft nur lokal. Damit die App **aufs iPhone** kommt, muss sie
> über HTTPS gehostet werden → siehe Deployment.

## Build
```bash
npm run build
npm run preview
```

## Deployment auf GitHub Pages
1. Neues GitHub-Repo anlegen und diesen Ordner pushen (Branch `main`).
2. Im Repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Der Workflow `.github/workflows/deploy.yml` baut & veröffentlicht bei jedem Push.
4. Nach dem Lauf zeigt **Actions** die Pages-URL (z.B. `https://<user>.github.io/<repo>/`).

## Auf dem iPhone installieren (iOS 26)
1. Pages-URL in **Safari** öffnen.
2. **Teilen → Zum Home-Bildschirm**.
3. Über das neue Icon starten → läuft im Vollbild, funktioniert offline.

## Bewusste Grenzen (PWA statt nativ)
- **Kein Dynamic-Island-Timer** – der Satz-Timer ist ein In-App-Vollbild-Timer (App im
  Vordergrund lassen; bei gesperrtem iPhone pausieren Web-Timer).
- **Liquid Glass** ist per CSS nachgebaut (`backdrop-filter`), nicht Apples native Variante.
- **Zeitgesteuerte Push-Erinnerungen** brauchen einen kleinen Server → für eine spätere Version
  vorgesehen. Aktuell gibt es ein Motivations-Banner beim Öffnen.

## Icons neu erzeugen
```bash
node scripts/generate-icons.mjs
```

## Plan-JSON-Format (für Claude)
```jsonc
{
  "name": "Mein Plan",
  "description": "optional",
  "days": [
    {
      "name": "Push",
      "weekdays": [1],            // 0=So .. 6=Sa
      "exercises": [
        { "name": "Brustpresse", "targetSets": 3, "targetReps": 10, "restSeconds": 120, "notes": "optional" }
      ]
    }
  ]
}
```
Die Reihenfolge der `days` ist die Trainings-Reihenfolge (relevant für die Verschiebe-Logik).
