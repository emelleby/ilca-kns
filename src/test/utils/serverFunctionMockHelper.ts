import { vi } from 'vitest'

/**
 * Mock helper utilities for server function testing
 * Provides reusable mocks and assertions for testing RedwoodSDK server functions
 */

// Mock user data for testing
export const mockUserData = {
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  role: 'USER',
  createdAt: new Date('2024-01-01'),
  password: 'hashed-password'
}

// Mock profile data for testing
export const mockProfileData = {
  id: 'test-profile-id',
  userId: 'test-user-id',
  name: 'Test User',
  bio: 'Test bio',
  location: 'Test Location',
  experienceLevel: 'Intermediate',
  sailingExperience: '5 years',
  certifications: '["ASA 101", "ASA 103"]',
  boatInformation: '{"boatType": "Sailboat", "boatName": "Test Boat", "sailNumber": "12345"}',
  clubAffiliation: 'Test Sailing Club',
  privacySettings: '{"showEmail": false, "showLocation": true, "showExperience": true}',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockUserData
}

// Mock parsed profile data (as returned by getUserProfile)
export const mockParsedProfileData = {
  ...mockProfileData,
  certifications: ['ASA 101', 'ASA 103'],
  boatInformation: {
    boatType: 'Sailboat',
    boatName: 'Test Boat',
    sailNumber: '12345'
  },
  privacySettings: {
    showEmail: false,
    showLocation: true,
    showExperience: true,
    showBoatInfo: true,
    showActivity: true
  }
}

/**
 * Setup database mocks for server function testing
 */
export function setupDatabaseMocks() {
  const mockDb = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    credential: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    passwordReset: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }

  return mockDb
}

/**
 * Setup session mocks for server function testing
 */
export function setupSessionMocks() {
  return {
    save: vi.fn(),
    load: vi.fn(),
    remove: vi.fn(),
  }
}

/**
 * Setup request info mocks for server function testing
 */
export function setupRequestInfoMocks() {
  return {
    request: new Request('https://localhost:3000'),
    headers: new Headers(),
    ctx: {},
  }
}

/**
 * Helper to assert function success with expected return value
 */
export function assertFunctionSuccess<T>(result: T, expectedValue: T) {
  expect(result).toEqual(expectedValue)
}

/**
 * Helper to assert function failure (returns false or null)
 */
export function assertFunctionFailure<T>(result: T) {
  expect(result).toBe(false)
}

/**
 * Helper to assert function throws error
 */
export async function assertFunctionThrows(fn: () => Promise<any>, expectedError?: string) {
  await expect(fn).rejects.toThrow(expectedError)
}

/**
 * Helper to setup common mocks for authentication functions
 */
export function setupAuthMocks() {
  const sessionMocks = setupSessionMocks()
  const dbMocks = setupDatabaseMocks()
  
  return {
    sessions: sessionMocks,
    db: dbMocks,
  }
}

/**
 * Helper to setup common mocks for profile functions
 */
export function setupProfileMocks() {
  const dbMocks = setupDatabaseMocks()
  
  return {
    db: dbMocks,
  }
}

/**
 * Reset all mocks to clean state
 */
export function resetAllMocks() {
  vi.clearAllMocks()
}
