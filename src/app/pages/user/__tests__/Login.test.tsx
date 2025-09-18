import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Login } from '../Login'
import { loginWithPassword, startPasskeyLogin, finishPasskeyLogin } from '../functions'
import { link } from '@/app/shared/links'

// Mock the functions
vi.mock('../functions', () => ({
  loginWithPassword: vi.fn(),
  startPasskeyLogin: vi.fn(),
  finishPasskeyLogin: vi.fn(),
}))

// Mock @simplewebauthn/browser
vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(),
}))

// Mock shared links
vi.mock('@/app/shared/links', () => ({
  link: vi.fn((path: string) => path),
}))

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('Login Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  describe('Email/Password Login Flow', () => {
    it('should render login form with email and password fields', () => {
      render(<Login />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /login with email/i })).toBeInTheDocument()
    })

    it('should handle successful email/password login', async () => {
      const mockLoginWithPassword = vi.mocked(loginWithPassword)
      mockLoginWithPassword.mockResolvedValue(true)

      render(<Login />)
      
      // Fill in the form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /login with email/i }))
      
      // Verify function was called with correct parameters
      await waitFor(() => {
        expect(mockLoginWithPassword).toHaveBeenCalledWith('test@example.com', 'password123')
      })
      
      // Verify redirect to home
      await waitFor(() => {
        expect(mockLocation.href).toBe('/home')
      })
    })

    it('should handle invalid credentials error', async () => {
      const mockLoginWithPassword = vi.mocked(loginWithPassword)
      mockLoginWithPassword.mockResolvedValue(false)

      render(<Login />)
      
      // Fill in the form with invalid credentials
      await user.type(screen.getByLabelText(/email/i), 'invalid@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /login with email/i }))
      
      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
      
      // Verify no redirect occurred
      expect(mockLocation.href).toBe('')
    })

    it('should handle network failure during login', async () => {
      const mockLoginWithPassword = vi.mocked(loginWithPassword)
      mockLoginWithPassword.mockRejectedValue(new Error('Network error'))

      render(<Login />)
      
      // Fill in the form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /login with email/i }))
      
      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument()
      })
      
      // Verify no redirect occurred
      expect(mockLocation.href).toBe('')
    })

    it('should disable submit button during login process', async () => {
      const mockLoginWithPassword = vi.mocked(loginWithPassword)
      // Create a promise that we can control
      let resolveLogin: (value: boolean) => void
      const loginPromise = new Promise<boolean>((resolve) => {
        resolveLogin = resolve
      })
      mockLoginWithPassword.mockReturnValue(loginPromise)

      render(<Login />)
      
      // Fill in the form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /login with email/i })
      await user.click(submitButton)
      
      // Verify button is disabled during login
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
      
      // Resolve the login
      resolveLogin!(true)
      
      // Wait for the login to complete
      await waitFor(() => {
        expect(mockLocation.href).toBe('/home')
      })
    })
  })

  describe('Form Validation', () => {
    it('should require email field', async () => {
      render(<Login />)
      
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute('required')
    })

    it('should require password field', async () => {
      render(<Login />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('required')
    })

    it('should have correct input types', () => {
      render(<Login />)
      
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    })
  })

  describe('Navigation Links', () => {
    it('should have link to signup page', () => {
      render(<Login />)
      
      const signupLink = screen.getByRole('link', { name: /register/i })
      expect(signupLink).toBeInTheDocument()
      expect(signupLink).toHaveAttribute('href', '/user/signup')
    })

    it('should have link to forgot password page', () => {
      render(<Login />)
      
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i })
      expect(forgotPasswordLink).toBeInTheDocument()
      expect(forgotPasswordLink).toHaveAttribute('href', '/user/forgot-password')
    })
  })

  describe('Security Scenarios', () => {
    it('should handle session hijacking simulation', async () => {
      const mockLoginWithPassword = vi.mocked(loginWithPassword)
      // Simulate a scenario where login appears successful but session is invalid
      mockLoginWithPassword.mockResolvedValue(true)

      render(<Login />)
      
      // Fill in the form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      // Submit the form
      await user.click(screen.getByRole('button', { name: /login with email/i }))
      
      // Verify redirect occurs (simulating successful login)
      await waitFor(() => {
        expect(mockLocation.href).toBe('/home')
      })
      
      // In a real scenario, the server would validate the session
      // and redirect back to login if the session is invalid
    })
  })
})
