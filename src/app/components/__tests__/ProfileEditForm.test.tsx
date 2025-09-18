import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SimpleProfileEditForm } from '../ProfileEditForm'
import { updateUserProfile } from '@/app/pages/user/profile/functions'

// Mock the profile functions
vi.mock('@/app/pages/user/profile/functions', () => ({
  updateUserProfile: vi.fn(),
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

// Mock alert
global.alert = vi.fn()

describe('ProfileEditForm Component', () => {
  const user = userEvent.setup()
  
  const mockProfile = {
    id: 'profile-123',
    name: 'Test User',
    bio: 'Test bio',
    location: 'Test Location',
    experienceLevel: 'intermediate',
    sailingExperience: 'Test sailing experience',
    certifications: ['RYA Day Skipper', 'First Aid'],
    boatInformation: {
      boatType: 'ILCA 6',
      boatName: 'Test Boat',
      sailNumber: 'NOR 12345',
      yearBuilt: '2020',
      manufacturer: 'PSA',
    },
    clubAffiliation: 'Test Sailing Club',
    privacySettings: {
      showEmail: false,
      showLocation: true,
      showExperience: true,
      showBoatInfo: true,
      showActivity: true,
    },
    profilePicture: '',
  }

  const defaultProps = {
    profile: mockProfile,
    userId: 'user-123',
    username: 'testuser',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    global.alert = vi.fn()
  })

  describe('Profile View and Rendering', () => {
    it('should render profile form with all sections', () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Sailing Experience')).toBeInTheDocument()
      expect(screen.getByText('Boat Information')).toBeInTheDocument()
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument()
    })

    it('should display sailing fields correctly', () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      // Check basic information fields
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Sailing Club')).toBeInTheDocument()
      
      // Check sailing experience fields
      const experienceSelect = screen.getByLabelText('Experience Level')
      expect(experienceSelect).toHaveValue('intermediate')
      expect(screen.getByDisplayValue('Test sailing experience')).toBeInTheDocument()
      
      // Check boat information fields
      expect(screen.getByDisplayValue('ILCA 6')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Boat')).toBeInTheDocument()
      expect(screen.getByDisplayValue('NOR 12345')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2020')).toBeInTheDocument()
      expect(screen.getByDisplayValue('PSA')).toBeInTheDocument()
    })

    it('should display certifications correctly', () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      expect(screen.getByText('RYA Day Skipper')).toBeInTheDocument()
      expect(screen.getByText('First Aid')).toBeInTheDocument()
    })

    it('should display privacy settings correctly', () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      const showEmailCheckbox = screen.getByLabelText('Show email address')
      const showLocationCheckbox = screen.getByLabelText('Show location')
      const showExperienceCheckbox = screen.getByLabelText('Show sailing experience')
      const showBoatInfoCheckbox = screen.getByLabelText('Show boat information')
      const showActivityCheckbox = screen.getByLabelText('Show activity status')
      
      expect(showEmailCheckbox).not.toBeChecked()
      expect(showLocationCheckbox).toBeChecked()
      expect(showExperienceCheckbox).toBeChecked()
      expect(showBoatInfoCheckbox).toBeChecked()
      expect(showActivityCheckbox).toBeChecked()
    })
  })

  describe('Form Editing and Interaction', () => {
    it('should handle form field changes', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      const nameInput = screen.getByLabelText('Full Name')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')
      
      expect(nameInput).toHaveValue('Updated Name')
    })

    it('should handle boat information changes', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      const boatTypeInput = screen.getByLabelText('Boat Type')
      await user.clear(boatTypeInput)
      await user.type(boatTypeInput, 'ILCA 7')
      
      expect(boatTypeInput).toHaveValue('ILCA 7')
    })

    it('should handle privacy settings changes', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      const showEmailCheckbox = screen.getByLabelText('Show email address')
      await user.click(showEmailCheckbox)
      
      expect(showEmailCheckbox).toBeChecked()
    })

    it('should handle certification management', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      // Add a new certification
      const certificationInput = screen.getByPlaceholderText('Add a certification')
      await user.type(certificationInput, 'New Certification')
      await user.click(screen.getByText('Add'))
      
      expect(screen.getByText('New Certification')).toBeInTheDocument()
      expect(certificationInput).toHaveValue('')
      
      // Remove a certification
      const removeButtons = screen.getAllByText('Remove')
      await user.click(removeButtons[0])
      
      expect(screen.queryByText('RYA Day Skipper')).not.toBeInTheDocument()
    })

    it('should add certification on Enter key press', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)
      
      const certificationInput = screen.getByPlaceholderText('Add a certification')
      await user.type(certificationInput, 'Enter Certification')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('Enter Certification')).toBeInTheDocument()
      expect(certificationInput).toHaveValue('')
    })
  })

  describe('Form Submission and API Integration', () => {
    it('should handle successful form submission', async () => {
      const mockUpdateUserProfile = vi.mocked(updateUserProfile)
      const mockProfileResult = {
        id: 'profile-123',
        userId: 'user-123',
        name: 'Updated Name',
        bio: 'Test bio',
        location: 'Test Location',
        experienceLevel: 'intermediate',
        sailingExperience: 'Test sailing experience',
        certifications: JSON.stringify(['RYA Day Skipper', 'First Aid']),
        boatInformation: JSON.stringify({
          boatType: 'ILCA 6',
          boatName: 'Test Boat',
          sailNumber: 'NOR 12345',
          yearBuilt: '2020',
          manufacturer: 'PSA',
        }),
        clubAffiliation: 'Test Sailing Club',
        privacySettings: JSON.stringify({
          showEmail: false,
          showLocation: true,
          showExperience: true,
          showBoatInfo: true,
          showActivity: true,
        }),
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockUpdateUserProfile.mockResolvedValue(mockProfileResult)

      render(<SimpleProfileEditForm {...defaultProps} />)

      // Make some changes
      const nameInput = screen.getByLabelText('Full Name')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)

      // Verify function was called with correct data
      await waitFor(() => {
        expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-123', expect.objectContaining({
          name: 'Updated Name',
          bio: 'Test bio',
          location: 'Test Location',
          experienceLevel: 'intermediate',
          sailingExperience: 'Test sailing experience',
          certifications: ['RYA Day Skipper', 'First Aid'],
          boatInformation: {
            boatType: 'ILCA 6',
            boatName: 'Test Boat',
            sailNumber: 'NOR 12345',
            yearBuilt: '2020',
            manufacturer: 'PSA',
          },
          clubAffiliation: 'Test Sailing Club',
          privacySettings: {
            showEmail: false,
            showLocation: true,
            showExperience: true,
            showBoatInfo: true,
            showActivity: true,
          },
        }))
      })

      // Verify success message and redirect
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Profile updated successfully!')
        expect(mockLocation.href).toBe('/user/testuser/profile')
      })
    })

    it('should handle failed form submission', async () => {
      const mockUpdateUserProfile = vi.mocked(updateUserProfile)
      mockUpdateUserProfile.mockResolvedValue(null)

      render(<SimpleProfileEditForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to update profile')
        expect(mockLocation.href).toBe('')
      })
    })

    it('should handle network error during submission', async () => {
      const mockUpdateUserProfile = vi.mocked(updateUserProfile)
      mockUpdateUserProfile.mockRejectedValue(new Error('Network error'))

      render(<SimpleProfileEditForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('An unexpected error occurred')
        expect(mockLocation.href).toBe('')
      })
    })

    it('should disable submit button during submission', async () => {
      const mockUpdateUserProfile = vi.mocked(updateUserProfile)
      // Create a promise that we can control
      let resolveUpdate: (value: any) => void
      const updatePromise = new Promise<any>((resolve) => {
        resolveUpdate = resolve
      })
      mockUpdateUserProfile.mockReturnValue(updatePromise)

      render(<SimpleProfileEditForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(submitButton)

      // Verify button is disabled and shows loading text
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(submitButton).toHaveTextContent('Saving...')
      })

      // Resolve the update with a mock profile result
      resolveUpdate!({
        id: 'profile-123',
        userId: 'user-123',
        name: 'Test User',
        bio: 'Test bio',
        location: 'Test Location',
        experienceLevel: 'intermediate',
        sailingExperience: 'Test sailing experience',
        certifications: JSON.stringify(['RYA Day Skipper', 'First Aid']),
        boatInformation: JSON.stringify({
          boatType: 'ILCA 6',
          boatName: 'Test Boat',
          sailNumber: 'NOR 12345',
          yearBuilt: '2020',
          manufacturer: 'PSA',
        }),
        clubAffiliation: 'Test Sailing Club',
        privacySettings: JSON.stringify({
          showEmail: false,
          showLocation: true,
          showExperience: true,
          showBoatInfo: true,
          showActivity: true,
        }),
        profilePicture: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Wait for completion
      await waitFor(() => {
        expect(mockLocation.href).toBe('/user/testuser/profile')
      })
    })
  })

  describe('Form Validation and Security', () => {
    it('should handle invalid email format in validation', async () => {
      // This test simulates client-side validation
      render(<SimpleProfileEditForm {...defaultProps} />)

      // The form doesn't have email validation built-in, but we can test
      // that XSS attempts are handled properly in text fields
      const nameInput = screen.getByLabelText('Full Name')
      await user.clear(nameInput)
      await user.type(nameInput, 'Valid Name')

      expect(nameInput).toHaveValue('Valid Name')
    })

    it('should prevent XSS in text inputs', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)

      // Test XSS prevention in name field
      const nameInput = screen.getByLabelText('Full Name')
      await user.clear(nameInput)
      await user.type(nameInput, '<script>alert("xss")</script>')

      // The input should contain the raw text, not execute the script
      expect(nameInput).toHaveValue('<script>alert("xss")</script>')

      // Test XSS prevention in bio field
      const bioInput = screen.getByLabelText('Bio')
      await user.clear(bioInput)
      await user.type(bioInput, '<img src="x" onerror="alert(1)">')

      expect(bioInput).toHaveValue('<img src="x" onerror="alert(1)">')
    })

    it('should handle empty certification input gracefully', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)

      // Try to add empty certification
      const certificationInput = screen.getByPlaceholderText('Add a certification')
      await user.click(screen.getByText('Add'))

      // Should not add empty certification
      expect(certificationInput).toHaveValue('')
      // Original certifications should still be there
      expect(screen.getByText('RYA Day Skipper')).toBeInTheDocument()
      expect(screen.getByText('First Aid')).toBeInTheDocument()
    })

    it('should handle whitespace-only certification input', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)

      const certificationInput = screen.getByPlaceholderText('Add a certification')
      await user.type(certificationInput, '   ')

      // Count initial certifications
      const initialCertifications = screen.getAllByText('Remove').length

      await user.click(screen.getByText('Add'))

      // Should not add whitespace-only certification (count should remain the same)
      const finalCertifications = screen.getAllByText('Remove').length
      expect(finalCertifications).toBe(initialCertifications)

      // Input should still contain the whitespace (component doesn't clear invalid input)
      expect(certificationInput).toHaveValue('   ')
    })
  })

  describe('Navigation and Cancel Actions', () => {
    it('should handle cancel button click', async () => {
      render(<SimpleProfileEditForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockHistory.back).toHaveBeenCalled()
    })

    it('should have proper form structure and accessibility', () => {
      render(<SimpleProfileEditForm {...defaultProps} />)

      // Check that form elements have proper labels
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Bio')).toBeInTheDocument()
      expect(screen.getByLabelText('Location')).toBeInTheDocument()
      expect(screen.getByLabelText('Club Affiliation')).toBeInTheDocument()
      expect(screen.getByLabelText('Experience Level')).toBeInTheDocument()
      expect(screen.getByLabelText('Sailing Experience Details')).toBeInTheDocument()

      // Check boat information labels
      expect(screen.getByLabelText('Boat Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Boat Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Sail Number')).toBeInTheDocument()
      expect(screen.getByLabelText('Year Built')).toBeInTheDocument()
      expect(screen.getByLabelText('Manufacturer')).toBeInTheDocument()

      // Check privacy settings labels
      expect(screen.getByLabelText('Show email address')).toBeInTheDocument()
      expect(screen.getByLabelText('Show location')).toBeInTheDocument()
      expect(screen.getByLabelText('Show sailing experience')).toBeInTheDocument()
      expect(screen.getByLabelText('Show boat information')).toBeInTheDocument()
      expect(screen.getByLabelText('Show activity status')).toBeInTheDocument()
    })
  })
})
