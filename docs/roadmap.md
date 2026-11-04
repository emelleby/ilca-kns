# ILCA-KNS – Roadmap

Det store bildet: alt som skal bygges, i prioritert rekkefølge. Den løpende arbeidslisten er `tasks/tasks.json` (vises på `/tasks`); hver oppgave har feltet `phase` som peker hit. Fremdrift føres i [`progress.md`](progress.md). Krav-ID-er (FRx) refererer til [`prd.md`](prd.md).

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
| 0.1 | Oppgrader rwsdk til siste versjon (1.7.5) | Gjort på `claude/upgrade-rwsdk`, venter på merge. Se `progress.md` |
| 0.2 | Ryddede docs og enhetlig mappe-/filstruktur | Gjort i denne runden |
| 0.3 | Egen e-postavsender (Resend-domene) og `observability.enabled = true` | **Utsatt** (ikke noe domene ennå). Dev bruker `DEV_EMAIL_TO`. Kreves før produksjon |
| 0.4 | Rollesjekk i server functions | Flyttet inn i fase 1 (bygges sammen med første bruker, innlegg). Ruteinterceptors finnes allerede i `src/app/interceptors.ts` |
| 0.5 | **Autorisasjon i alle server functions** (oppgave 29) | Kritisk sikkerhetsfeil funnet; gjøres før mer bygges. Se `docs/security/server-function-authorization.md` |

**Om oppgraderingen (0.1):** utført fra `main`, ikke fra `eivind/november`, som er ett år gammel og har uferdig sidebar-arbeid. Detaljer og brytende endringer: `architecture.md` §1. Grenene `upgrade-to-0.85`, `kiro` og `eivind/flat` er på 0.0.85 og kan slettes.

## Fase 1 – Dynamisk fellesskap (FR1, FR2, FR13, FR14)

**Forutsetning:** punkt 0.5 (autorisasjon) før innleggs-CRUD, ellers blir skriving åpent for alle.

1. ✅ `Post.organizationId` + `visibility` (PUBLIC / ORGANIZATION / COACH), migrasjon 0007
2. ✅ Synlighetsregler (`postVisibility.ts`) og `PostList` mot databasen
3. ✅ Seed-data på alle nivåer; tester
4. Opprett / rediger / slett innlegg (enkelt skjema, ren tekst) med synlighetsvalg og rollesjekk (forfatter eller admin)
5. Aktiv klubb: velger i header for brukere med flere medlemskap (utsatt til det trengs)

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
| `tasks/tasks.json` (Task 1–28) | Arbeidsliste, vist på `/tasks` | Beholdt og synkronisert med fasene (felt `phase`). Task 26–28 tilsvarer fase 0.1, 0.3 og 0.4 |
| PRD Story 1.1–1.6 | Feature-historier | Erstattet av fasene over |
| `docs/stories/story-1.x` | Testhistorier (fullført) | Beholdes som historikk; regnes som «Fase T» |
