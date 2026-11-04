/**
 * Reproduction / acceptance check for docs/security/server-function-authorization.md
 *
 * LOCAL DEVELOPMENT ONLY. Run against `pnpm dev` with seeded data (`pnpm seed`).
 * It performs real writes (creates an organization, changes a role, sets a password
 * on a seeded account). Re-run `pnpm seed` afterwards to restore the seed data.
 * Never point this at a deployed site.
 *
 *   BASE=http://localhost:5173 node docs/security/repro-server-function-authz.cjs
 *
 * Needs Playwright (`npm i -g playwright` or run from a project that has it).
 * Output: one line per attempt. Before the fix many lines say VULNERABLE.
 * After the fix every line must say DENIED (exit code 0).
 *
 * A call counts as DENIED when it throws or returns a falsy value / null.
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:5173';
const SU = '/src/app/pages/superuser/functions.ts';
const US = '/src/app/pages/user/functions.ts';
const PR = '/src/app/pages/user/profile/functions.ts';

// who: 'anon' | 'alice' (alice = regular USER; MEMBER of org-2, ADMIN of org-1)
const ATTEMPTS = [
  // A. Organization functions: must be SUPERUSER only
  ['anon',  SU, 'createOrganization', ['authz-test-org', 'created without login']],
  ['alice', SU, 'createOrganization', ['authz-test-org-alice', 'created by a regular user']],
  ['anon',  SU, 'getAllOrganizations', []],                              // returns members incl. user ids (needed for the takeover below)
  ['alice', SU, 'updateMemberRole', ['org-2', 'user-1', 'ADMIN']],          // alice promotes herself in org-2
  ['alice', SU, 'removeMemberFromOrganization', ['org-1', 'user-2']],
  ['alice', SU, 'addMemberToOrganization', ['org-3', 'user-1', 'ADMIN']],   // alice joins org-3 as ADMIN
  ['anon',  SU, 'getUserOrganizations', ['user-1']],
  // B. Profiles: only the owner (or SUPERUSER) may write; privacy must not be bypassable
  ['anon',  PR, 'autoCreateUserProfile', ['user-2']],
  ['alice', PR, 'updateUserProfile', ['user-2', { bio: 'edited by someone else' }]],
  ['anon',  PR, 'getPublicProfile', ['user-2', 'user-2']],                  // viewerId spoofed = owner -> full profile
  ['alice', PR, 'deleteUserProfile', ['user-2']],
  // C. Accounts: no one may change another account's credentials
  ['alice', US, 'addPasswordToPasskeyAccount', ['user-3', 'takeover@example.com', 'attacker-pass-1']],
];

async function login(page, email, password) {
  await page.goto(BASE + '/user/login', { waitUntil: 'networkidle' });
  const pw = page.getByRole('button', { name: /email and password/i });
  if (await pw.count()) await pw.first().click();
  await page.fill('input[type=email], #email', email);
  await page.fill('#password', password);
  await page.locator('button[type=submit]').last().click();
  await page.waitForTimeout(3000);
}
const call = (page, mod, fn, args) =>
  page.evaluate(async ([m, f, a]) => {
    try { const r = await (await import(m))[f](...a); return { threw: false, value: r === undefined ? null : r }; }
    catch (e) { return { threw: true, error: String(e).slice(0, 100) }; }
  }, [mod, fn, args]);

(async () => {
  const browser = await chromium.launch();
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(BASE + '/user/login', { waitUntil: 'networkidle' }); await anon.waitForTimeout(1500);
  const alice = await (await browser.newContext()).newPage();
  await login(alice, 'alice@example.com', 'password123');
  await alice.goto(BASE + '/home', { waitUntil: 'networkidle' });
  const pages = { anon, alice };

  let vulnerable = 0;
  for (const [who, mod, fn, args] of ATTEMPTS) {
    const r = await call(pages[who], mod, fn, args);
    const denied = r.threw || !r.value;
    if (!denied) vulnerable++;
    const shown = r.threw ? 'threw: ' + r.error : JSON.stringify(r.value).slice(0, 60);
    console.log((denied ? 'DENIED    ' : 'VULNERABLE') + '  ' + who.padEnd(5) + '  ' + fn.padEnd(30) + shown);
  }

  // Follow-up for the account takeover: can the attacker now log in as user-3 with the new password?
  const t = await call(anon, US, 'loginWithPassword', ['takeover@example.com', 'attacker-pass-1']);
  const tookOver = !t.threw && !!t.value;
  if (tookOver) vulnerable++;
  console.log((tookOver ? 'VULNERABLE' : 'DENIED    ') + '  anon   loginWithPassword (as victim)'.padEnd(37) + (t.threw ? 'threw' : JSON.stringify(t.value).slice(0, 40)));

  console.log(vulnerable ? `\n${vulnerable} attempt(s) succeeded. Not fixed.` : '\nAll attempts denied.');
  await browser.close();
  process.exit(vulnerable ? 1 : 0);
})();
