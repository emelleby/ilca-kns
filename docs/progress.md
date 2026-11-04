# Fremdrift

Felles minne for prosjektet. Nyeste øverst. Regler for hvordan dette føres står i `ai-guidelines.md`. Plan og rekkefølge: `roadmap.md`. Arbeidsliste: `tasks/tasks.json`.

## Nå

- **Fase 0 pågår.** rwsdk-oppgraderingen (oppgave 26) er gjort på grenen `claude/upgrade-rwsdk` og venter på gjennomgang og merge. Neste: 27 (e-postavsender + logging) og 28 (`requireOrgRole`).
- `main` er fortsatt på rwsdk 0.3.9 til grenen er slått inn.

## Åpne punkter

- `eivind/november` har uferdig sidebar-arbeid (hydreringsfeil, mobilmeny). Ikke inkludert i oppgraderingen. Avgjør om det skal gjenopptas på toppen av `claude/upgrade-rwsdk`.
- Før merge til produksjon: test passkey-innlogging og e-post (reset) manuelt; `compatibility_date` er endret fra 2024-09-23 til 2025-09-21, og dette endrer Workers-runtime i produksjon.
- Oppgrader Prisma 6.8 → 7 senere (egen oppgave); ikke krevd av rwsdk.
- `PostList` bruker statisk mock-data.
- R2-binding finnes, men er ikke i bruk.
- E-post sendes fra `onboarding@resend.dev` (kun utvikling).
- `observability.enabled = false` i `wrangler.jsonc`.
- Eldre grener (`upgrade-to-0.85`, `kiro`, `eivind/flat`) er utdaterte og kan slettes.

## Logg

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
