# Sikkerhet: manglende autorisasjon i server functions (oppgave 29)

| | |
|---|---|
| **Status** | Ikke utbedret. Funnet og verifisert 2026-11-04 |
| **Alvorlighet** | Kritisk: kontoovertakelse uten innlogging, uautorisert endring av roller og data |
| **Berørt kode** | `main` (rwsdk 1.7.5, commit `c64232e`) og gren `claude/phase1-posts`. Sannsynligvis også eldre versjoner (koden er uendret), men dette er ikke testet |
| **Oppgave** | `tasks/tasks.json` oppgave 29. Skal gjøres før oppgave 28 og 6 |
| **Reproduksjon / akseptansetest** | `docs/security/repro-server-function-authz.cjs` |

> **Merk:** hvis repoet er offentlig, bør detaljene i dette dokumentet (og reproduksjonsskriptet) ikke publiseres før utbedringen er deployet.

## 1. Sammendrag

Alle funksjoner som eksporteres fra en `"use server"`-fil er HTTP-endepunkter som nettleseren kan kalle direkte, av hvem som helst, med egne argumenter. Beskyttelsen i appen ligger i dag nesten bare i **rutene** (`isAuthenticated`, `isSuperUser`) og i **UI-et**, og det stopper ikke direkte kall. De fleste server functions sjekker verken at brukeren er innlogget, hvilken rolle brukeren har, eller at `userId` i argumentene tilhører den som kaller.

Verifisert i nettleser mot lokal dev-server (13 av 13 forsøk lyktes):

- En **uinnlogget** besøkende kan opprette organisasjoner, liste alle organisasjoner med medlemmenes bruker-ID, brukernavn og e-post, og lese hvilke organisasjoner en bruker tilhører.
- En **vanlig innlogget bruker** (alice, ikke superbruker) kan gjøre seg selv til ADMIN i en klubb, melde seg inn i en annen klubb som ADMIN, fjerne andre fra en klubb, og redigere eller slette andres profiler.
- **Kontoovertakelse:** en uinnlogget besøkende kan sette e-post og passord på en annen brukers konto (`addPasswordToPasskeyAccount`) og deretter logge inn som den brukeren (`loginWithPassword`). Bruker-ID-en som trengs kan hentes ut av de åpne organisasjonsfunksjonene.
- Personvernet på profiler kan omgås ved at klienten selv oppgir `viewerId`.

## 2. Rotårsak

1. **`"use server"` er ikke autorisasjon.** Hver eksportert funksjon må selv hente innlogget bruker (`requestInfo.ctx.user`) og sjekke rolle/eierskap. Eneste funksjon som gjør det riktig i dag er `removePasskey` (`user/functions.ts:334`).
2. **Identitet tas fra klienten.** Funksjoner tar `userId`, `viewerId` og `createdBy` som argument i stedet for å bruke den innloggede brukeren.
3. **For mye er eksportert.** Interne hjelpefunksjoner ligger i `"use server"`-filer og blir dermed endepunkter (f.eks. `addMemberToOrganization`, `autoCreateUserProfile`, `hasUserProfile`, `getUserProfile`).
4. **Ruteguards gir falsk trygghet.** `superuser/routes.tsx` og `interceptors.ts` beskytter sidene, ikke funksjonene siden kalles uavhengig av rutene.

## 3. Reprodusere

Kun lokalt. Skriptet gjør ekte skrivinger (oppretter organisasjon, endrer rolle, setter passord på en seed-konto).

```bash
pnpm migrate:dev && pnpm seed        # seed-brukere: alice/bob/charlie/superuser@example.com, passord password123
pnpm dev                              # i et eget vindu
BASE=http://localhost:5173 node docs/security/repro-server-function-authz.cjs
```

Skriptet trenger Playwright (`npm i -g playwright`, og `NODE_PATH=$(npm root -g)` hvis det er globalt installert). Det kjører 13 kall som anonym og som alice og skriver `VULNERABLE` eller `DENIED` per kall. Slutt med `pnpm seed` for å tilbakestille data. Seed fjerner ikke organisasjoner du ikke eier; slett `authz-test-org*` manuelt hvis de blir liggende.

**Før utbedring:** 13/13 `VULNERABLE`, exit 1. **Etter utbedring:** 13/13 `DENIED`, exit 0. Skriptet er akseptansetesten og skal kjøres på slutten.

Tolkning av kallene i skriptet (alice er MEMBER i org-2, ADMIN i org-1, ikke superbruker):

| Kall | Hva det viser |
|---|---|
| `anon createOrganization` | Uinnlogget kan opprette organisasjon |
| `alice createOrganization` | Vanlig bruker kan opprette organisasjon |
| `anon getAllOrganizations` | Uinnlogget får alle organisasjoner med medlemmer (id, brukernavn, e-post) |
| `alice updateMemberRole org-2 user-1 ADMIN` | Alice gjør seg selv til ADMIN |
| `alice removeMemberFromOrganization org-1 user-2` | Fjerner en annen bruker fra klubb |
| `alice addMemberToOrganization org-3 user-1 ADMIN` | Melder seg inn som ADMIN i klubb hun ikke tilhører |
| `anon getUserOrganizations user-1` | Leser en annen brukers medlemskap uten innlogging |
| `anon autoCreateUserProfile user-2` | Oppretter profil for en annen bruker |
| `alice updateUserProfile user-2` | Endrer en annens profil |
| `anon getPublicProfile user-2 user-2` | Gir seg ut for å være eieren og får hele profilen (e-post, skjulte felt) |
| `alice deleteUserProfile user-2` | Sletter en annens profil |
| `alice addPasswordToPasskeyAccount user-3 …` | Setter passord og e-post på en annens konto |
| `anon loginWithPassword (as victim)` | Logger inn som offeret: full kontoovertakelse |

## 4. Fullstendig oversikt over eksponerte funksjoner

Forklaring av ønsket policy:

- **PUBLIC**: skal være åpen (innlogging, registrering).
- **TOKEN**: autorisert av at kalleren kjenner en hemmelig token.
- **SESSION**: krever innlogget bruker.
- **SELF**: krever innlogget bruker som opptrer på egen data. Bruk `ctx.user.id`, aldri et argument.
- **SELF|SU**: eier eller superbruker.
- **SU**: kun `ctx.user.role === "SUPERUSER"`.
- **INTERNAL**: skal ikke være et endepunkt. Flytt ut av `"use server"`-filen.

«Verifisert» = vist i nettleser av `repro-server-function-authz.cjs`. «Kode» = funnet ved lesing av koden, ikke kjørt.

### 4.1 `src/app/pages/superuser/functions.ts` (ingen autorisasjon i noen funksjon)

| Linje | Funksjon | Kalles fra UI | Policy | Merknad | Funn |
|---|---|---|---|---|---|
| 8 | `createOrganization` | `CreateOrganizationDialog` | SU | | Verifisert |
| 23 | `updateOrganization` | – | SU | | Kode |
| 39 | `deleteOrganization` | `DeleteOrganizationDialog` | SU | Sletter organisasjonen og dens medlemskap | Kode |
| 85 | `getOrganization` | – | SU (eller medlem, uten e-post) | Returnerer medlemmers id, brukernavn, e-post | Kode |
| 116 | `getAllOrganizations` | – | SU | Samme data som over | Verifisert |
| 150 | `getOrganizationsForDisplay` | `Dashboard` | SU | | Kode |
| 177 | `addMemberToOrganization` | – (brukes av `acceptInvitation`) | INTERNAL | Gjør om til intern hjelper; SU-wrapper hvis UI trenger den | Verifisert |
| 209 | `updateMemberRole` | – | SU (senere: org-ADMIN, ikke seg selv) | | Verifisert |
| 231 | `removeMemberFromOrganization` | – | SU (senere: org-ADMIN) | | Verifisert |
| 251 | `createInvitation` | – | SU (senere: org-ADMIN) | `createdBy` tas fra klienten: bruk `ctx.user.id` | Kode |
| 309 | `getInvitationByToken` | – | TOKEN | Returner kun det invitasjonssiden trenger | Kode |
| 332 | `acceptInvitation` | – | SESSION | `userId` fra klienten: bruk `ctx.user.id`. Krev at invitasjonens e-post = brukerens e-post, status PENDING og ikke utløpt | Kode |
| 365 | `rejectInvitation` | – | TOKEN | | Kode |
| 388 | `getUserOrganizations` | – | SELF\|SU | `userId` fra klienten | Verifisert |

### 4.2 `src/app/pages/user/functions.ts`

| Linje | Funksjon | Kalles fra UI | Policy | Merknad | Funn |
|---|---|---|---|---|---|
| 30 | `startPasskeyRegistration` | `Signup`, `AuthSettings` | PUBLIC | Lagrer challenge i sesjon | Kode |
| 51 | `startPasskeyLogin` | `Login` | PUBLIC | | Kode |
| 66 | `finishPasskeyRegistration` | `Signup` | PUBLIC | Oppretter konto | Kode |
| 139 | `finishPasskeyLogin` | `Login` | PUBLIC | | Kode |
| 206 | `registerWithPassword` | `Signup` | PUBLIC | Trenger rate limiting (se 7) | Kode |
| 238 | `loginWithPassword` | `Login` | PUBLIC | Trenger rate limiting | Kode |
| 260 | `addPasskeyToExistingAccount` | `AuthSettings` | SELF | `userId` fra klienten: en angriper kan registrere sin egen autentikator på en annens konto. Bruk `ctx.user.id` | Kode |
| 319 | `addPasswordToPasskeyAccount` | `AuthSettings` | SELF | `userId` fra klienten: **kontoovertakelse**. Bruk `ctx.user.id`, krev at kontoen ikke allerede har passord (ellers re-autentisering), og sjekk at e-posten ikke brukes av en annen konto | Verifisert |
| 334 | `removePasskey` | `AuthSettings` | SELF | **Fungerer riktig** og er mønsteret. Vurder å hindre fjerning av siste innloggingsmetode | OK |
| 359 | `requestPasswordReset` | `ForgotPassword` | PUBLIC | Rate limiting | Kode |
| 415 | `verifyResetToken` | `ResetPassword` | TOKEN | Returnerer hele brukerraden **inkludert passordhash**. Returner kun det siden trenger (f.eks. brukernavn) | Kode |
| 427 | `resetPassword` | `ResetPassword` | TOKEN | Token slettes etter bruk (OK) | OK |

### 4.3 `src/app/pages/user/profile/functions.ts`

| Linje | Funksjon | Kalles fra UI | Policy | Merknad | Funn |
|---|---|---|---|---|---|
| 31 | `getUserProfile` | – (intern) | INTERNAL | Returnerer e-post uavhengig av personvern | Kode |
| 74 | `createUserProfile` | `ProfileSetup` | SELF | | Kode |
| 105 | `updateUserProfile` | `ProfileEditForm` | SELF\|SU | | Verifisert |
| 141 | `updateProfilePicture` | – | SELF\|SU | Ubrukt: fjern eller beskytt | Kode |
| 156 | `deleteUserProfile` | – | SELF\|SU | Ubrukt: fjern eller beskytt | Verifisert |
| 169 | `hasUserProfile` | – (intern) | INTERNAL | | Kode |
| 183 | `autoCreateUserProfile` | – (intern) | INTERNAL | Brukes fra registrering på server | Verifisert |
| 246 | `getOrCreateUserProfile` | `ProfilePage`, `ProfileEditPage` | SELF (skriving) | Skriveveien må være på egen bruker. Visning går via `getPublicProfile` | Kode |
| 262 | `getPublicProfile` | `ProfileView` | SESSION | `viewerId` fra klienten: bruk innlogget bruker. Må aldri la klienten velge visning | Verifisert |

### 4.4 `src/app/pages/admin/functions.ts`

| Linje | Funksjon | Policy | Merknad |
|---|---|---|---|
| 7 | `placeholder` | – | Ufarlig i dag. Når org-admin-funksjoner skrives skal de bruke `requireOrganizationRole`. Rutene i `admin/routes.tsx` peker på filer som ikke finnes |

## 5. Foreslått løsning

### 5.1 Guards (ny fil `src/app/auth/guards.ts`)

Hent bruker fra `requestInfo.ctx.user` (satt av middleware i `worker.tsx`) og kast ved avvik. `removePasskey` viser mønsteret.

```ts
requireUser(): User                                   // kaster "Unauthorized" hvis ikke innlogget
requireSuperUser(): User                              // kaster "Forbidden" hvis role !== "SUPERUSER"
requireSelfOrSuperUser(userId: string): User          // egen id eller SUPERUSER
requireOrganizationRole(orgId: string, roles: string[]): Promise<User>  // SUPERUSER passerer alltid
```

Bruk `roleHierarchy` i `src/app/shared/constants.ts` for roller (ADMIN inkluderer COACH inkluderer MEMBER). Gjenbruk oppslaget i `interceptors.ts` (`checkOrganizationRole`) og la `interceptors.ts` bruke de samme guards, slik at det bare finnes én implementasjon. `superuser/routes.tsx` har en egen kopi av `isSuperUser` som bør fjernes.

Kast feil (ikke returner `false`) ved avvist tilgang, slik at UI ikke kan forveksle «avvist» med «finnes ikke». Eksisterende funksjoner returnerer i dag `null`/`false` ved feil, så sjekk hvordan UI håndterer det.

### 5.2 Retningslinjer

1. Første linje i hver eksponert funksjon er en guard (eller en kommentar `// PUBLIC: <begrunnelse>`).
2. Aldri `userId`, `viewerId` eller `createdBy` som argument for «meg». Bruk `ctx.user.id`. Fjern parameteren og oppdater kallerne (`AuthSettings`, `ProfileEditForm`, `ProfileSetup`, `ProfileView`, `ProfilePage`, `ProfileEditPage`).
3. Flytt `INTERNAL`-funksjoner ut av `"use server"`-filer til vanlige moduler (f.eks. `src/app/lib/profiles.ts`, `src/app/lib/organizations.ts`). Færre endepunkter betyr mindre flate å sikre. Kall dem fra de beskyttede funksjonene.
4. Valider input med zod der det mangler (lengder, roller må være en av ADMIN/COACH/MEMBER, e-postformat).
5. Ikke returner mer enn UI trenger (ikke hele `User`-rader, ikke e-post til andre, aldri `password`).

### 5.3 Tester

Følg `src/app/pages/user/__tests__/passwordReset.test.ts`: kjør den **ekte** funksjonen, mock bare `@/db` og `requestInfo`. De eksisterende testene i `serverFunctions.test.tsx` mocker selve funksjonene og fanger derfor ikke dette.

For hver funksjon som ikke er `PUBLIC`:

- uten bruker avvises den
- vanlig bruker på en annens data avvises
- riktig bruker eller `SUPERUSER` lykkes

I tillegg en **sikkerhetsnett-test** som leser alle `"use server"`-filer og feiler hvis en eksportert funksjon verken kaller en guard eller står på en eksplisitt tillatt-liste (PUBLIC/TOKEN) med begrunnelse. Da kan ingen senere legge til en åpen funksjon ved et uhell.

### 5.4 Akseptkriterier

- [ ] `repro-server-function-authz.cjs` viser 13/13 `DENIED` og exit 0
- [ ] Alle funksjonene i §4 har policy som tabellen, og INTERNAL-funksjoner er ikke lenger eksportert fra `"use server"`-filer
- [ ] Ingen eksponert funksjon tar `userId`/`viewerId`/`createdBy` for «meg» fra klienten
- [ ] `verifyResetToken` og andre funksjoner returnerer ikke passordhash eller andres e-post
- [ ] Sikkerhetsnett-testen finnes og består
- [ ] Eksisterende 108 tester består, `pnpm types` har ikke flere feil enn før (30 eksisterende), `pnpm build` OK
- [ ] Manuell røyktest i nettleser som anonym, MEMBER, COACH og SUPERUSER: innlogging (passord og passkey), registrering, profilredigering, legge til/fjerne passkey, passord-reset, superuser-dashboard (opprette/slette organisasjon)
- [ ] `docs/architecture.md` (autorisasjon), `docs/progress.md` og `tasks/tasks.json` oppdatert

## 6. Etter utbedring: drift

Hvis denne koden har kjørt i produksjon, anta at noen kan ha utnyttet den:

1. **Sjekk databasen** (Cloudflare D1) for uventede endringer. Eksempler:
   ```sql
   -- Organisasjoner du ikke kjenner igjen
   SELECT id, name, createdAt FROM Organization ORDER BY createdAt DESC;
   -- Nye eller uventede medlemskap og roller
   SELECT * FROM OrganizationMembership ORDER BY joinedAt DESC LIMIT 50;
   -- Passkeys lagt til nylig (sammenlign med brukernes egne enheter)
   SELECT userId, deviceName, createdAt FROM Credential ORDER BY createdAt DESC LIMIT 50;
   -- Kontoer som har fått passord/e-post satt nylig
   SELECT id, username, email, updatedAt FROM User ORDER BY updatedAt DESC LIMIT 50;
   ```
   Sjekk skjemaet for eksakte kolonnenavn før du kjører dem.
2. Hvis noe ser mistenkelig ut: tilbakestill passord/passkeys for berørte brukere, fjern ukjente organisasjoner og medlemskap, og vurder å ugyldiggjøre alle sesjoner (Durable Object-sesjonene).
3. Cloudflare Workers Logs er ikke slått på (`observability.enabled = false`, oppgave 27), så det finnes trolig ingen logg å sjekke. Slå på logging som del av utbedringen.

## 7. Relaterte funn (egen oppfølging, ikke blokkerende)

- **Rate limiting** mangler på `loginWithPassword`, `registerWithPassword` og `requestPasswordReset` (passordgjetting, spam av reset-e-poster). Cloudflare Rate Limiting eller Turnstile (CSP tillater allerede `challenges.cloudflare.com`).
- **Passordhash** i `verifyResetToken` (se §4.2).
- **Brukeroppregning:** ikke undersøkt om `registerWithPassword` og passkey-registrering avslører om e-post/brukernavn allerede finnes. `requestPasswordReset` er riktig anonymisert.
- **Sesjoner:** vurder å rotere sesjon etter passord-/passkey-endringer.

## 8. Hva som ikke er verifisert

- At produksjon kjører denne koden, og om noen har utnyttet den.
- At feilene også fantes før rwsdk-oppgraderingen (koden er uendret, så det er sannsynlig).
- Funn merket «Kode» i §4 er funnet ved lesing, ikke kjørt.
- Om bruker-ID-er også kan hentes via andre veier enn de åpne organisasjonsfunksjonene (profilsider legger bruker-ID i props til klientkomponenter).
