# ILCA-KNS – Arkitektur

Sist verifisert mot kode: 2026-11 (branch `claude/upgrade-rwsdk`, rwsdk 1.7.5). Når noe her ikke stemmer med koden, er koden riktig – oppdater dokumentet.

Planlagt funksjonalitet står i [`roadmap.md`](roadmap.md). Produktmål står i [`prd.md`](prd.md).

## 1. Stack (fra `package.json`)

| Område | Teknologi | Versjon |
|---|---|---|
| Rammeverk | RedwoodSDK (`rwsdk`) | 1.7.5 (`main` er fortsatt 0.3.9 til grenen er slått inn) |
| UI | React, Tailwind CSS 4, shadcn/ui (Radix) | React 19.3.1, Tailwind 4.3.4 |
| Runtime | Cloudflare Workers (`nodejs_compat`) | – |
| Database | Cloudflare D1 + Prisma (adapter-d1) | ~6.8.2 |
| Lagring | Cloudflare R2 (binding `STORAGE`, ennå ikke brukt i kode) | – |
| Sesjon | Durable Object `SessionDurableObject` | – |
| Auth | WebAuthn (SimpleWebAuthn) + e-post/passord | – |
| E-post | Resend | ^4.5 |
| Bygg | Vite | 8.3 |
| Test | Vitest + Testing Library (jsdom) | 5.1 |
| Pakkehåndtering | pnpm | – |

### rwsdk 0.3.9 → 1.7.5 (gjort på `claude/upgrade-rwsdk`)

Oppgradert sammen med pakkene rwsdk krever: React/react-dom 19.3.1, `react-server-dom-webpack` 19.3.1, wrangler 4.157, `@cloudflare/vite-plugin` 1.67, `@cloudflare/workers-types` 5.x, Vite 8, Vitest 5, Tailwind 4.3.4. Prisma er bevisst ikke oppgradert (6.8.x).

Brytende endringer vi måtte håndtere:

- `headers` er flyttet til `response.headers`, både i middleware (`({ response }) => response.headers`) og i `requestInfo` (`requestInfo.response.headers`). Gammel destrukturering gir `undefined` i kjøring.
- `compatibility_date` i `wrangler.jsonc` er satt til `2025-09-21`. React 19.3 bruker `WeakRef`, som mangler med den gamle datoen (`2024-09-23`) og ga 500 på alle sider.
- Tester: `@testing-library/jest-dom/vitest` (ikke `@testing-library/jest-dom`), og test-mocks bruker `response: { headers }`.
- `RESEND_API_KEY` må finnes i `.dev.vars` ved `wrangler types` for at typen skal genereres; den er lagt i `.env.example`.

I dev-modus skriver React en advarsel om `eval()` fordi CSP ikke tillater `unsafe-eval`. Den gjelder bare utvikling.

Gamle grener: `eivind/november` (1.0.0-beta.29 + uferdig sidebar), `upgrade-to-0.85`, `kiro` og `eivind/flat` er utdaterte.

## 2. Kodestruktur (faktisk)

```
src/
  worker.tsx          # defineApp: middleware (db, sesjon, bruker) + ruter
  db.ts               # Prisma-klient (D1)
  session/            # store.ts, durableObject.ts
  app/
    Document.tsx, headers.ts, interceptors.ts
    auth/             # email.ts (Resend), password.ts
    components/       # PostCard, PostList, PostFilter, ProfileEditForm, UserProfileSidebar, ui/ (shadcn)
    layouts/          # HomeLayout, AuthLayout, SidebarLayout
    pages/
      Home, FrontPage, TasksPage, Test
      user/           # Login, Signup, Forgot/ResetPassword, profile/, settings/, routes.tsx, functions.ts
      superuser/      # Dashboard, organisasjons-dialoger, routes.tsx, functions.ts
      admin/          # routes.tsx, functions.ts
    shared/, hooks/, lib/
  scripts/seed.ts
  test/               # setup + mock-hjelpere
prisma/schema.prisma
migrations/           # 0001–0006
```

Ruter i `worker.tsx`: `/`, `/home` (krever innlogging), `/tasks`, `/test`, `/pingo`, `/protected`, `/user/*`, `/superuser/*`.

## 3. Datamodell (`prisma/schema.prisma`)

Eksisterer i dag:

- `User` (rolle `USER` | `SUPERUSER`), `Credential` (passkeys), `PasswordReset`
- `Profile` (seilingsfelter: erfaring, sertifikater, båtinfo, klubb, personverninnstillinger som JSON-streng)
- `Organization`, `OrganizationMembership` (`role`: `"ADMIN"` | `"COACH"` | `"MEMBER"` som streng), `OrganizationInvitation`
- `Post` (status `DRAFT` | `PUBLISHED` | `ARCHIVED`), `Comment`

Finnes **ikke** (var feilaktig beskrevet som eksisterende tidligere): `Club`, `ClubMembership`, `TrainingGroup`, `GroupMembership`, `Event`, `EventParticipant`, `TrainingLog`, `Like`, media-tabell.

### Beslutning: `Organization` er klubbmodellen

Vi lager ikke en parallell `Club`-modell. `Organization` + `OrganizationMembership` utvides ved behov:

- `Post.organizationId` (nullable) og `Event.organizationId` for klubbtilhørighet
- `TrainingGroup` (tilhører `Organization`) innføres først når treningsgrupper bygges
- Roller per organisasjon holdes som streng til de er stabile; gjør dem til enum i egen migrasjon når settet er avklart

Alle skjemaendringer skal være additive (nye tabeller / nullable kolonner), slik at eksisterende brukere og profiler ikke berøres.

## 4. Mønstre som gjelder

- **Server-først**: sider er serverkomponenter som henter data; `"use client"` kun for interaktivitet. Se `reference/memory-bank/redwoodSDKPatterns.md`.
- **Server functions** (`"use server"`) for mutasjoner, plassert i `functions.ts` ved siden av siden.
- **Autorisasjon** gjøres i serveren (middleware / interrupter eller i funksjonen). Aldri kun i UI.
- **Cloudflare Workers-fallgruver**: hengende Promises (unngå unødvendig `async`, bruk Suspense rundt asynkrone serverkomponenter) og at bare «plain objects» kan sendes til klientkomponenter. Detaljer i `reference/memory-bank/techContext.md`.
- **Ytelse/rettigheter**: bruk ett indeksert Prisma-oppslag mot `OrganizationMembership` per forespørsel. Vi bygger ikke egen rettighetscache eller denormalisert `permissionsJson` før det er målt et faktisk problem.

## 5. Autentisering

- Primær: passkey (WebAuthn). Fallback: e-post/passord med tilbakestilling via Resend.
- Sesjon i Durable Object; `worker.tsx` laster `ctx.session` og `ctx.user` for hver forespørsel.
- E-post sendes i dag fra `onboarding@resend.dev` (kun utvikling). Eget avsenderdomene må settes opp før produksjon.

## 6. Test

Vitest, jsdom, 64 tester i 5 filer (`pnpm test`):

| Fil | Tester |
|---|---|
| `components/__tests__/ProfileEditForm.test.tsx` | 19 |
| `pages/user/__tests__/serverFunctions.test.tsx` | 17 |
| `layouts/__tests__/HomeLayout.test.tsx` | 13 |
| `pages/user/__tests__/Login.test.tsx` | 11 |
| `pages/user/__tests__/integration.test.tsx` | 4 |

Mønster: mock `cloudflare:workers`, `rwsdk/worker`, `@/db` og sesjon i `src/test/setup.ts`; gjenbrukbare hjelpere i `src/test/utils/serverFunctionMockHelper.ts`. Nye server functions skal ha tester etter samme mønster. Playwright/E2E er ikke satt opp.

## 7. Kommandoer

Se `CLAUDE.md` (dev, build, migrate, seed, types, test).

## 8. Kjente gjenstående punkter

- `PostList` bruker statisk mock-data (`getLatestPosts`)
- R2-binding finnes, men ingen opplasting er implementert
- Ingen produksjonsovervåking utover Cloudflare-standard (`observability.enabled = false` i `wrangler.jsonc`)
- E-postavsender er utviklingsadresse
