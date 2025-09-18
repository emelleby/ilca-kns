import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeLayout } from '../HomeLayout'
import { link } from '@/app/shared/links'

// Mock the shared links
vi.mock('@/app/shared/links', () => ({
  link: vi.fn((path: string, params?: any) => {
    if (params && path.includes(':username')) {
      return path.replace(':username', params.username)
    }
    return path
  }),
}))

// Mock ClientToaster component
vi.mock('@/app/components/ClientToaster', () => ({
  ClientToaster: () => <div data-testid="client-toaster">Toaster</div>,
}))

// Mock Avatar components
vi.mock('@/app/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div data-testid="avatar-fallback">{children}</div>,
}))

describe('HomeLayout Component', () => {
  const user = userEvent.setup()

  const mockAuthenticatedContext = {
    user: {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'USER',
    },
  }

  const mockUnauthenticatedContext = {
    user: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Layout Structure', () => {
    it('should render header with logo and navigation', () => {
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Test Content</div>
        </HomeLayout>
      )

      // Check header elements
      expect(screen.getByText('ILCA-KNS')).toBeInTheDocument()
      expect(screen.getByAltText('KNS')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.getByTestId('client-toaster')).toBeInTheDocument()
    })

    it('should render main content area with Suspense fallback', () => {
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Main Content</div>
        </HomeLayout>
      )

      expect(screen.getByText('Main Content')).toBeInTheDocument()
    })
  })

  describe('Authenticated User Navigation', () => {
    it('should display authenticated navigation menu', () => {
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      // Check authenticated navigation links by exact text
      expect(screen.getByRole('link', { name: 'Test' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Logout' })).toBeInTheDocument()

      // Check user avatar and username
      expect(screen.getByTestId('avatar')).toBeInTheDocument()
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('T')
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('should generate correct navigation links with username', () => {
      const mockLink = vi.mocked(link)
      
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      // Verify link function was called with correct parameters
      expect(mockLink).toHaveBeenCalledWith('/user/:username/profile', { username: 'testuser' })
      expect(mockLink).toHaveBeenCalledWith('/user/:username/settings', { username: 'testuser' })
    })

    it('should handle navigation link clicks', async () => {
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      // Test clicking on profile link
      const profileLink = screen.getByRole('link', { name: 'Profile' })
      expect(profileLink).toHaveAttribute('href', '/user/testuser/profile')

      // Test clicking on settings link
      const settingsLink = screen.getByRole('link', { name: 'Settings' })
      expect(settingsLink).toHaveAttribute('href', '/user/testuser/settings')

      // Test clicking on test link
      const testLink = screen.getByRole('link', { name: 'Test' })
      expect(testLink).toHaveAttribute('href', '/test')

      // Test clicking on tasks link
      const tasksLink = screen.getByRole('link', { name: 'Tasks' })
      expect(tasksLink).toHaveAttribute('href', '/tasks')

      // Test clicking on logout link
      const logoutLink = screen.getByRole('link', { name: 'Logout' })
      expect(logoutLink).toHaveAttribute('href', '/user/logout')
    })

    it('should display correct avatar fallback for username', () => {
      const contextWithDifferentUser = {
        user: {
          id: 'user-456',
          username: 'sailorjoe',
          email: 'joe@example.com',
          role: 'USER',
        },
      }

      render(
        <HomeLayout ctx={contextWithDifferentUser}>
          <div>Content</div>
        </HomeLayout>
      )

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('S')
      expect(screen.getByText('sailorjoe')).toBeInTheDocument()
    })

    it('should handle empty username gracefully', () => {
      const contextWithEmptyUsername = {
        user: {
          id: 'user-789',
          username: '',
          email: 'empty@example.com',
          role: 'USER',
        },
      }

      render(
        <HomeLayout ctx={contextWithEmptyUsername}>
          <div>Content</div>
        </HomeLayout>
      )

      // Should show unauthenticated navigation when username is empty
      expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Signup' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()
      expect(screen.queryByTestId('avatar')).not.toBeInTheDocument()
    })
  })

  describe('Unauthenticated User Navigation', () => {
    it('should display unauthenticated navigation menu', () => {
      render(
        <HomeLayout ctx={mockUnauthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      // Check unauthenticated navigation links
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /signup/i })).toBeInTheDocument()
      
      // Should not show authenticated links
      expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /logout/i })).not.toBeInTheDocument()
      expect(screen.queryByTestId('avatar')).not.toBeInTheDocument()
    })

    it('should have correct href attributes for unauthenticated links', () => {
      render(
        <HomeLayout ctx={mockUnauthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      const loginLink = screen.getByRole('link', { name: /login/i })
      expect(loginLink).toHaveAttribute('href', '/user/login')

      const signupLink = screen.getByRole('link', { name: /signup/i })
      expect(signupLink).toHaveAttribute('href', '/user/signup')
    })
  })

  describe('Core Path Verification', () => {
    it('should have no broken links in core navigation paths', () => {
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      // Verify all core navigation links have proper href attributes
      const coreLinks = [
        { name: 'Test', href: '/test' },
        { name: 'Tasks', href: '/tasks' },
        { name: 'Profile', href: '/user/testuser/profile' },
        { name: 'Settings', href: '/user/testuser/settings' },
        { name: 'Logout', href: '/user/logout' },
      ]

      coreLinks.forEach(({ name, href }) => {
        const link = screen.getByRole('link', { name })
        expect(link).toHaveAttribute('href', href)
        expect(link.getAttribute('href')).not.toBe('')
        expect(link.getAttribute('href')).not.toBeNull()
      })
    })

    it('should have working home logo link', () => {
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      const logoLinks = screen.getAllByRole('link')
      const homeLogoLink = logoLinks.find(link => 
        link.querySelector('img[alt="KNS"]') || 
        link.textContent?.includes('ILCA-KNS')
      )
      
      expect(homeLogoLink).toBeDefined()
      expect(homeLogoLink).toHaveAttribute('href', '/home')
    })
  })

  describe('Accessibility and Structure', () => {
    it('should have proper semantic structure', () => {
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      // Check for proper semantic elements
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument() // main
      expect(screen.getByRole('navigation')).toBeInTheDocument() // nav
    })

    it('should have accessible image alt text', () => {
      render(
        <HomeLayout ctx={mockAuthenticatedContext}>
          <div>Content</div>
        </HomeLayout>
      )

      const logoImage = screen.getByAltText('KNS')
      expect(logoImage).toBeInTheDocument()
      expect(logoImage).toHaveAttribute('src', '/images/!logo.png')
    })
  })
})
