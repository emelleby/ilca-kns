import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import path from 'path'

// Safety net: every function exported from a "use server" file is a browser-callable
// endpoint. Each one must call a guard from src/app/auth/guards.ts, or be listed here
// with a reason. See docs/security/server-function-authorization.md.
const ALLOWED_WITHOUT_GUARD: Record<string, string> = {
  'pages/user/functions.ts#startPasskeyRegistration': 'PUBLIC: sign-up; only stores a challenge in the session',
  'pages/user/functions.ts#startPasskeyLogin': 'PUBLIC: sign-in',
  'pages/user/functions.ts#finishPasskeyRegistration': 'PUBLIC: sign-up',
  'pages/user/functions.ts#finishPasskeyLogin': 'PUBLIC: sign-in',
  'pages/user/functions.ts#registerWithPassword': 'PUBLIC: sign-up',
  'pages/user/functions.ts#loginWithPassword': 'PUBLIC: sign-in',
  'pages/user/functions.ts#requestPasswordReset': 'PUBLIC: forgot password, no account enumeration',
  'pages/user/functions.ts#verifyResetToken': 'TOKEN: reset token, returns username only',
  'pages/user/functions.ts#resetPassword': 'TOKEN: reset token',
  'pages/superuser/functions.ts#getInvitationByToken': 'TOKEN: invitation token, returns limited fields',
  'pages/superuser/functions.ts#rejectInvitation': 'TOKEN: invitation token',
  'pages/admin/functions.ts#placeholder': 'Returns null; no data access',
}

const GUARD = /\brequire(User|SuperUser|SelfOrSuperUser|OrganizationRole)\(/
const APP = path.resolve(__dirname, '../..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (name === '__tests__' || name === 'node_modules') return []
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

const useServerFiles = sourceFiles(APP).filter((file) =>
  /^\s*["']use server["']/.test(readFileSync(file, 'utf8')),
)

/** Exported functions with their bodies (up to the closing brace at column 0). */
function exportedFunctions(source: string) {
  const result: { name: string; body: string }[] = []
  const re = /^export\s+(?:async\s+)?function\s+(\w+)/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(source))) {
    const end = source.indexOf('\n}', m.index)
    result.push({ name: m[1], body: source.slice(m.index, end === -1 ? undefined : end) })
  }
  return result
}

describe('"use server" files', () => {
  it('finds the server function files', () => {
    expect(useServerFiles.length).toBeGreaterThanOrEqual(3)
  })

  it.each(useServerFiles.map((f) => [path.relative(APP, f), f]))(
    '%s: every exported function has a guard or is allow-listed',
    (rel, file) => {
      const source = readFileSync(file, 'utf8')

      // Only plain exported functions, so the check above cannot be bypassed with
      // `export const x = async () => …` or re-exports of other modules' values.
      expect(source).not.toMatch(/^export\s+(const|let|var|default|\{)/m)
      expect(source).not.toMatch(/^export\s+\*/m)

      const unguarded = exportedFunctions(source)
        .filter(({ name, body }) => !GUARD.test(body) && !ALLOWED_WITHOUT_GUARD[`${rel}#${name}`])
        .map(({ name }) => name)
      expect(unguarded).toEqual([])
    },
  )

  it('allow-list has no stale entries', () => {
    const existing = new Set(
      useServerFiles.flatMap((file) =>
        exportedFunctions(readFileSync(file, 'utf8')).map(({ name }) => `${path.relative(APP, file)}#${name}`),
      ),
    )
    expect(Object.keys(ALLOWED_WITHOUT_GUARD).filter((key) => !existing.has(key))).toEqual([])
  })
})
