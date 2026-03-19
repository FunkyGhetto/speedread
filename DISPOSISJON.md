# SpeedRead — Disposisjon

> Informert av REFLECTION.md. Strukturert for å bygge et rent, distraksjonsfritt system der DEV har full kontroll og brukeren har null friksjon.

---

## Lag 0: Riv ned det gamle (fjern før du bygger)

### 0.1 Fjern UI-AI
- Slett `AiUiCustomizer.svelte` (hvis den finnes)
- Fjern AI UI-fane fra App.svelte
- Fjern `applyConfig()` UI-config pipeline fra ai-config.svelte.ts (DEV endrer via kode)
- Fjern `UiCustomizationResult` fra types/ai.ts
- Fjern `AiSettingsDialog.svelte` som separat komponent — flytt API-nøkkel og modellvalg inn i DEV-panelet

### 0.2 Fjern distraksjon fra hovedskjerm
- Fjern WPM-slider
- Fjern WPM-tall
- Fjern progress-bar
- Fjern play/pause/skip-knapper
- Fjern alle kontroller bortsett fra selve ordvisningen og guide-linjene

### 0.3 Fjern død kode
- `chunker.ts` — importeres men brukes aldri
- `display`-feltet i WordToken — alltid lik `raw`
- `getSystemTheme()` — eksporteres men aldri importert eksternt
- Duplisert `chunkSize` i settings.svelte.ts

---

## Lag 1: Datagrunnlaget

### 1.1 Persistens med feilhåndtering
- Auto-save med debounce i App.svelte (allerede delvis på plass — verifiser at det fungerer)
- `writeJson()` i persistence.ts: logg feil synlig, ikke stille

### 1.2 Backup-system for DEV
- Ved hver DEV-endring: lagre forrige filinnhold til `speedread/backups/{timestamp}_{filename}.bak`
- DEV har `restoreBackup()`-funksjon
- Undo-stack i DevModePanel persisteres IKKE til disk — men backup-filer gjør at endringer alltid er reversible

---

## Lag 2: DEV med full kontroll

### 2.1 Full app-snapshot
- Utvid `getAppSnapshot()` med:
  - Komplett feillogg (siste 20 entries med stack traces)
  - AI-config status (API-nøkkel satt/ikke satt, valgt modell)
  - Undo-stack størrelse
  - Bokmerke-data
  - Gjeldende input-modus og eventuell feil
  - WPM, playing-status, progress

### 2.2 DEV-panel redesign
- API-nøkkel input direkte i DEV-panelet
- Modellvalg dropdown med ALLE Claude-modeller (claude-opus-4-0-20250514, claude-sonnet-4-5-20250514, claude-sonnet-4-0-20250514, claude-haiku-3-5-20241022, etc.)
- Chat-grensesnitt med diff-preview
- Backup/restore-knapper
- Undo-knapp

### 2.3 Ny systemprompt — 100% sann
- Skriv fra scratch basert på faktisk implementasjon
- Liste ALLE tilgjengelige state-funksjoner med korrekte signaturer
- Dokumenter backup/restore
- Eksplisitte begrensninger
- DEV handler KUN på brukerens instruks

---

## Lag 3: Ren hovedskjerm

### 3.1 Ordvisning
- ORP alltid i perfekt senter (allerede implementert)
- Horisontale guide-linjer med vertikale ticks (allerede implementert)
- Ikke-ORP bokstaver 70% opacity (allerede implementert)
- Bevar original casing og festet tegnsetting

### 3.2 Interaksjon
- Scrollhjul: endre WPM i sanntid (allerede på RsvpDisplay, sikre at det fungerer overalt)
- Mellomrom: play/pause (allerede implementert på window-nivå)
- Escape: toggle panel
- Ingen andre kontroller på hovedskjermen

---

## Lag 4: Panel-redesign

### 4.1 Fane-struktur
- INPUT (med sub-faner: Text, URL, File)
- STATS
- DEV

### 4.2 Panelet bretter inn/ut
- Allerede implementert med SidePanel-komponent
- Toggle med Ctrl+Tab eller Escape

---

## Avhengigheter

```
Lag 0 (riv ned) ← ingen
Lag 1 (data) ← etter Lag 0
Lag 2 (DEV) ← etter Lag 1
Lag 3 (hovedskjerm) ← uavhengig, allerede delvis ferdig
Lag 4 (panel) ← uavhengig
```
