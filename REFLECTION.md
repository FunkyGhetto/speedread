# SpeedRead — Refleksjon

## Hva krever en god disposisjon?

En god disposisjon for et strømlinjet system krever fire dimensjoner:

1. **Brukeropplevelsen som nordstjerne** — Hvert designvalg må besvare: "Fjerner dette friksjon eller legger det til?" SpeedRead sin kjerneverdi er *fokusert lesing uten distraksjoner*. Alt som ikke direkte tjener dette målet er støy.

2. **Enkel sannhet i koden** — Systemet må ha én autoritativ kilde for hver tilstand. Når kode lover noe den ikke leverer (config-skjema som ikke er implementert, snapshot som mangler felter), skaper det teknisk gjeld som forvirrer DEV-AI og utviklere.

3. **Reversibilitet som grunnprinsipp** — Når en AI kan endre kode live, MÅ det finnes en sikker vei tilbake. Undo-stacken er session-only. Det er uakseptabelt.

4. **Minimalisme i grensesnitt, kraft i verktøy** — Brukeren trenger null knapper på hovedskjermen. DEV trenger full kontroll. Disse to behovene er komplementære.

---

## Hva mangler?

### Kritisk
- **Persistence er stille-feilende.** `writeJson()` i persistence.ts fanger feil med `console.warn()`. Data kan gå tapt uten at brukeren vet det.
- **DEV mangler full app-synlighet.** Runtime-snapshot inkluderer ikke: AI-config status, undo-stack størrelse, bokmerker, feillogg med detaljer. DEV er "blind" for halve appen.
- **DEV kan ikke reversere endringer pålitelig.** Undo-stack forsvinner ved reload. Ingen persistert backup.
- **Systemprompt lyver.** Den lover funksjoner som ikke eksisterer: timing-overrides, layout-config, rsvp-config via applyConfig().

### Design
- **UI-AI og DEV overlapper.** UI-AI var et forsøk på å la brukeren endre farger/fonter via chat. Men DEV kan gjøre ALT dette og mer. UI-AI er duplikat-funksjonalitet.
- **Kontroller på hovedskjerm er distraherende.** WPM-slider, progress-bar, play-knapper — alt dette bryter leseopplevelsen.
- **Settings spredt over flere steder.** Tema, font, farge — noe i settings-panel, noe i AI-config. Det bør være ETT sted: DEV.

### Kode
- **Død kode:** `chunker.ts` importeres men brukes aldri. `display`-feltet i WordToken er nå alltid lik `raw`. `getSystemTheme()` eksporteres men brukes ikke eksternt.
- **Hardkodede verdier:** 238 WPM baseline (stats), timing-multiplikatorer uten konstanter.
- **applyConfig() er halvferdig.** Håndterer `colors` og `fonts`, ignorerer `rsvp`, `layout`, `timing`.
- **Timing-overrides eksisterer som state men mangler getters.** De er aldri koblet til display-logikken.
- **Feil-svelging i code-modification.ts.** File-read feil kastes bort stille.

---

## Hva er feil?

1. **Arkitektur-splitt mellom to AI-systemer.** UI-AI og DEV gjør delvis det samme. UI-AI har en config-pipeline som er halvferdig. DEV har filmodifikasjon som faktisk fungerer. Løsningen: fjern UI-AI, gi DEV alt.

2. **Undo uten persistens.** I et system der en AI kan endre kildekoden live, er "undo forsvinner ved reload" en kritisk feil.

3. **Snapshot mangler kontekst.** DEV kan ikke svare "Hvorfor får vg.no den feilkoden?" fordi snapshot ikke inkluderer feilmeldinger, URL-input-tilstand, eller nettverksfeil.

4. **WPM-kontroll krever museklikk.** For en app som handler om FOKUS, er en slider den verste løsningen. Scrollhjul er zero-friction.

---

## Hva kan være bedre?

### Hovedskjerm
- Null distraksjoner. Ingen knapper, slider, progress-bar, WPM-tall. Bare ordet.
- Scrollhjul = WPM. Naturlig, intuitiv, null friksjon.
- Mellomrom = play/pause. Eneste interaksjon på hovedskjermen.
- Guide-linjer. Subtile horisontale linjer med ORP-markør gir struktur uten distraksjon.

### Panel-system
- Én samlet fane-gruppe som bretter inn/ut. INPUT (tekst, URL, fil), STATS, DEV.
- DEV erstatter UI-AI fullstendig. DEV ser hele app-tilstanden, kan endre kode, konfig, stil, alt.
- DEV har undo med persistens. Backup lagres til disk.
- Bruker velger Claude-modell. Full kontroll.

### DEV-spesifikt
DEV må forstå:
- Hele Svelte 5 runes-arkitekturen ($state, $derived, $effect)
- Fil-strukturen og hva hver fil gjør
- Alle state-funksjoner og hva de kontrollerer
- At han KUN handler på brukerens instruks — aldri proaktivt
- At han har backup/restore tilgjengelig
- Feillogg og runtime-tilstand i sanntid

DEV sine verktøy:
- `readSourceFile(path)` — les kildefil
- `writeSourceFile(path, content)` — skriv til kildefil
- `listSourceFiles()` — se alle filer
- App-snapshot med full tilstand (inkl. feil, config, etc.)
- Backup/restore-funksjoner
- Config-endring via kode

---

## Hva er viktig å tenke på når man designer disposisjonen?

1. **Rekkefølge betyr alt.** Fiks datalag (persistence) FØR du bygger nye features.
2. **Fjern før du legger til.** Slett UI-AI, død kode, settings-panel, playback-kontroller FØR redesign.
3. **DEV sin systemprompt er dokumentasjon.** Den må være 100% sann.
4. **Test reversibilitet.** Etter backup-system er på plass: endre → se → angre → verifiser.
5. **Hovedskjermen er hellig.** Ingen UI-elementer. Et vindu inn i teksten.
6. **Scrollhjul og mellomrom må fungere overalt på hovedskjermen.** Event-handlers på window-nivå.

---

## Eksplisitte beslutninger

- **UI-AI fjernes helt.** Kode, komponenter, state, prompts — alt relatert til UI-AI slettes.
- **DEV får full app-snapshot** inkludert feillogg, config-status, undo-stack, bokmerker, API-nøkkel-status.
- **Backup persisteres til disk.** Hver DEV-endring lagrer forrige tilstand.
- **WPM-slider, progress-bar, play-knapper fjernes** fra hovedskjermen.
- **Settings-fane fjernes.** DEV kan endre alt.
- **Modell-valg i DEV-panelet.** Dropdown med alle Claude-modeller.
- **Systemprompt reskrives fra scratch.** Bare sanne kapabiliteter.
