import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  db: {
    post: { findMany: vi.fn(), findUnique: vi.fn() },
    organizationMembership: { findMany: vi.fn() },
  },
}))
vi.mock('@/db', () => ({ db: h.db }))

import { getEditablePost, getFeedPosts, getPostableOrganizations, getViewer } from '../posts'
import { visiblePostsWhere } from '../postVisibility'

describe('getViewer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null for visitors without querying', async () => {
    expect(await getViewer(null)).toBeNull()
    expect(await getViewer(undefined)).toBeNull()
    expect(h.db.organizationMembership.findMany).not.toHaveBeenCalled()
  })

  it('loads the memberships of a logged in user', async () => {
    h.db.organizationMembership.findMany.mockResolvedValue([{ organizationId: 'o1', role: 'COACH' }])
    expect(await getViewer('u1')).toEqual({ id: 'u1', memberships: [{ organizationId: 'o1', role: 'COACH' }] })
    expect(h.db.organizationMembership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    )
  })
})

describe('getFeedPosts', () => {
  beforeEach(() => vi.clearAllMocks())

  const row = (over: Record<string, unknown> = {}) => ({
    id: 'p1',
    title: 'T',
    content: 'C',
    category: null,
    imageUrl: null,
    publishedAt: new Date('2026-01-02T10:00:00Z'),
    createdAt: new Date('2026-01-01T10:00:00Z'),
    userId: 'author',
    organizationId: 'o1',
    user: { username: 'alice', profile: null },
    _count: { comments: 3 },
    ...over,
  })

  it('queries with the visibility filter of the viewer', async () => {
    h.db.post.findMany.mockResolvedValue([])
    const viewer = { id: 'u1', memberships: [{ organizationId: 'o1', role: 'MEMBER' }] }

    await getFeedPosts(viewer)

    expect(h.db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: visiblePostsWhere(viewer), take: 50 }),
    )
  })

  it('maps rows, falling back to username and createdAt', async () => {
    h.db.post.findMany.mockResolvedValue([
      row(),
      row({
        id: 'p2',
        publishedAt: null,
        category: 'News',
        imageUrl: '/a.jpg',
        user: { username: 'bob', profile: { name: 'Bob B', profilePicture: '/bob.png' } },
      }),
    ])

    const [a, b] = await getFeedPosts(null)

    expect(a).toMatchObject({ id: 'p1', comments: 3, kudos: 0, category: undefined, imageUrl: undefined })
    expect(a.user).toEqual({ name: 'alice', avatarUrl: '' })
    expect(a.publishedAt).toBe('2026-01-02T10:00:00.000Z')
    expect(b.publishedAt).toBe('2026-01-01T10:00:00.000Z')
    expect(b).toMatchObject({ category: 'News', imageUrl: '/a.jpg' })
    expect(b.user).toEqual({ name: 'Bob B', avatarUrl: '/bob.png' })
  })
})

describe('canEdit in the feed', () => {
  beforeEach(() => vi.clearAllMocks())
  const row = { id: 'p1', title: 'T', content: 'C', category: null, imageUrl: null, publishedAt: null,
    createdAt: new Date(), userId: 'author', organizationId: 'o1', user: { username: 'a', profile: null },
    _count: { comments: 0 } }

  it.each([
    ['visitor', null, false],
    ['author', { id: 'author', memberships: [] }, true],
    ['admin of the organization', { id: 'x', memberships: [{ organizationId: 'o1', role: 'ADMIN' }] }, true],
    ['member', { id: 'x', memberships: [{ organizationId: 'o1', role: 'MEMBER' }] }, false],
  ])('%s → %s', async (_l, viewer, expected) => {
    h.db.post.findMany.mockResolvedValue([row])
    const [post] = await getFeedPosts(viewer as any)
    expect(post.canEdit).toBe(expected)
  })
})

describe('getPostableOrganizations', () => {
  it('returns the organizations of the user memberships', async () => {
    h.db.organizationMembership.findMany.mockResolvedValue([{ organization: { id: 'o1', name: 'KNS' } }])
    expect(await getPostableOrganizations('u1')).toEqual([{ id: 'o1', name: 'KNS' }])
    expect(h.db.organizationMembership.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }))
  })
})

describe('getEditablePost', () => {
  beforeEach(() => vi.clearAllMocks())
  const stored = (over: Record<string, unknown> = {}) => ({
    id: 'p1', userId: 'author', organizationId: 'o1', title: 'T', content: 'C', category: 'News',
    visibility: 'ORGANIZATION', imageUrl: null, status: 'PUBLISHED',
    organization: { id: 'o1', name: 'KNS' }, ...over,
  })
  const author = { id: 'author', memberships: [] }
  const member = { id: 'm', memberships: [{ organizationId: 'o1', role: 'MEMBER' }] }

  it('returns form fields for the author', async () => {
    h.db.post.findUnique.mockResolvedValue(stored())
    expect(await getEditablePost('p1', author)).toEqual({
      id: 'p1', title: 'T', content: 'C', category: 'News', visibility: 'ORGANIZATION', imageUrl: '',
      organization: { id: 'o1', name: 'KNS' },
    })
  })

  it('returns null when missing, archived or not editable', async () => {
    h.db.post.findUnique.mockResolvedValue(null)
    expect(await getEditablePost('p1', author)).toBeNull()
    h.db.post.findUnique.mockResolvedValue(stored({ status: 'ARCHIVED' }))
    expect(await getEditablePost('p1', author)).toBeNull()
    h.db.post.findUnique.mockResolvedValue(stored())
    expect(await getEditablePost('p1', member)).toBeNull()
    expect(await getEditablePost('p1', null)).toBeNull()
  })
})
