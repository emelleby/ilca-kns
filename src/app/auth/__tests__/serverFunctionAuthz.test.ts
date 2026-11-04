import { describe, it, expect, vi, beforeEach } from 'vitest'

// Runs the REAL server functions with a mocked db and requestInfo, mirroring the
// attacks in docs/security/repro-server-function-authz.cjs.
const h = vi.hoisted(() => {
  const model = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(async () => []),
    create: vi.fn(async (a: any) => ({ id: 'new', ...a.data })),
    update: vi.fn(async (a: any) => ({ id: 'x', ...a.data })),
    updateMany: vi.fn(async () => ({ count: 1 })),
    delete: vi.fn(async () => ({})),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  })
  return {
    ctx: { user: null as any },
    db: {
      user: model(),
      profile: model(),
      organization: model(),
      organizationMembership: model(),
      organizationInvitation: model(),
      passwordReset: model(),
      credential: model(),
    },
  }
})
vi.mock('rwsdk/worker', () => ({
  requestInfo: {
    get ctx() {
      return h.ctx
    },
    request: new Request('http://localhost:5173/'),
    response: { headers: new Headers() },
  },
}))
vi.mock('rwsdk/constants', () => ({ IS_DEV: true }))
vi.mock('@/db', () => ({ db: h.db }))
vi.mock('@/session/store', () => ({
  sessions: { load: vi.fn(async () => ({ challenge: 'c' })), save: vi.fn() },
}))
vi.mock('@/app/auth/password', () => ({
  hashPassword: vi.fn(async (p: string) => `hash:${p}`),
  verifyPassword: vi.fn(() => true),
}))
vi.mock('@/app/auth/email', () => ({ sendEmail: vi.fn(), generatePasswordResetEmail: vi.fn() }))

import * as su from '@/app/pages/superuser/functions'
import * as profile from '@/app/pages/user/profile/functions'
import * as user from '@/app/pages/user/functions'

const alice = { id: 'user-1', role: 'USER', email: 'alice@example.com' }
const root = { id: 'superuser-1', role: 'SUPERUSER', email: 'su@example.com' }
const signIn = (u: any) => (h.ctx.user = u)

const storedProfile = {
  id: 'p2',
  userId: 'user-2',
  name: 'Bob',
  location: 'Oslo',
  experienceLevel: 'expert',
  sailingExperience: '10',
  clubAffiliation: 'KNS',
  certifications: '["x"]',
  boatInformation: '{"boatName":"Secret"}',
  privacySettings: '{"showEmail":false,"showLocation":false,"showExperience":false,"showBoatInfo":false}',
  user: { id: 'user-2', username: 'bob', email: 'bob@example.com', role: 'USER', createdAt: new Date() },
}

beforeEach(() => {
  vi.clearAllMocks()
  h.ctx.user = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('superuser functions: SUPERUSER only', () => {
  const calls: [string, () => Promise<unknown>][] = [
    ['createOrganization', () => su.createOrganization('x')],
    ['updateOrganization', () => su.updateOrganization('org-1', { name: 'y' })],
    ['deleteOrganization', () => su.deleteOrganization('org-1')],
    ['getOrganization', () => su.getOrganization('org-1')],
    ['getAllOrganizations', () => su.getAllOrganizations()],
    ['getOrganizationsForDisplay', () => su.getOrganizationsForDisplay()],
    ['addMemberToOrganization', () => su.addMemberToOrganization('org-3', 'user-1', 'ADMIN')],
    ['updateMemberRole', () => su.updateMemberRole('org-2', 'user-1', 'ADMIN')],
    ['removeMemberFromOrganization', () => su.removeMemberFromOrganization('org-1', 'user-2')],
    ['createInvitation', () => su.createInvitation('org-1', 'x@example.com', 'MEMBER')],
  ]

  it.each(calls)('%s rejects anonymous and regular users, touches no data', async (_n, call) => {
    await expect(call()).rejects.toThrow('Unauthorized')
    signIn(alice)
    await expect(call()).rejects.toThrow('Forbidden')
    for (const m of Object.values(h.db)) {
      for (const fn of ['create', 'update', 'updateMany', 'delete', 'deleteMany']) {
        expect((m as any)[fn]).not.toHaveBeenCalled()
      }
    }
  })

  it('SUPERUSER can create organizations and invitations (createdBy from session)', async () => {
    signIn(root)
    await expect(su.createOrganization('Club', 'desc')).resolves.toMatchObject({ name: 'Club' })
    h.db.user.findUnique.mockResolvedValue(null)
    h.db.organizationInvitation.findFirst.mockResolvedValue(null)
    await su.createInvitation('org-1', 'new@example.com', 'COACH')
    expect(h.db.organizationInvitation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ createdBy: 'superuser-1', role: 'COACH' }) }),
    )
  })

  it('rejects invalid roles even for SUPERUSER', async () => {
    signIn(root)
    await expect(su.updateMemberRole('org-1', 'user-1', 'SUPERUSER')).rejects.toThrow()
    expect(h.db.organizationMembership.updateMany).not.toHaveBeenCalled()
  })

  it('getUserOrganizations: self or SUPERUSER only', async () => {
    await expect(su.getUserOrganizations('user-1')).rejects.toThrow('Unauthorized')
    signIn(alice)
    await expect(su.getUserOrganizations('user-2')).rejects.toThrow('Forbidden')
    await expect(su.getUserOrganizations('user-1')).resolves.toEqual([])
  })
})

describe('invitations', () => {
  const invitation = {
    id: 'inv-1',
    email: 'alice@example.com',
    organizationId: 'org-3',
    role: 'MEMBER',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 86400000),
    organization: { id: 'org-3', name: 'Club 3' },
  }

  it('getInvitationByToken returns only limited fields', async () => {
    h.db.organizationInvitation.findUnique.mockResolvedValue(invitation)
    const result = await su.getInvitationByToken('tok')
    expect(result).toEqual({
      organizationName: 'Club 3',
      email: 'alice@example.com',
      role: 'MEMBER',
      expiresAt: invitation.expiresAt,
    })
  })

  it('acceptInvitation needs a session and a matching email; uses the session user', async () => {
    h.db.organizationInvitation.findUnique.mockResolvedValue(invitation)
    await expect(su.acceptInvitation('tok')).rejects.toThrow('Unauthorized')

    signIn({ ...alice, id: 'user-2', email: 'bob@example.com' })
    await expect(su.acceptInvitation('tok')).resolves.toBe(false)
    expect(h.db.organizationMembership.create).not.toHaveBeenCalled()

    signIn(alice)
    h.db.organizationMembership.findFirst.mockResolvedValue(null)
    await expect(su.acceptInvitation('tok')).resolves.toBe(true)
    expect(h.db.organizationMembership.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', organizationId: 'org-3', role: 'MEMBER' },
    })
  })
})

describe('profile functions', () => {
  it('internal helpers are not exported as endpoints', () => {
    for (const name of ['getUserProfile', 'hasUserProfile', 'autoCreateUserProfile', 'getOrCreateUserProfile', 'updateProfilePicture']) {
      expect((profile as any)[name]).toBeUndefined()
    }
  })

  it('updateUserProfile / deleteUserProfile: owner or SUPERUSER only', async () => {
    await expect(profile.updateUserProfile('user-2', { bio: 'x' })).rejects.toThrow('Unauthorized')
    signIn(alice)
    await expect(profile.updateUserProfile('user-2', { bio: 'x' })).rejects.toThrow('Forbidden')
    await expect(profile.deleteUserProfile('user-2')).rejects.toThrow('Forbidden')
    expect(h.db.profile.update).not.toHaveBeenCalled()
    expect(h.db.profile.delete).not.toHaveBeenCalled()

    await profile.updateUserProfile('user-1', { bio: 'mine' })
    expect(h.db.profile.update).toHaveBeenCalledWith({ where: { userId: 'user-1' }, data: { bio: 'mine' } })

    signIn(root)
    await expect(profile.deleteUserProfile('user-2')).resolves.toBe(true)
  })

  it('createUserProfile creates for the session user only', async () => {
    await expect(profile.createUserProfile({ name: 'x' })).rejects.toThrow('Unauthorized')
    signIn(alice)
    h.db.profile.findUnique.mockResolvedValue(null)
    await profile.createUserProfile({ name: 'Alice' })
    expect(h.db.profile.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1', name: 'Alice' }) }),
    )
  })

  it('getPublicProfile requires a session and applies privacy from the session, not arguments', async () => {
    h.db.profile.findUnique.mockResolvedValue(storedProfile)
    await expect((profile.getPublicProfile as any)('user-2', 'user-2')).rejects.toThrow('Unauthorized')

    signIn(alice)
    const seen: any = await (profile.getPublicProfile as any)('user-2', 'user-2')
    expect(seen.user.email).toBeNull()
    expect(seen.location).toBeNull()
    expect(seen.boatInformation).toEqual({})
    expect(seen.clubAffiliation).toBeNull()

    signIn({ ...alice, id: 'user-2' })
    const own: any = await profile.getPublicProfile('user-2')
    expect(own.user.email).toBe('bob@example.com')
    expect(own.location).toBe('Oslo')
  })
})

describe('account functions', () => {
  it('addPasswordToPasskeyAccount requires a session and only changes the own account', async () => {
    await expect(user.addPasswordToPasskeyAccount('takeover@example.com', 'attacker-pass-1')).rejects.toThrow('Unauthorized')
    expect(h.db.user.update).not.toHaveBeenCalled()

    signIn(alice)
    h.db.user.findUnique.mockResolvedValueOnce({ password: null }).mockResolvedValueOnce(null)
    await expect(user.addPasswordToPasskeyAccount('alice@example.com', 'long-enough')).resolves.toBe(true)
    expect(h.db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    )
  })

  it('addPasswordToPasskeyAccount refuses when a password exists or the email belongs to someone else', async () => {
    signIn(alice)
    h.db.user.findUnique.mockResolvedValueOnce({ password: 'hash' })
    await expect(user.addPasswordToPasskeyAccount('alice@example.com', 'long-enough')).resolves.toBe(false)

    h.db.user.findUnique.mockResolvedValueOnce({ password: null }).mockResolvedValueOnce({ id: 'user-2' })
    await expect(user.addPasswordToPasskeyAccount('bob@example.com', 'long-enough')).resolves.toBe(false)

    await expect(user.addPasswordToPasskeyAccount('alice@example.com', 'short')).resolves.toBe(false)
    expect(h.db.user.update).not.toHaveBeenCalled()
  })

  it('addPasskeyToExistingAccount requires a session', async () => {
    await expect(user.addPasskeyToExistingAccount({} as any)).rejects.toThrow('Unauthorized')
    expect(h.db.credential.create).not.toHaveBeenCalled()
  })

  it('verifyResetToken returns the username only (no password hash)', async () => {
    h.db.passwordReset.findFirst.mockResolvedValue({ user: { username: 'bob' } })
    await expect(user.verifyResetToken('tok')).resolves.toEqual({ username: 'bob' })
    expect(h.db.passwordReset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ include: { user: { select: { username: true } } } }),
    )
  })
})
