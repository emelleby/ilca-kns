# ILCA-KNS – PRD

Produktkrav for seilingsfellesskapet ILCA-KNS. Teknisk bakgrunn: [`architecture.md`](architecture.md). Rekkefølge og status: [`roadmap.md`](roadmap.md).

| Versjon | Dato | Endring |
|---|---|---|
| 1.0 | 2025-01-10 | Første brownfield-PRD |
| 2.0 | 2025-11 | Strammet inn: færre krav per fase, bygger på `Organization`, detaljer flyttet til roadmap |

## 1. Hva vi bygger

En mobil-først webplattform for en seilingsklubb og dens seilere og trenere. Per i dag finnes innlogging (passkey + passord), profiler med seilingsdata, organisasjoner med medlemmer og invitasjoner, og et superbruker-dashboard. Fellesskapsfeeden bruker fortsatt mock-data.

Målet er at et klubbmedlem kan: følge hva som skjer i klubben, melde seg på arrangementer, føre treningslogg, og at trenere kan følge opp sine seilere.

## 2. Brukerroller

| Rolle | Behov |
|---|---|
| Seiler (medlem) | Lese og skrive innlegg, melde seg på arrangementer, føre treningslogg, administrere egen profil |
| Trener | Alt seilere kan, pluss oppfølging av tildelte seilere og treningsgrupper |
| Klubbadministrator | Administrere medlemmer, arrangementer og innhold i egen klubb |
| Superbruker | Plattformadministrasjon på tvers av klubber |

En bruker kan ha flere roller, og kan være medlem av flere klubber (organisasjoner) med ulik rolle i hver. Dette er allerede støttet av `OrganizationMembership`; det som mangler er grensesnitt og tilgangsstyring som bruker det.

## 3. Funksjonelle krav

Prioritet: **M** = må (MVP), **S** = bør, **K** = kan (senere).

### Innhold
- **FR1 (M)** Fellesskapsfeeden viser innlegg fra databasen, med klubbtilhørighet og synlighet (offentlig / kun klubb).
- **FR2 (M)** Innloggede brukere kan opprette, redigere og slette egne innlegg. Administratorer kan slette andres.
- **FR3 (S)** Kommentarer og likes på innlegg.
- **FR4 (S)** Rik tekst-editor og bilder i innlegg.
- **FR5 (K)** Video (YouTube-innbygging) og opplasting av egne videoer.

### Arrangementer
- **FR6 (M)** Kalender med arrangementer (trening, regatta, sosialt, møte) per klubb.
- **FR7 (M)** Påmelding (RSVP) med status og maks antall deltakere.
- **FR8 (K)** Påminnelser på e-post.

### Trening
- **FR9 (M)** Personlig treningslogg: dato, varighet, forhold (vind/vær), båt/oppsett, notater, privat eller delt.
- **FR10 (S)** Delte logger synlige for tildelt trener.
- **FR11 (K)** Fremdriftsvisning og statistikk.
- **FR12 (K)** Værdata automatisk fylt inn fra en ekstern kilde.

### Klubb og roller
- **FR13 (M)** Tilgangsstyring basert på rolle i organisasjonen (innlegg, arrangementer, medlemmer).
- **FR14 (M)** Bytte aktiv klubb for brukere med flere medlemskap.
- **FR15 (S)** Treningsgrupper innen en klubb med trenere og deltakere.
- **FR16 (S)** Trenerdashboard: oversikt over seilere/grupper og deres logger, tilbakemelding.

### Administrasjon
- **FR17 (S)** Moderering: flagge, skjule og slette innhold; køoversikt for administrator.
- **FR18 (K)** Statistikk for plattformbruk.

## 4. Ikke-funksjonelle krav

- **NFR1** Følger RedwoodSDK-mønstre (serverkomponenter, server functions) og Workers-begrensninger.
- **NFR2** Eksisterende innlogging og sesjoner skal ikke brytes av noen endring.
- **NFR3** Databaseendringer er additive og har migrasjon via `pnpm migrate:new`.
- **NFR4** UI bruker shadcn/ui og Tailwind, mobil-først.
- **NFR5** Sidelasting under 2 sekunder for typiske sider.
- **NFR6** Autorisasjon håndheves på server; nye server functions har tester.
- **NFR7** Personvern: private data (profilfelt, private treningslogger) eksponeres aldri uten eksplisitt delingsvalg.

## 5. Utenfor omfang (foreløpig)

Sanntids-regattasporing, betaling og kontingent, innebygd chat/meldinger, offline-modus, native apper, push-varsler.

## 6. Risikoer

| Risiko | Tiltak |
|---|---|
| Skjemaendringer påvirker auto-opprettelse av profil | Additive migrasjoner; kjør eksisterende tester før og etter |
| Store mediafiler mot Workers-grenser | Direkteopplasting til R2 med signert URL; begrens filstørrelse |
| Rettighetslogikk sprer seg i koden | Én felles hjelpefunksjon for «har rolle X i organisasjon Y», brukt av alle server functions |
| Rammeverket er under rask utvikling (rwsdk 0.3.9 → 1.7.x) | Oppgrader først (roadmap fase 0), før nye features bygges |

## 7. Suksesskriterier for MVP (fase 1–3)

- Medlemmer kan logge inn, se klubbens innlegg, skrive innlegg, melde seg på arrangementer og føre treningslogg.
- Alle nye server functions har tester; eksisterende 64 tester består.
- Produksjon har egen e-postavsender og Cloudflare-logging slått på.
