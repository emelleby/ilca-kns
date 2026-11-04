# Fremdrift

Felles minne for prosjektet. Nyeste øverst. Regler for hvordan dette føres står i `ai-guidelines.md`. Plan og rekkefølge: `roadmap.md`. Arbeidsliste: `tasks/tasks.json`.

## Nå

- **Fase 1 pågår** (dynamiske innlegg). Lesesiden er ferdig: feed fra database med synlighet. Neste: opprette/redigere/slette innlegg med synlighetsvalg.
- rwsdk 1.7.5 er merget til `main`. Oppgave 27 (domene/e-post i produksjon) er utsatt; dev bruker `DEV_EMAIL_TO`.

## Åpne punkter

- **SIKKERHET (høyeste prioritet, oppgave 29):** server functions mangler autorisasjon. Verifisert i nettleser mot dev: en uinnlogget besøkende kan opprette organisasjoner, og en vanlig bruker kan gjøre seg selv til ADMIN i en klubb. I tillegg kan profiler endres/slettes av andre, `getPublicProfile` kan omgå personvern (klienten sender `viewerId`), og `addPasswordToPasskeyAccount`/`addPasskeyToExistingAccount` tar `userId` fra klienten (mulig kontoovertakelse hvis bruker-ID er kjent). Gjelder `superuser/functions.ts`, `user/functions.ts` og `user/profile/functions.ts`. Hvis dette kjører i produksjon bør det utbedres før mer bygges, og databasen sjekkes for uventede organisasjoner, medlemskap og roller.

- `eivind/november` har uferdig sidebar-arbeid (hydreringsfeil, mobilmeny). Ikke inkludert i oppgraderingen. Avgjør om det skal gjenopptas på toppen av `claude/upgrade-rwsdk`.
- Før merge til produksjon: test passkey-innlogging og e-post (reset) manuelt; `compatibility_date` er endret fra 2024-09-23 til 2025-09-21, og dette endrer Workers-runtime i produksjon.
- Oppgrader Prisma 6.8 → 7 senere (egen oppgave); ikke krevd av rwsdk.
- Innlegg kan ikke opprettes fra UI ennå (kun seed).
- R2-binding finnes, men er ikke i bruk.
- E-post sendes fra `onboarding@resend.dev` (kun utvikling).
- `observability.enabled = false` i `wrangler.jsonc`.
- Eldre grener (`upgrade-to-0.85`, `kiro`, `eivind/flat`) er utdaterte og kan slettes.

## Logg

### 2026-11-04 – Gjennomgang av oppgave 5 og 6
- Oppgave 5 (RBAC) er ikke ferdig. Ferdig: datamodell, roller, rute-interceptors, rolletildeling via superbruker-UI, synlighetsregler for innlegg. Mangler: håndheving i server functions (ny oppgave 29, kritisk), org-admin-funksjoner (placeholder), UI etter rettigheter, coach–seiler (fase 5), moderering (fase 6).
- Oppgave 6 var for generisk til å starte på. Omfanget for fase 1 er avgrenset, med foreslåtte beslutninger og delmål 6.1–6.6 i `tasks.json`; resten er flyttet til senere oppgaver.
- Lærdom: rutebeskyttelse er ikke autorisasjon. `"use server"`-funksjoner er direkte kallbare og må sjekke bruker og rolle selv.

### 2026-11-04 – Fase 1: innlegg fra database med synlighet
- Beslutning: tre synlighetsnivå per innlegg: `PUBLIC` (alle), `ORGANIZATION` (klubben), `COACH` (forfatter + coacher/admins i klubben). Regler samlet i `src/app/lib/postVisibility.ts`; `canViewPost` og `visiblePostsWhere` holdes i synk av en test. Superbruker har ikke egen tilgang til private innlegg.
- Migrasjon `0007`: `Post.organizationId`, `visibility`, `imageUrl` + indekser (eksisterende data bevares).
- `PostList` er en async serverkomponent mot databasen; forsiden (uinnlogget) viser bare offentlige innlegg. Ubrukt `HomeContentClient` slettet.
- Rollesjekk for server functions bygges sammen med innleggs-CRUD i stedet for som egen oppgave (28). Aktiv klubb-velger utsatt.
- Seed: fikset (`setupDb(env)` mangler i skript under rwsdk 1.x), 7 innlegg på alle nivåer, og felles lokalt passord `password123` for seed-brukerne. Seed sletter og gjenskaper bare sine egne rader (faste ID-er: `superuser-1`, `user-1..3`, `org-1..3`) og kan kjøres flere ganger uten å røre egne kontoer, profiler eller passkeys.
- Verifisert i nettleser: uinnlogget 2 innlegg, alice 6, bob 6, charlie 5, superbruker 2; utkast vises aldri. 108 tester, `tsc` uendret (30 eksisterende), bygg OK.

### 2026-11-04 – Passord-reset (e-post)
- Fjernet hardkodet mottaker i `requestPasswordReset`; e-post går nå til brukerens egen adresse.
- Dev: `DEV_EMAIL_TO` i `.dev.vars` omdirigerer all reset-e-post (Resends testavsender leverer bare til kontoeieren). Reset-lenken logges i serverkonsollen i dev, så flyten kan testes uten e-post.
- Funksjonen returnerer alltid `true` (ingen kontoavsløring), og feil fra Resend logges.
- `IS_DEV` hentes fra `rwsdk/constants` også i `user/functions.ts`.
- Nye tester som kjører den ekte funksjonen (`passwordReset.test.ts`, 6 stk) og en `cloudflare:workers`-stubb i Vitest. Merk: de gamle `serverFunctions.test.tsx` mocker selve funksjonene og tester derfor lite av den ekte koden.
- Gjenstår før produksjon: verifisert avsenderdomene i Resend (oppgave 27). Uten det kan e-post bare sendes til kontoeieren.

### 2026-11-04 – Fikset `/tasks`
- `TasksPage` kjørte `JSON.parse` på en JSON-import som allerede er et objekt (importen ble endret fra `?raw` i `fa49409`). Bruker nå objektet direkte.
- Lærdom: etter å ha hentet `main` med nye pakker må `pnpm install` kjøres, ellers får man misvisende Worker-/Vite-feil.

### 2026-11-04 – rwsdk 0.3.9 → 1.7.5 (oppgave 26)
- Ny gren `claude/upgrade-rwsdk` fra dokumentasjonsgrenen. Ikke basert på `eivind/november` (ett år gammel, blandet med uferdig sidebar).
- Pakker: rwsdk 1.7.5, React/react-dom 19.3.1, react-server-dom-webpack 19.3.1, wrangler 4.157, @cloudflare/vite-plugin 1.67, workers-types 5.x, Vite 8, Vitest 5, Tailwind 4.3.4.
- Kodeendringer: `headers` → `response.headers` (worker.tsx, headers.ts, user/functions.ts), `compatibility_date` 2025-09-21 (WeakRef), jest-dom/vitest-import, test-mocks.
- Verifisert: 64/64 tester, `tsc` uendret på 30 eksisterende feil, `vite build` OK, dev-server rendrer alle sider, registrering → `/home`, profil og `/tasks` fungerer i nettleser (Playwright).
- Ikke verifisert: passkey (krever ekte autentikator), e-postsending, produksjonsdeploy.
- Lærdom: sjekk peer-avhengigheter ved større oppgraderinger; rwsdk 1.x krevde Vite 8 via `@vitejs/plugin-react` 6, som igjen krevde nyere Tailwind-plugin og Vitest.
### 2026-11-04 – Dokumentasjon strammet inn
- `prd.md` forkortet, `architecture.md` skrevet om til å matche koden, `roadmap.md` opprettet.
- Slettet duplikater: to gamle arkitekturdokumenter, generisk TDD-guide, QA-trace, gamle `progress.md`/`activeContext.md`.
- Slettet utdaterte rotfiler fra Augment/Gemini-verktøy (`GEMINI.md`, `project-info.md`, `augment-*`, `Task5/6/4-*`).
- `tasks/tasks.json` synkronisert med virkeligheten og roadmap: statuser rettet, `phase` lagt til, oppgave 26–28 lagt til.
- Beslutning: `Organization` er klubbmodellen. Ingen parallell `Club`-modell.
- Lærdom: dokumentene hadde oppgitt rwsdk 0.0.85 lenge etter at `main` var på 0.3.9. Sjekk `package.json` før du siterer versjoner.

### 2025-09 – Testfundament (stories 1.1, 1.1.5, 1.2)
- 64 Vitest-tester: login (11), profilskjema (19), navigasjon (13), integrasjon (4), server functions (17).
- Gjenbrukbare mock-hjelpere i `src/test/utils/serverFunctionMockHelper.ts`; Workers/D1-mocking i `src/test/setup.ts`.
- Playwright er nevnt i risikoplanen, men ikke installert.

### 2025 (tidligere) – Plattformgrunnlag
- RedwoodSDK på Cloudflare Workers, D1 + Prisma, Durable Object-sesjoner.
- Autentisering: passkey (WebAuthn) og e-post/passord med tilbakestilling via Resend.
- Profiler med seilingsfelter (erfaring, sertifikater, båtinfo, klubb, personvern). Profil opprettes automatisk.
- Organisasjoner, medlemskap og invitasjoner med superuser-UI (`/superuser`).
- Løste Workers-problemer: hengende Promises, «plain objects»-feil mellom server og klient, hydreringsfeil fra nettleserutvidelser. Mønstrene er i `docs/reference/memory-bank/techContext.md` og `redwoodSDKPatterns.md`.
