import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  ctx: { user: null as any },
  db: { organizationMembership: { findFirst: vi.fn() } },
}))
vi.mock('rwsdk/worker', () => ({ requestInfo: { ctx: h.ctx } }))
vi.mock('@/db', () => ({ db: h.db }))

import {
  requireUser,
  requireSuperUser,
  requireSelfOrSuperUser,
  requireOrganizationRole,
  rolesAtLeast,
} from '../guards'

const alice = { id: 'u1', role: 'USER' }
const root = { id: 'su', role: 'SUPERUSER' }

describe('guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.ctx.user = null
  })

  it('requireUser rejects anonymous and returns the signed-in user', () => {
    expect(() => requireUser()).toThrow('Unauthorized')
    h.ctx.user = alice
    expect(requireUser()).toBe(alice)
  })

  it('requireSuperUser only accepts SUPERUSER', () => {
    expect(() => requireSuperUser()).toThrow('Unauthorized')
    h.ctx.user = alice
    expect(() => requireSuperUser()).toThrow('Forbidden')
    h.ctx.user = root
    expect(requireSuperUser()).toBe(root)
  })

  it('requireSelfOrSuperUser accepts the owner or SUPERUSER', () => {
    expect(() => requireSelfOrSuperUser('u1')).toThrow('Unauthorized')
    h.ctx.user = alice
    expect(requireSelfOrSuperUser('u1')).toBe(alice)
    expect(() => requireSelfOrSuperUser('u2')).toThrow('Forbidden')
    h.ctx.user = root
    expect(requireSelfOrSuperUser('u2')).toBe(root)
  })

  it('rolesAtLeast follows the role hierarchy', () => {
    expect(rolesAtLeast('ADMIN')).toEqual(['ADMIN'])
    expect(rolesAtLeast('COACH').sort()).toEqual(['ADMIN', 'COACH'])
    expect(rolesAtLeast('MEMBER').sort()).toEqual(['ADMIN', 'COACH', 'MEMBER'])
  })

  it('requireOrganizationRole checks membership; SUPERUSER always passes', async () => {
    await expect(requireOrganizationRole('org-1', 'ADMIN')).rejects.toThrow('Unauthorized')

    h.ctx.user = alice
    h.db.organizationMembership.findFirst.mockResolvedValue(null)
    await expect(requireOrganizationRole('org-1', 'COACH')).rejects.toThrow('Forbidden')
    expect(h.db.organizationMembership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'u1', organizationId: 'org-1', role: { in: ['ADMIN', 'COACH'] } },
      }),
    )

    h.db.organizationMembership.findFirst.mockResolvedValue({ id: 'm1' })
    await expect(requireOrganizationRole('org-1', 'COACH')).resolves.toBe(alice)

    h.ctx.user = root
    h.db.organizationMembership.findFirst.mockClear()
    await expect(requireOrganizationRole('org-1', 'ADMIN')).resolves.toBe(root)
    expect(h.db.organizationMembership.findFirst).not.toHaveBeenCalled()
  })
})
