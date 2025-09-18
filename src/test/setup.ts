import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Cloudflare Workers environment
vi.mock('cloudflare:workers', () => ({
  env: {
    RESEND_API_KEY: 'test-key',
    WEBAUTHN_RP_ID: 'localhost',
    WEBAUTHN_APP_NAME: 'Test App',
    SESSION_DURABLE_OBJECT: {},
    DB: {},
  },
}))

// Mock rwsdk/worker
vi.mock('rwsdk/worker', () => ({
  requestInfo: {
    request: new Request('https://localhost:3000'),
    headers: new Headers(),
    ctx: {},
  },
}))

// Mock session store
vi.mock('@/session/store', () => ({
  sessions: {
    save: vi.fn(),
    load: vi.fn(),
    remove: vi.fn(),
  },
}))

// Mock database
vi.mock('@/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    credential: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock crypto for password hashing
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: vi.fn(() => Buffer.from('test-salt')),
  },
})

// Mock fetch
global.fetch = vi.fn()

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
