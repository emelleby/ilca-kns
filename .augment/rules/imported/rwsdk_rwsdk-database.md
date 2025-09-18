---
type: "agent_requested"
---

# RedwoodSDK: Database operations and Prisma

You're an expert at Cloudflare D1, Prisma, TypeScript, and building web apps with RedwoodSDK. Generate high quality **database operations** that adhere to the following best practices:

## Guidelines

1. Use Prisma Client for database operations with the D1 adapter
2. Follow proper error handling patterns for database operations
3. Use transactions for operations that need to be atomic
4. Implement proper data validation before database operations
5. Structure database queries efficiently to minimize overhead
6. Centralize database client initialization in a single module

## Example Templates

### Database Client Setup

Create a centralized database client that can be imported throughout the application:

```tsx
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'
import { createD1Adapter } from '@prisma/adapter-d1'

let prisma: PrismaClient

export function getPrisma(env: Env) {
  if (!prisma) {
    prisma = new PrismaClient({
      adapter: createD1Adapter(env.DB)
    })
  }
  return prisma
}

// Alternative singleton pattern
export const db = {
  get client() {
    if (!globalThis.__prisma) {
      throw new Error('Prisma not initialized. Call initPrisma(env) first')
    }
    return globalThis.__prisma
  }
}

export function initPrisma(env: Env) {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      adapter: createD1Adapter(env.DB)
    })
  }
  return globalThis.__prisma
}
```

### Basic CRUD Operations

```tsx
import { route } from 'rwsdk/router'
import { getPrisma } from '../lib/db'

// Create
route('/api/users', async function handler({ request, env }) {
  try {
    const db = getPrisma(env)
    const userData = await request.json()
    
    // Validate user data
    if (!userData.email || !userData.name) {
      return Response.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }
    
    const user = await db.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        // Add other fields as needed
      }
    })
    
    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    
    // Handle unique constraint errors
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }
    
    return Response.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
})

// Read
route('/api/users/:id', async function handler({ params, env }) {
  try {
    const db = getPrisma(env)
    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        posts: true, // Include related data if needed
      }
    })
    
    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return Response.json(user)
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return Response.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
})

// Update
route('/api/users/:id', async function handler({ params, request, env }) {
  try {
    const db = getPrisma(env)
    const userData = await request.json()
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })
    
    if (!existingUser) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: userData
    })
    
    return Response.json(updatedUser)
  } catch (error) {
    console.error('Failed to update user:', error)
    return Response.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}, { method: 'PUT' })

// Delete
route('/api/users/:id', async function handler({ params, env }) {
  try {
    const db = getPrisma(env)
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })
    
    if (!existingUser) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    await db.user.delete({
      where: { id: params.id }
    })
    
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return Response.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}, { method: 'DELETE' })
```

### Using Transactions

```tsx
import { route } from 'rwsdk/router'
import { getPrisma } from '../lib/db'

route('/api/posts', async function handler({ request, env }) {
  const db = getPrisma(env)
  const { title, content, authorId, tags } = await request.json()
  
  try {
    // Use transaction to ensure all operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      // Create the post
      const post = await tx.post.create({
        data: {
          title,
          content,
          author: {
            connect: { id: authorId }
          }
        }
      })
      
      // Create tags and connect them to the post
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // Find or create tag
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName }
          })
          
          // Connect tag to post
          await tx.postTag.create({
            data: {
              postId: post.id,
              tagId: tag.id
            }
          })
        }
      }
      
      // Return the created post with its tags
      return await tx.post.findUnique({
        where: { id: post.id },
        include: {
          author: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      })
    })
    
    return Response.json(result, { status: 201 })
  } catch (error) {
    console.error('Transaction failed:', error)
    return Response.json(
      { error: 'Failed to create post with tags' },
      { status: 500 }
    )
  }
})
```

### Pagination and Filtering

```tsx
import { route } from 'rwsdk/router'
import { getPrisma } from '../lib/db'

route('/api/posts', async function handler({ request, env }) {
  try {
    const db = getPrisma(env)
    const url = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Parse filtering parameters
    const authorId = url.searchParams.get('authorId')
    const tag = url.searchParams.get('tag')
    const search = url.searchParams.get('search')
    
    // Build where clause
    const where = {}
    
    if (authorId) {
      where.authorId = authorId
    }
    
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag
          }
        }
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ]
    }
    
    // Execute query with pagination
    const [posts, totalCount] = await Promise.all([
      db.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      }),
      db.post.count({ where })
    ])
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return Response.json({
      data: posts,
      meta: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return Response.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
})
```

### Schema Definition Best Practices

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  output          = "../node_modules/.prisma/client"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String?  // Hashed password if using password auth
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
  comments  Comment[]

  @@index([email])
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]
  tags      PostTag[]

  @@index([authorId])
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@index([authorId])
}

model Tag {
  id    String    @id @default(uuid())
  name  String    @unique
  posts PostTag[]
}

model PostTag {
  postId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tagId  String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@index([postId])
  @@index([tagId])
}
```

### Migration Management

```tsx
// Example of running migrations programmatically
import { route } from 'rwsdk/router'
import { execSync } from 'child_process'

route('/api/admin/migrate', async function handler({ request, env }) {
  // This should be protected with proper authentication
  try {
    // Run migration
    const output = execSync('npx run migrate:prd').toString()
    
    return Response.json({
      success: true,
      message: 'Migration completed successfully',
      output
    })
  } catch (error) {
    console.error('Migration failed:', error)
    return Response.json(
      { 
        success: false,
        error: 'Migration failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}, { method: 'POST' })
```

### Database Seeding

```tsx
// src/scripts/seed.ts
import { PrismaClient } from '@prisma/client'
import { createD1Adapter } from '@prisma/adapter-d1'

export async function seed(db: D1Database) {
  const prisma = new PrismaClient({
    adapter: createD1Adapter(db)
  })

  try {
    // Create users
    const user1 = await prisma.user.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
      }
    })

    const user2 = await prisma.user.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@example.com',
      }
    })

    // Create posts with tags
    await prisma.post.create({
      data: {
        title: 'Getting Started with RedwoodSDK',
        content: 'RedwoodSDK is a powerful framework...',
        published: true,
        author: {
          connect: { id: user1.id }
        },
        tags: {
          create: [
            { tag: { create: { name: 'tutorial' } } },
            { tag: { create: { name: 'redwoodsdk' } } }
          ]
        }
      }
    })

    await prisma.post.create({
      data: {
        title: 'Working with D1 and Prisma',
        content: 'Prisma makes database operations easy...',
        published: true,
        author: {
          connect: { id: user2.id }
        },
        tags: {
          create: [
            { tag: { connect: { name: 'tutorial' } } },
            { tag: { create: { name: 'database' } } },
            { tag: { create: { name: 'prisma' } } }
          ]
        }
      }
    })

    console.log('Database seeded successfully')
  } catch (error) {
    console.error('Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Usage in a route or command
route('/api/admin/seed', async function handler({ env }) {
  try {
    await seed(env.DB)
    return Response.json({ success: true, message: 'Database seeded successfully' })
  } catch (error) {
    return Response.json(
      { success: false, error: 'Seeding failed', details: error.message },
      { status: 500 }
    )
  }
}, { method: 'POST' })
```
