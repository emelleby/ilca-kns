# Fremdrift

Felles minne for prosjektet. Nyeste øverst. Regler for hvordan dette føres står i `ai-guidelines.md`. Plan og rekkefølge: `roadmap.md`. Arbeidsliste: `tasks/tasks.json`.

## Nå

- **Fase 0 pågår.** Neste: oppgave 26 (oppgradere rwsdk), 27 (e-postavsender + logging), 28 (`requireOrgRole`).
- Produksjon kjører på `main` med rwsdk 0.3.9. `eivind/november` har 1.0.0-beta.29 og 9 commits som ikke er i `main`.

## Åpne punkter

- Skal `eivind/november` slås inn i `main` før eller som del av oppgradering til siste rwsdk (1.7.5)? Avklares i oppgave 26.
- `PostList` bruker statisk mock-data.
- R2-binding finnes, men er ikke i bruk.
- E-post sendes fra `onboarding@resend.dev` (kun utvikling).
- `observability.enabled = false` i `wrangler.jsonc`.
- Eldre grener (`upgrade-to-0.85`, `kiro`, `eivind/flat`) er utdaterte og kan slettes.

## Logg

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
