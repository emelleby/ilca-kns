# ILCA-KNS – Roadmap

Én prioritert liste over alt som skal bygges. Erstatter `tasks/tasks.json` og PRD-historienummer (som var tre ulike nummereringer). Krav-ID-er (FRx) refererer til [`prd.md`](prd.md).

Regel: ta fase for fase. Ikke start en fase før forrige fase er ferdig og testene er grønne. Detaljerte historier skrives i `docs/stories/` først når fasen starter.

## Status per nå

| Område | Status |
|---|---|
| Prosjektoppsett, database, auth (passkey + passord, reset) | Ferdig |
| Profiler med seilingsfelter | Ferdig |
| Organisasjoner, medlemskap, invitasjoner, superbruker-UI | Ferdig (UI i superuser-dashboard) |
| Testfundament: 64 tester (stories 1.1, 1.1.5, 1.2) | Ferdig |
| Feed, arrangementer, treningslogg, media, trener, moderering | Ikke startet |

## Fase 0 – Grunnlag (gjør først)

| # | Oppgave | Merknad |
|---|---|---|
| 0.1 | Oppgrader rwsdk til siste versjon (npm: 1.7.5; nå 0.3.9 på `main`) | Se under. Egen branch, alle 64 tester + manuell røyktest |
| 0.2 | Ryddede docs og enhetlig mappe-/filstruktur | Gjort i denne runden |
| 0.3 | Egen e-postavsender (Resend-domene) og `observability.enabled = true` | Kreves før produksjon |
| 0.4 | Felles hjelper `requireOrgRole(user, orgId, roles)` | Brukes av alle senere server functions |

**Om oppgraderingen (0.1):** `eivind/november` ligger på `1.0.0-beta.29` og er 9 commits foran `main`. Anbefaling: bruk den som utgangspunkt, vurder hva de 9 commitene inneholder, og gå videre til `latest` derfra i stedet for å starte fra `main`. Les rwsdk sine endringslogger for 0.3 → 1.x først (brytende endringer i ruting, `defineApp`, Vite-plugin er sannsynlige). Branchene `upgrade-to-0.85`, `kiro` og `eivind/flat` er på 0.0.85 og er eldre enn `main`; de bør arkiveres eller slettes.

## Fase 1 – Dynamisk fellesskap (FR1, FR2, FR13, FR14)

1. `Post.organizationId` + `visibility` (migrasjon)
2. Erstatt mock i `PostList` med databasespørring (respekter klubb og synlighet)
3. Opprett / rediger / slett innlegg (enkelt skjema, ren tekst)
4. Aktiv klubb: velger i header for brukere med flere medlemskap
5. Seed-data og tester for server functions

## Fase 2 – Arrangementer (FR6, FR7)

1. `Event` + `EventParticipant` (organisasjon, type, tid, sted, maks)
2. Kalender- og listevisning (mobil først, `react-day-picker` er allerede installert)
3. Opprett/rediger arrangement (admin/trener), påmelding og avmelding
4. Tester

## Fase 3 – Treningslogg (FR9)

1. `TrainingLog` (bruker, valgfri organisasjon, dato, varighet, forhold, oppsett, notater, `isPrivate`)
2. Opprett / liste / rediger / slett
3. Visning på egen profil, respekterer personverninnstillinger
4. Tester

**MVP er nådd etter fase 3.**

## Fase 4 – Rikere innhold (FR3, FR4, FR5)

1. Kommentarer og likes
2. Bildeopplasting til R2 (signert opplasting, størrelsesgrense, metadata-tabell)
3. Rik tekst-editor (velg bibliotek som er kompatibelt med Workers/SSR)
4. YouTube-innbygging

## Fase 5 – Trenere og grupper (FR10, FR15, FR16)

1. `TrainingGroup` + gruppemedlemskap under `Organization`
2. Deling av treningslogg til tildelt trener
3. Trenerdashboard: seilere, grupper, logger, tilbakemelding
4. Gruppemålrettede innlegg og arrangementer

## Fase 6 – Moderering og drift (FR17, FR18)

1. Flagging og modereringskø i superuser/admin
2. Skjul/slett/gjenopprett innhold, bulkhandlinger
3. Enkel bruksstatistikk
4. E2E-tester (Playwright) for kritiske flyter

## Senere / ideer (FR8, FR11, FR12 og utenfor omfang)

- E-postpåminnelser for arrangementer
- Fremdriftsgrafer i treningsloggen
- Automatisk værdata
- Aktivitetsstrøm generert fra treningslogg
- Søk, varsler, tilgjengelighetsgjennomgang, ytelsesoptimalisering

## Nummerering

| System | Hva det var | Nå |
|---|---|---|
| `tasks/tasks.json` (Task 1–25) | Gammel Task Master-liste, ute av synk | Erstattet av denne filen. Kan slettes når dere er enige |
| PRD Story 1.1–1.6 | Feature-historier | Erstattet av fasene over |
| `docs/stories/story-1.x` | Testhistorier (fullført) | Beholdes som historikk; regnes som «Fase T» |
