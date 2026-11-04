import { describe, it, expect, vi, beforeEach } from 'vitest'

// Real requestPasswordReset is under test; only its collaborators are mocked.
const h = vi.hoisted(() => ({
  isDev: true,
  env: { DEV_EMAIL_TO: undefined as string | undefined },
  sendEmail: vi.fn(),
  db: {
    user: { findUnique: vi.fn() },
    passwordReset: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('rwsdk/constants', () => ({
  get IS_DEV() {
    return h.isDev
  },
}))
vi.mock('cloudflare:workers', () => ({ env: h.env }))
vi.mock('@/db', () => ({ db: h.db }))
vi.mock('@/app/auth/email', () => ({
  sendEmail: h.sendEmail,
  generatePasswordResetEmail: vi.fn(() => '<html>reset</html>'),
}))
vi.mock('rwsdk/worker', () => ({
  requestInfo: {
    request: new Request('http://localhost:5173/user/forgot-password'),
    response: { headers: new Headers() },
    ctx: {},
  },
}))

import { requestPasswordReset } from '../functions'

const user = { id: 'u1', username: 'sailor', email: 'sailor@example.com' }

describe('requestPasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.isDev = true
    h.env.DEV_EMAIL_TO = undefined
    h.sendEmail.mockResolvedValue(true)
    h.db.passwordReset.findFirst.mockResolvedValue(null)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('returns true and sends nothing for an unknown email (no account enumeration)', async () => {
    h.db.user.findUnique.mockResolvedValue(null)

    await expect(requestPasswordReset('nobody@example.com')).resolves.toBe(true)

    expect(h.sendEmail).not.toHaveBeenCalled()
    expect(h.db.passwordReset.create).not.toHaveBeenCalled()
  })

  it('creates a token and emails the user at their own address', async () => {
    h.isDev = false
    h.db.user.findUnique.mockResolvedValue(user)

    await requestPasswordReset(user.email)

    expect(h.db.passwordReset.create).toHaveBeenCalledOnce()
    expect(h.sendEmail).toHaveBeenCalledWith(user.email, 'Password Reset Request', '<html>reset</html>')
  })

  it('updates an existing token instead of creating a second one', async () => {
    h.db.user.findUnique.mockResolvedValue(user)
    h.db.passwordReset.findFirst.mockResolvedValue({ id: 'r1' })

    await requestPasswordReset(user.email)

    expect(h.db.passwordReset.update).toHaveBeenCalledOnce()
    expect(h.db.passwordReset.create).not.toHaveBeenCalled()
  })

  it('redirects to DEV_EMAIL_TO in development only', async () => {
    h.db.user.findUnique.mockResolvedValue(user)
    h.env.DEV_EMAIL_TO = 'owner@example.com'

    await requestPasswordReset(user.email)
    expect(h.sendEmail.mock.calls[0][0]).toBe('owner@example.com')

    h.isDev = false
    await requestPasswordReset(user.email)
    expect(h.sendEmail.mock.calls[1][0]).toBe(user.email)
  })

  it('logs the reset link in development but not in production', async () => {
    h.db.user.findUnique.mockResolvedValue(user)

    await requestPasswordReset(user.email)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('/user/reset-password?token='))

    vi.mocked(console.log).mockClear()
    h.isDev = false
    await requestPasswordReset(user.email)
    expect(console.log).not.toHaveBeenCalled()
  })

  it('does not throw when the email provider fails', async () => {
    h.db.user.findUnique.mockResolvedValue(user)
    h.sendEmail.mockResolvedValue(false)

    await expect(requestPasswordReset(user.email)).resolves.toBe(true)
    expect(console.error).toHaveBeenCalled()
  })
})
