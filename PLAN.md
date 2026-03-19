# SpeedRead — Implementeringsplan

> Informert av DISPOSISJON.md. Konkrete kodeendringer i prioritert rekkefølge.

---

## Fase 1: Riv ned

### 1a. Fjern UI-AI rester
- **`src/App.svelte`**: Fjern AI UI-fane fra panel-tabs. Behold kun INPUT, STATS, DEV.
- **`src/lib/components/ai/AiSettingsDialog.svelte`**: Slett filen — flytt API-nøkkel + modellvalg inn i DevModePanel.
- **`src/lib/state/ai-config.svelte.ts`**: Fjern `applyConfig()` og all UI-config logikk. Behold bare: apiKey, model, timing-overrides som DEV kan sette via kode.
- **`src/lib/types/ai.ts`**: Fjern `UiCustomizationResult` og `FileModification.configChange`.

### 1b. Fjern distraksjoner fra hovedskjerm
- **`src/App.svelte`**: Fjern all import/bruk av playback-kontroller, WPM-slider, progress-bar.
- **`src/lib/components/reader/RsvpDisplay.svelte`**: Sikre at bare ordvisning + guide-linjer eksisterer. Ingen WPM-tall, ingen progress.

### 1c. Fjern død kode
- **`src/lib/engine/chunker.ts`**: Slett filen.
- **`src/lib/types/word.ts`**: `display`-feltet er nå alltid lik `raw`. Men det brukes i RsvpDisplay, så behold foreløpig (refaktor senere).
- **`src/lib/state/settings.svelte.ts`**: Fjern duplisert `chunkSize` hvis den fortsatt finnes der.
- **`src/lib/services/theme.ts`**: Fjern `getSystemTheme()` eksport.

---

## Fase 2: Backup-system

### 2a. Disk-basert backup
- **`src/lib/services/persistence.ts`**: Legg til `saveBackup(filename: string, content: string)` og `listBackups()` og `restoreBackup(backupPath: string)`.
- Lagrer til `speedread/backups/` i AppData.
- Format: `{ISO-timestamp}_{filename}.bak`

### 2b. Integrer i DevModePanel
- **`src/lib/components/ai/DevModePanel.svelte`**: Før `writeSourceFile()` kalles, lagre forrige innhold via `saveBackup()`.
- Legg til "Restore"-funksjon som viser backups og lar brukeren velge.

---

## Fase 3: DEV-panel redesign

### 3a. API-nøkkel og modellvalg i DEV
- **`src/lib/components/ai/DevModePanel.svelte`**:
  - Legg til API-nøkkel input (password-felt) øverst
  - Legg til modellvalg dropdown med alle Claude-modeller:
    - claude-opus-4-0-20250514
    - claude-sonnet-4-5-20250514
    - claude-sonnet-4-0-20250514
    - claude-haiku-3-5-20241022
    - claude-3-5-sonnet-20241022
    - claude-3-5-haiku-20241022
    - claude-3-opus-20240229
  - Behold chat-grensesnitt og diff-preview
  - Legg til undo-knapp og restore-knapp

### 3b. Full app-snapshot
- **`src/lib/state/runtime-log.svelte.ts`**: Utvid `getAppSnapshot()`:
  - `apiKeySet: boolean`
  - `selectedModel: string`
  - `bookmarkCount: number`
  - `undoStackSize: number`
  - `recentErrors: string[]` (siste 10 feil med timestamps)
  - `inputMode: string` (text/url/file)
  - `lastError: string | null`

### 3c. Ny systemprompt
- **`src/lib/ai/prompts.ts`**: Skriv om fra scratch. Inkluder:
  - Nøyaktig arkitekturbeskrivelse
  - Alle state-funksjoner med signaturer
  - Backup/restore dokumentasjon
  - Eksplisitte begrensninger
  - "Du handler KUN på brukerens instruks"

---

## Fase 4: Oppdater modell-liste

### 4a. Claude-client
- **`src/lib/ai/claude-client.ts`**: Oppdater `MODELS`-listen med alle gjeldende modeller.
- Legg til modell-beskrivelser (hastighet, pris-tier).

---

## Fase 5: Verifisering

1. `npm run build` — ingen feil
2. Paste tekst → spacebar → ord vises med ORP sentrert
3. Scrollhjul endrer WPM i sanntid
4. Panel åpnes/lukkes med knapp og Escape
5. DEV-tab: API-nøkkel, modellvalg, chat fungerer
6. DEV: be om kodeendring → diff vises → Apply → kode endret
7. DEV: Undo → kode reversert
8. Reload → settings og history bevart

---

## Fase 6: Bygg og installer

1. `npx tauri build`
2. Installer .dmg på skrivebordet
3. Verifiser at desktop-appen fungerer identisk med dev-server
