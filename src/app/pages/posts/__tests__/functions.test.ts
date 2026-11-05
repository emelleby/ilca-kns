import { describe, it, expect, vi, beforeEach } from 'vitest'

// Runs the REAL post server functions; only db and requestInfo are mocked.
const h = vi.hoisted(() => ({
  ctx: { user: null as any },
  memberships: {} as Record<string, { organizationId: string; role: string }[]>,
  posts: {} as Record<string, { id: string; userId: string; organizationId: string | null; status: string }>,
  db: {
    post: {
      findUnique: vi.fn(),
      create: vi.fn(async (a: any) => ({ id: 'new-post', ...a.data })),
      update: vi.fn(async (a: any) => ({ id: a.where.id, ...a.data })),
    },
    organizationMembership: { findMany: vi.fn() },
  },
}))
vi.mock('rwsdk/worker', () => ({
  requestInfo: {
    get ctx() {
      return h.ctx
    },
  },
}))
vi.mock('@/db', () => ({ db: h.db }))

import { archivePost, createPost, updatePost } from '../functions'

const ORG = 'org-1'
const OTHER_ORG = 'org-2'
const users = {
  author: { id: 'author', role: 'USER', memberships: [{ organizationId: ORG, role: 'MEMBER' }] },
  member: { id: 'member', role: 'USER', memberships: [{ organizationId: ORG, role: 'MEMBER' }] },
  coach: { id: 'coach', role: 'USER', memberships: [{ organizationId: ORG, role: 'COACH' }] },
  admin: { id: 'admin', role: 'USER', memberships: [{ organizationId: ORG, role: 'ADMIN' }] },
  outsider: { id: 'outsider', role: 'USER', memberships: [{ organizationId: OTHER_ORG, role: 'ADMIN' }] },
  superuser: { id: 'su', role: 'SUPERUSER', memberships: [] },
}
type Who = keyof typeof users | 'anonymous'

function signIn(who: Who) {
  if (who === 'anonymous') {
    h.ctx.user = null
    return
  }
  const { memberships, ...user } = users[who]
  h.ctx.user = user
  h.memberships[user.id] = memberships
}

const fields = {
  title: 'Trening lørdag',
  content: 'Vi seiler fra 10 til 14.',
  category: 'Training' as const,
  visibility: 'ORGANIZATION' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  h.ctx.user = null
  h.memberships = {}
  h.posts = { p1: { id: 'p1', userId: 'author', organizationId: ORG, status: 'PUBLISHED' } }
  h.db.organizationMembership.findMany.mockImplementation(async (a: any) => h.memberships[a.where.userId] ?? [])
  h.db.post.findUnique.mockImplementation(async (a: any) => h.posts[a.where.id] ?? null)
})

describe('createPost', () => {
  it.each<[Who, string]>([
    ['anonymous', 'Unauthorized'],
    ['outsider', 'Forbidden'],
    ['superuser', 'Forbidden'],
  ])('%s is denied (%s)', async (who, message) => {
    signIn(who)
    await expect(createPost({ ...fields, organizationId: ORG })).rejects.toThrow(message)
    expect(h.db.post.create).not.toHaveBeenCalled()
  })

  it.each<Who>(['member', 'coach', 'admin'])('%s can create in their organization', async (who) => {
    signIn(who)
    await expect(createPost({ ...fields, organizationId: ORG })).resolves.toEqual({ id: 'new-post' })
  })

  it('stores a published post owned by the signed-in user', async () => {
    signIn('member')
    await createPost({ ...fields, organizationId: ORG, imageUrl: '' })
    const { data } = h.db.post.create.mock.calls[0][0]
    expect(data).toMatchObject({
      ...fields,
      organizationId: ORG,
      userId: 'member',
      status: 'PUBLISHED',
      imageUrl: null,
    })
    expect(data.publishedAt).toBeInstanceOf(Date)
  })

  it('rejects attempts to set the author or status', async () => {
    signIn('member')
    await expect(
      createPost({ ...fields, organizationId: ORG, userId: 'admin' } as any),
    ).rejects.toThrow()
    await expect(
      createPost({ ...fields, organizationId: ORG, status: 'DRAFT' } as any),
    ).rejects.toThrow()
    expect(h.db.post.create).not.toHaveBeenCalled()
  })

  it.each([
    ['title too short', { title: 'ab' }],
    ['title too long', { title: 'x'.repeat(121) }],
    ['title only spaces', { title: '     ' }],
    ['empty content', { content: '' }],
    ['content too long', { content: 'x'.repeat(10001) }],
    ['unknown category', { category: 'Gossip' }],
    ['unknown visibility', { visibility: 'SECRET' }],
    ['invalid image URL', { imageUrl: 'not a url' }],
    ['javascript: image URL', { imageUrl: 'javascript:alert(1)' }],
    ['missing organization', { organizationId: '' }],
  ])('rejects %s', async (_label, over) => {
    signIn('member')
    await expect(createPost({ ...fields, organizationId: ORG, ...over } as any)).rejects.toThrow()
    expect(h.db.post.create).not.toHaveBeenCalled()
  })

  it('trims title and content and keeps a valid image URL', async () => {
    signIn('member')
    await createPost({
      ...fields,
      title: '  Regatta  ',
      content: ' Tekst ',
      imageUrl: 'https://example.com/a.jpg',
      organizationId: ORG,
    })
    expect(h.db.post.create.mock.calls[0][0].data).toMatchObject({
      title: 'Regatta',
      content: 'Tekst',
      imageUrl: 'https://example.com/a.jpg',
    })
  })
})

describe('updatePost and archivePost: author or ADMIN of the post organization', () => {
  const allowed: Who[] = ['author', 'admin']
  const denied: [Who, string][] = [
    ['anonymous', 'Unauthorized'],
    ['member', 'Forbidden'],
    ['coach', 'Forbidden'],
    ['outsider', 'Forbidden'],
    ['superuser', 'Forbidden'],
  ]

  it.each(allowed)('%s can update', async (who) => {
    signIn(who)
    await expect(updatePost('p1', { ...fields, visibility: 'PUBLIC' })).resolves.toEqual({ id: 'p1' })
    expect(h.db.post.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { ...fields, visibility: 'PUBLIC', imageUrl: null },
    })
  })

  it.each(allowed)('%s can archive', async (who) => {
    signIn(who)
    await expect(archivePost('p1')).resolves.toEqual({ id: 'p1' })
    expect(h.db.post.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { status: 'ARCHIVED' } })
  })

  it.each(denied)('%s cannot update (%s)', async (who, message) => {
    signIn(who)
    await expect(updatePost('p1', fields)).rejects.toThrow(message)
    expect(h.db.post.update).not.toHaveBeenCalled()
  })

  it.each(denied)('%s cannot archive (%s)', async (who, message) => {
    signIn(who)
    await expect(archivePost('p1')).rejects.toThrow(message)
    expect(h.db.post.update).not.toHaveBeenCalled()
  })

  it('a missing post looks the same as a forbidden one', async () => {
    signIn('admin')
    await expect(updatePost('nope', fields)).rejects.toThrow('Forbidden')
    await expect(archivePost('nope')).rejects.toThrow('Forbidden')
  })

  it('the organization cannot be changed', async () => {
    signIn('author')
    await expect(updatePost('p1', { ...fields, organizationId: OTHER_ORG } as any)).rejects.toThrow()
    expect(h.db.post.update).not.toHaveBeenCalled()
  })

  it('an ADMIN cannot edit posts of another organization', async () => {
    h.posts.p2 = { id: 'p2', userId: 'someone', organizationId: OTHER_ORG, status: 'PUBLISHED' }
    signIn('admin')
    await expect(updatePost('p2', fields)).rejects.toThrow('Forbidden')
  })

  it('archived posts cannot be edited, and archiving twice is a no-op', async () => {
    h.posts.p1.status = 'ARCHIVED'
    signIn('author')
    await expect(updatePost('p1', fields)).rejects.toThrow(/archived/i)
    await expect(archivePost('p1')).resolves.toEqual({ id: 'p1' })
    expect(h.db.post.update).not.toHaveBeenCalled()
  })

  it('validates input on update', async () => {
    signIn('author')
    await expect(updatePost('p1', { ...fields, title: '' })).rejects.toThrow()
    await expect(updatePost('', fields)).rejects.toThrow()
    expect(h.db.post.update).not.toHaveBeenCalled()
  })
})
