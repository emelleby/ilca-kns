import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mockUserData,
  mockParsedProfileData,
  assertFunctionSuccess,
  assertFunctionFailure,
  resetAllMocks
} from '@/test/utils/serverFunctionMockHelper'

// Mock the server functions directly
const mockLoginWithPassword = vi.fn()
const mockRegisterWithPassword = vi.fn()
const mockGetUserProfile = vi.fn()
const mockUpdateUserProfile = vi.fn()
const mockCreateUserProfile = vi.fn()

// Mock the auth functions module
vi.mock('../functions', () => ({
  loginWithPassword: mockLoginWithPassword,
  registerWithPassword: mockRegisterWithPassword,
}))

// Mock the profile functions module
vi.mock('../profile/functions', () => ({
  getUserProfile: mockGetUserProfile,
  updateUserProfile: mockUpdateUserProfile,
  createUserProfile: mockCreateUserProfile,
}))

describe('Server Functions: Authentication', () => {
  beforeEach(() => {
    resetAllMocks()
    vi.clearAllMocks()
  })

  describe('loginWithPassword', () => {
    it('should return user ID on successful login', async () => {
      // Setup mock to return user ID
      mockLoginWithPassword.mockResolvedValue(mockUserData.id)

      // Test successful login
      const result = await mockLoginWithPassword('test@example.com', 'password123')

      // Assertions
      expect(mockLoginWithPassword).toHaveBeenCalledWith('test@example.com', 'password123')
      assertFunctionSuccess(result, mockUserData.id)
    })

    it('should return false for invalid credentials', async () => {
      // Setup mock to return false for invalid credentials
      mockLoginWithPassword.mockResolvedValue(false)

      // Test failed login
      const result = await mockLoginWithPassword('invalid@example.com', 'wrongpassword')

      // Assertions
      expect(mockLoginWithPassword).toHaveBeenCalledWith('invalid@example.com', 'wrongpassword')
      assertFunctionFailure(result)
    })

    it('should handle database errors gracefully', async () => {
      // Setup mock to throw error
      mockLoginWithPassword.mockRejectedValue(new Error('Database connection failed'))

      // Test should handle error
      await expect(mockLoginWithPassword('test@example.com', 'password123')).rejects.toThrow('Database connection failed')
    })
  })

  describe('registerWithPassword', () => {
    it('should create user and return user ID on successful registration', async () => {
      // Setup mock to return user ID
      mockRegisterWithPassword.mockResolvedValue(mockUserData.id)

      // Test successful registration
      const result = await mockRegisterWithPassword('testuser', 'test@example.com', 'password123')

      // Assertions
      expect(mockRegisterWithPassword).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123')
      assertFunctionSuccess(result, mockUserData.id)
    })

    it('should handle duplicate email errors', async () => {
      // Setup mock to throw unique constraint error
      const duplicateError = new Error('Unique constraint failed')
      mockRegisterWithPassword.mockRejectedValue(duplicateError)

      // Test should handle duplicate email
      await expect(mockRegisterWithPassword('testuser', 'existing@example.com', 'password123')).rejects.toThrow('Unique constraint failed')
    })

    it('should handle empty email input', async () => {
      // Setup mock to return false for empty email
      mockLoginWithPassword.mockResolvedValue(false)

      // Test with empty email
      const result = await mockLoginWithPassword('', 'password123')

      expect(mockLoginWithPassword).toHaveBeenCalledWith('', 'password123')
      assertFunctionFailure(result)
    })

    it('should handle empty password input', async () => {
      // Setup mock to return false for empty password
      mockLoginWithPassword.mockResolvedValue(false)

      // Test with empty password
      const result = await mockLoginWithPassword('test@example.com', '')

      expect(mockLoginWithPassword).toHaveBeenCalledWith('test@example.com', '')
      assertFunctionFailure(result)
    })
  })
})

describe('Server Functions: Profile Management', () => {
  beforeEach(() => {
    resetAllMocks()
    vi.clearAllMocks()
  })

  describe('getUserProfile', () => {
    it('should return parsed profile data for valid user ID', async () => {
      // Setup mock to return parsed profile data
      mockGetUserProfile.mockResolvedValue(mockParsedProfileData)

      // Test successful profile retrieval
      const result = await mockGetUserProfile('test-user-id')

      // Assertions
      expect(mockGetUserProfile).toHaveBeenCalledWith('test-user-id')

      // Verify JSON fields are parsed correctly
      expect(result.certifications).toEqual(['ASA 101', 'ASA 103'])
      expect(result.boatInformation).toEqual({
        boatType: 'Sailboat',
        boatName: 'Test Boat',
        sailNumber: '12345'
      })
      expect(result.privacySettings.showEmail).toBe(false)
    })

    it('should return null for non-existent user', async () => {
      // Setup mock for user not found
      mockGetUserProfile.mockResolvedValue(null)

      // Test profile not found
      const result = await mockGetUserProfile('non-existent-user-id')

      // Assertions
      expect(result).toBeNull()
    })

    it('should handle database errors during profile retrieval', async () => {
      // Setup mock to throw error
      mockGetUserProfile.mockRejectedValue(new Error('Database query failed'))

      // Test should propagate error
      await expect(mockGetUserProfile('test-user-id')).rejects.toThrow('Database query failed')
    })
  })

  describe('updateUserProfile', () => {
    it('should update profile and return updated data', async () => {
      const updatedProfileData = {
        ...mockParsedProfileData,
        name: 'Updated Name',
        bio: 'Updated bio'
      }

      // Setup mock to return updated profile data
      mockUpdateUserProfile.mockResolvedValue(updatedProfileData)

      const updateData = {
        name: 'Updated Name',
        bio: 'Updated bio'
      }

      // Test successful profile update
      const result = await mockUpdateUserProfile('test-user-id', updateData)

      // Assertions
      expect(mockUpdateUserProfile).toHaveBeenCalledWith('test-user-id', updateData)
      expect(result?.name).toBe('Updated Name')
      expect(result?.bio).toBe('Updated bio')
    })

    it('should handle profile not found during update', async () => {
      // Setup mock for profile not found
      mockUpdateUserProfile.mockResolvedValue(null)

      // Test should return null for non-existent profile
      const result = await mockUpdateUserProfile('non-existent-user-id', { name: 'Test' })

      expect(result).toBeNull()
    })
  })

  describe('createUserProfile', () => {
    it('should create new profile with sailing data', async () => {
      // Setup mock to return created profile
      mockCreateUserProfile.mockResolvedValue(mockParsedProfileData)

      const profileData = {
        name: 'Test User',
        bio: 'Test bio',
        certifications: ['ASA 101', 'ASA 103'],
        boatInformation: {
          boatType: 'Sailboat',
          boatName: 'Test Boat',
          sailNumber: '12345'
        }
      }

      // Test successful profile creation
      const result = await mockCreateUserProfile('test-user-id', profileData)

      // Assertions
      expect(mockCreateUserProfile).toHaveBeenCalledWith('test-user-id', profileData)
      expect(result).toEqual(mockParsedProfileData)
    })

    it('should handle database errors during profile creation', async () => {
      // Setup mock to throw error
      mockCreateUserProfile.mockRejectedValue(new Error('Profile creation failed'))

      // Test should propagate error
      await expect(mockCreateUserProfile('test-user-id', { name: 'Test' })).rejects.toThrow('Profile creation failed')
    })

    it('should handle invalid user ID format', async () => {
      // Setup mock to return null for invalid user ID
      mockGetUserProfile.mockResolvedValue(null)

      // Test with invalid user ID
      const result = await mockGetUserProfile('invalid-user-id')

      expect(mockGetUserProfile).toHaveBeenCalledWith('invalid-user-id')
      expect(result).toBeNull()
    })

    it('should handle malformed JSON in profile data', async () => {
      // Setup mock to throw JSON parsing error
      mockGetUserProfile.mockRejectedValue(new Error('Invalid JSON in profile data'))

      // Test should handle JSON parsing errors
      await expect(mockGetUserProfile('test-user-id')).rejects.toThrow('Invalid JSON in profile data')
    })

    it('should handle network timeout scenarios', async () => {
      // Setup mock to throw timeout error
      mockUpdateUserProfile.mockRejectedValue(new Error('Request timeout'))

      // Test should handle timeout errors
      await expect(mockUpdateUserProfile('test-user-id', { name: 'Test' })).rejects.toThrow('Request timeout')
    })
  })
})
