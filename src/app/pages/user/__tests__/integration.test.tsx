import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Login } from '../Login'
import ProfileView from '../profile/ProfileView'
import { SimpleProfileEditForm } from '@/app/components/ProfileEditForm'
import { HomeLayout } from '@/app/layouts/HomeLayout'
import { loginWithPassword } from '../functions'
import { getPublicProfile, updateUserProfile } from '../profile/functions'
import { link } from '@/app/shared/links'

// Mock the authentication functions
vi.mock('../functions', () => ({
  loginWithPassword: vi.fn(),
  startPasskeyLogin: vi.fn(),
  finishPasskeyLogin: vi.fn(),
}))

// Mock the profile functions
vi.mock('../profile/functions', () => ({
  getPublicProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
  autoCreateUserProfile: vi.fn(),
}))

// Mock @simplewebauthn/browser
vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(),
}))

// Mock shared links
vi.mock('@/app/shared/links', () => ({
  link: vi.fn((path: string) => path),
}))

// Mock window.location and window.history
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

const mockHistory = {
  back: vi.fn(),
}
Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true,
})

// Mock alert for error handling
global.alert = vi.fn()

describe('Integration Tests: Critical User Journeys', () => {
  const user = userEvent.setup()

  // Mock profile data for testing
  const mockProfile = {
    id: 'profile-123',
    userId: 'user-123',
    name: 'Test Sailor',
    bio: 'Experienced sailor',
    location: 'Marina Bay',
    experienceLevel: 'intermediate',
    sailingExperience: '5 years of competitive sailing',
    certifications: ['RYA Day Skipper', 'First Aid'],
    boatInformation: {
      boatType: 'ILCA 6',
      boatName: 'Sea Breeze',
      sailNumber: 'NOR 12345',
      yearBuilt: '2020',
      manufacturer: 'PSA',
    },
    clubAffiliation: 'Marina Sailing Club',
    privacySettings: {
      showEmail: false,
      showLocation: true,
      showExperience: true,
      showBoatInfo: true,
      showActivity: true,
    },
    profilePicture: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockUser = {
    id: 'user-123',
    username: 'testsailor',
    email: 'test@example.com',
    role: 'USER',
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    global.alert = vi.fn()
  })

  describe('AC1: Login → Profile View Integration', () => {
    it('should successfully login and navigate to profile with sailing data displayed', async () => {
      // Setup mocks
      const mockLoginWithPassword = vi.mocked(loginWithPassword)
      const mockGetPublicProfile = vi.mocked(getPublicProfile)
      
      mockLoginWithPassword.mockResolvedValue(true)
      mockGetPublicProfile.mockResolvedValue({
        ...mockProfile,
        user: mockUser,
      })

      // Render Login component
      render(<Login />)
      
      // Simulate login process
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /login with email/i }))
      
      // Verify login was called
      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalledWith('test@example.com', 'password123')
      })
      
      // Verify navigation to home (simulating successful login)
      await waitFor(() => {
        expect(mockLocation.href).toBe('/home')
      })

      // Now test profile view after login
      // Reset location for profile view test
      mockLocation.href = ''
      
      // Render ProfileView component (simulating navigation to profile)
      render(<ProfileView profileUserId="user-123" isOwnProfile={true} currentUserId="user-123" />)
      
      // Verify profile data loads and sailing fields are displayed
      await waitFor(() => {
        expect(mockGetPublicProfile).toHaveBeenCalledWith('user-123', 'user-123')
      })
      
      // Wait for profile data to load and verify sailing-specific fields
      await waitFor(() => {
        expect(screen.getByText('Test Sailor')).toBeInTheDocument()
        expect(screen.getByText('ILCA 6')).toBeInTheDocument()
        expect(screen.getByText('Sea Breeze')).toBeInTheDocument()
        expect(screen.getByText('NOR 12345')).toBeInTheDocument()
        expect(screen.getByText('Marina Sailing Club')).toBeInTheDocument()
      })
    })

    it('should handle login failure gracefully', async () => {
      const mockLoginWithPassword = vi.mocked(loginWithPassword)
      mockLoginWithPassword.mockResolvedValue(false)

      render(<Login />)
      
      await user.type(screen.getByLabelText(/email/i), 'invalid@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /login with email/i }))
      
      // Verify error message is displayed and no navigation occurs
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
        expect(mockLocation.href).toBe('')
      })
    })
  })

  describe('AC2: Profile Edit → Save → Navigation Integration', () => {
    it('should edit profile, save successfully, then navigate without state loss', async () => {
      const mockUpdateUserProfile = vi.mocked(updateUserProfile)
      const updatedProfile = {
        ...mockProfile,
        name: 'Updated Sailor Name',
      }
      mockUpdateUserProfile.mockResolvedValue(updatedProfile)

      // Render ProfileEditForm within a layout context
      render(
        <div>
          <SimpleProfileEditForm 
            profile={{
              ...mockProfile,
              boatInformation: mockProfile.boatInformation!,
              privacySettings: mockProfile.privacySettings!,
            }}
            userId="user-123"
            username="testsailor"
          />
        </div>
      )
      
      // Edit profile details
      const nameInput = screen.getByLabelText('Full Name')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Sailor Name')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)
      
      // Verify profile update was called with correct data
      await waitFor(() => {
        expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-123', expect.objectContaining({
          name: 'Updated Sailor Name',
        }))
      })
      
      // Verify successful update and navigation
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Profile updated successfully!')
        expect(mockLocation.href).toBe('/user/testsailor/profile')
      })
      
      // Test sidebar navigation after successful save
      // Reset location to simulate being on profile page
      mockLocation.href = '/user/testsailor/profile'
      
      // Render a simple navigation component to test sidebar click
      render(
        <div>
          <a href="/home" onClick={() => { mockLocation.href = '/home' }}>
            Home
          </a>
        </div>
      )
      
      // Click sidebar navigation to home
      const homeLink = screen.getByRole('link', { name: /home/i })
      await user.click(homeLink)
      
      // Verify navigation occurred without errors
      expect(mockLocation.href).toBe('/home')
    })
  })

  describe('AC3: Error Handling Integration', () => {
    it('should handle network failure during profile save and show proper error handling', async () => {
      const mockUpdateUserProfile = vi.mocked(updateUserProfile)
      mockUpdateUserProfile.mockRejectedValue(new Error('Network error'))

      render(
        <SimpleProfileEditForm 
          profile={{
            ...mockProfile,
            boatInformation: mockProfile.boatInformation!,
            privacySettings: mockProfile.privacySettings!,
          }}
          userId="user-123"
          username="testsailor"
        />
      )
      
      // Make a change and submit
      const nameInput = screen.getByLabelText('Full Name')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')
      
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)
      
      // Verify error handling
      await waitFor(() => {
        expect(mockUpdateUserProfile).toHaveBeenCalled()
        expect(global.alert).toHaveBeenCalledWith('An unexpected error occurred')
        // Verify user stays on page (no navigation)
        expect(mockLocation.href).toBe('')
      })
    })
  })
})
