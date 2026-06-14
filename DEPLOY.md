# Gainz aufs iPhone bringen (GitHub Pages)

Die App ist eine PWA. Damit sie als Icon aufs iPhone kommt, muss sie über HTTPS gehostet
werden – kostenlos via GitHub Pages. Einmal eingerichtet, reicht später `git push` für Updates.

---

## A) GitHub-Repo anlegen & hochladen

### Variante 1 – GitHub Desktop (am einfachsten, empfohlen)
1. **GitHub Desktop** installieren: https://desktop.github.com  → mit GitHub-Account anmelden.
2. **File → Add local repository…** → den Ordner `d:\Tools\Fitnessapp` wählen.
3. Oben **Publish repository** klicken.
   - Name z.B. `gainz`
   - Häkchen **„Keep this code private" ENTFERNEN** (öffentlich – nötig für Gratis-Pages).
   - **Publish**.

### Variante 2 – Kommandozeile (PowerShell)
1. Auf https://github.com/new ein Repo anlegen: Name `gainz`, **Public**,
   **nicht** mit README/`.gitignore` initialisieren → **Create repository**.
2. Im Projektordner ausführen (DEINUSER ersetzen):
   ```powershell
   git remote add origin https://github.com/DEINUSER/gainz.git
   git push -u origin main
   ```
   Beim ersten Push öffnet sich ein Browser-Login für GitHub → einloggen, fertig.

---

## B) GitHub Pages aktivieren
1. Im Repo: **Settings → Pages**.
2. Unter **Build and deployment → Source**: **GitHub Actions** auswählen.
3. Der mitgelieferte Workflow (`.github/workflows/deploy.yml`) baut & veröffentlicht automatisch.
   Den Fortschritt siehst du im Tab **Actions** (dauert ~1–2 Min).
4. Danach zeigt **Settings → Pages** die Adresse, etwa:
   `https://DEINUSER.github.io/gainz/`

---

## C) Auf dem iPhone installieren (iOS 26)
1. Die Pages-URL in **Safari** öffnen (muss Safari sein – nicht Chrome).
2. **Teilen-Symbol** (Quadrat mit Pfeil) → **Zum Home-Bildschirm** → **Hinzufügen**.
3. Über das **Gainz**-Icon starten → läuft im Vollbild, offline, mit Liquid-Glass-Refraktion.

---

## Updates später
Änderungen committen und hochladen – Pages deployt automatisch neu:
```powershell
git add -A
git commit -m "Update"
git push
```
Auf dem iPhone die App einmal schließen und neu öffnen (der Service Worker aktualisiert sich).

> Tipp: Die Liquid-Glass-Brechung an den Rändern ist ein Safari/iOS-Feature – auf dem iPhone
> sichtbar, im Desktop-Chrome nur der Blur-Look.
