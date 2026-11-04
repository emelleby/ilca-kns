# AI Guidelines – slik jobber vi i prosjektet

Gjelder alle AI-assistenter (og mennesker) som jobber i repoet. Assistenter har ikke minne mellom økter, så **dokumentasjonen er det felles minnet**. Hold den korrekt og kort.

## Start hver økt slik

Les i denne rekkefølgen:

1. `CLAUDE.md` – kommandoer og prosjektoversikt
2. `docs/progress.md` – hva som er gjort, hva som pågår, åpne beslutninger
3. `docs/roadmap.md` – faser og rekkefølge
4. `docs/architecture.md` – hvordan systemet faktisk er bygget nå
5. Ved behov: `docs/reference/memory-bank/` (rwsdk-mønstre, Workers-regler, systemmønstre) og `.cursor/rules/`

Når noe i dokumentene ikke stemmer med koden, er koden riktig. Rett dokumentet.

## Dokumentene og hva de er til

| Fil | Formål | Oppdateres |
|---|---|---|
| `docs/prd.md` | Hva og hvorfor (produktkrav) | Når krav endres |
| `docs/roadmap.md` | Faser og rekkefølge | Når prioritering endres |
| `tasks/tasks.json` | Arbeidslisten vi jobber fra. Vises på `/tasks` | Hver gang en oppgave starter eller fullføres |
| `docs/progress.md` | Fremdriftslogg og felles minne | Etter hver betydelig endring |
| `docs/architecture.md` | Nåtilstand: stack, struktur, skjema, mønstre | Når skjema, struktur eller mønstre endres |
| `docs/stories/` | Detaljerte historier for aktiv fase | Skrives når fasen starter |
| `docs/reference/` | Mønstre og veiledninger (rwsdk, shadcn, Tailwind, Resend) | Sjelden |

`tasks/tasks.json` er den løpende listen over det som skal gjøres. `roadmap.md` er det store bildet og `tasks.json` er detaljene. Hver oppgave har feltet `phase` som peker på roadmap-fasen. Gyldige statuser er `pending`, `in-progress` og `done` (siden `/tasks` forstår bare disse). `tasks/task_NNN.txt` er genererte kopier av `tasks.json`; endre `tasks.json` og hold txt-filene i synk.

## Arbeidsflyt

1. **Plan først.** Les relevante filer, foreslå tilnærming og få aksept før større endringer. Gå inkrementelt («easy does it») og unngå endringer som er vanskelige å feilsøke.
2. **Sett oppgaven til `in-progress`** i `tasks/tasks.json`.
3. **Bygg med tester.** Nye server functions og kritiske komponenter får Vitest-tester etter mønsteret i `docs/architecture.md` §6. Kjør `pnpm test` og `pnpm types` før commit.
4. **Skjemaendringer** er additive og går via `pnpm migrate:new`, deretter `pnpm generate`.
5. **Oppdater dokumentasjon** før du avslutter: sett oppgaven til `done`, legg inn en linje i `docs/progress.md`, og juster `architecture.md` hvis noe der ikke lenger stemmer.

## Skriveregler for `docs/progress.md`

- Nyeste først, én kort oppføring per betydelig endring: dato, hva, hvorfor (om ikke åpenbart), referanse til oppgave-ID.
- Skriv beslutninger og lærdom, ikke gjenfortelling av koden.
- Åpne spørsmål og midlertidige løsninger går under «Åpne punkter». Fjern dem når de er løst.
- Ikke dupliser innhold fra `architecture.md` eller `roadmap.md`; lenk til dem.

## Regler for koden

Se `CLAUDE.md` og `.cursor/rules/`. Viktigst:

- Serverkomponenter henter data; `"use client"` bare for interaktivitet.
- Autorisasjon håndheves på server, aldri bare i UI.
- Unngå hengende Promises i Workers (se `docs/reference/memory-bank/techContext.md`).
- Bruk shadcn/ui-komponentene som finnes i `src/app/components/ui/` før du lager nye.
