import { describe, it, expect } from 'vitest'
import {
  canViewPost,
  visiblePostsWhere,
  POST_VISIBILITY as V,
  type PostAccessFields,
  type Viewer,
} from '../postVisibility'

const ORG = 'org-1'
const OTHER_ORG = 'org-2'

const post = (over: Partial<PostAccessFields> = {}): PostAccessFields => ({
  userId: 'author',
  organizationId: ORG,
  visibility: V.ORGANIZATION,
  status: 'PUBLISHED',
  ...over,
})

const viewer = (id: string, memberships: { organizationId: string; role: string }[] = []): Viewer => ({
  id,
  memberships,
})

const member = viewer('m', [{ organizationId: ORG, role: 'MEMBER' }])
const coach = viewer('c', [{ organizationId: ORG, role: 'COACH' }])
const admin = viewer('a', [{ organizationId: ORG, role: 'ADMIN' }])
const outsider = viewer('o', [{ organizationId: OTHER_ORG, role: 'ADMIN' }])
const noOrg = viewer('n')

describe('canViewPost', () => {
  describe('PUBLIC', () => {
    const p = post({ visibility: V.PUBLIC })
    it.each([
      ['anonymous', null],
      ['no organization', noOrg],
      ['outsider', outsider],
      ['member', member],
    ])('is visible to %s', (_n, v) => expect(canViewPost(p, v)).toBe(true))

    it('is visible even without an organization', () => {
      expect(canViewPost(post({ visibility: V.PUBLIC, organizationId: null }), null)).toBe(true)
    })
  })

  describe('ORGANIZATION', () => {
    const p = post({ visibility: V.ORGANIZATION })
    it.each([
      ['member', member, true],
      ['coach', coach, true],
      ['admin', admin, true],
      ['member of another organization', outsider, false],
      ['user without memberships', noOrg, false],
      ['anonymous', null, false],
    ])('%s -> %s', (_n, v, expected) => expect(canViewPost(p, v as Viewer)).toBe(expected))

    it('without organization is visible only to the author', () => {
      const orphan = post({ organizationId: null })
      expect(canViewPost(orphan, member)).toBe(false)
      expect(canViewPost(orphan, viewer('author'))).toBe(true)
    })
  })

  describe('COACH', () => {
    const p = post({ visibility: V.COACH })
    it.each([
      ['plain member', member, false],
      ['coach', coach, true],
      ['admin (includes coach role)', admin, true],
      ['coach of another organization', viewer('x', [{ organizationId: OTHER_ORG, role: 'COACH' }]), false],
      ['anonymous', null, false],
    ])('%s -> %s', (_n, v, expected) => expect(canViewPost(p, v as Viewer)).toBe(expected))

    it('is always visible to the author', () => {
      expect(canViewPost(p, viewer('author'))).toBe(true)
    })
  })

  describe('status', () => {
    it.each(['DRAFT', 'ARCHIVED'] as const)('%s is hidden from everyone except the author', (status) => {
      const p = post({ visibility: V.PUBLIC, status })
      expect(canViewPost(p, member)).toBe(false)
      expect(canViewPost(p, null)).toBe(false)
      expect(canViewPost(p, viewer('author'))).toBe(true)
    })
  })

  it('fails closed on unknown visibility', () => {
    expect(canViewPost(post({ visibility: 'SECRET' as never }), member)).toBe(false)
  })
})

describe('visiblePostsWhere', () => {
  it('anonymous: only published public posts', () => {
    expect(visiblePostsWhere(null)).toEqual({
      status: 'PUBLISHED',
      OR: [{ visibility: 'PUBLIC' }],
    })
  })

  it('user without memberships: public + own', () => {
    expect(visiblePostsWhere(noOrg)).toEqual({
      status: 'PUBLISHED',
      OR: [{ visibility: 'PUBLIC' }, { userId: 'n' }],
    })
  })

  it('member: adds organization posts for their organizations only', () => {
    const where = visiblePostsWhere(member)
    expect(where.OR).toContainEqual({ visibility: 'ORGANIZATION', organizationId: { in: [ORG] } })
    expect(where.OR).not.toContainEqual(expect.objectContaining({ visibility: 'COACH' }))
  })

  it('coach and admin: also COACH posts for the organizations where they hold that role', () => {
    for (const v of [coach, admin]) {
      expect(visiblePostsWhere(v).OR).toContainEqual({
        visibility: 'COACH',
        organizationId: { in: [ORG] },
      })
    }
  })

  it('mixed roles: coach rights only where the role is held', () => {
    const v = viewer('mix', [
      { organizationId: ORG, role: 'MEMBER' },
      { organizationId: OTHER_ORG, role: 'COACH' },
    ])
    const where = visiblePostsWhere(v)
    expect(where.OR).toContainEqual({ visibility: 'ORGANIZATION', organizationId: { in: [ORG, OTHER_ORG] } })
    expect(where.OR).toContainEqual({ visibility: 'COACH', organizationId: { in: [OTHER_ORG] } })
  })

  it('never exposes unpublished posts in the feed', () => {
    expect(visiblePostsWhere(admin).status).toBe('PUBLISHED')
  })
})

// Guards against the single-post check and the database filter drifting apart.
describe('canViewPost agrees with visiblePostsWhere', () => {
  type Clause = { visibility?: string; userId?: string; organizationId?: { in: string[] } }
  const matches = (p: PostAccessFields, c: Clause) =>
    (c.visibility === undefined || c.visibility === p.visibility) &&
    (c.userId === undefined || c.userId === p.userId) &&
    (c.organizationId === undefined ||
      (p.organizationId !== null && c.organizationId.in.includes(p.organizationId)))
  const evaluate = (p: PostAccessFields, v: Viewer) => {
    const where = visiblePostsWhere(v)
    return p.status === where.status && (where.OR as Clause[]).some((c) => matches(p, c))
  }

  const viewers: Viewer[] = [null, noOrg, member, coach, admin, outsider, viewer('author')]
  const posts: PostAccessFields[] = []
  for (const visibility of Object.values(V))
    for (const organizationId of [ORG, OTHER_ORG, null])
      for (const userId of ['author', 'someone'])
        posts.push({ userId, organizationId, visibility, status: 'PUBLISHED' })

  it.each(viewers.map((v, i) => [i, v] as const))('viewer #%s sees the same posts either way', (_i, v) => {
    for (const p of posts) {
      // Own non-published posts are intentionally outside the feed filter
      expect(evaluate(p, v), JSON.stringify(p)).toBe(canViewPost(p, v))
    }
  })
})
