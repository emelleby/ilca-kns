import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarPageLayout } from '../SidebarPageLayout'
import type { RequestInfo } from 'rwsdk/worker'

// Mock the shared links
vi.mock('@/app/shared/links', () => ({
  link: vi.fn((path: string, params?: any) => {
    if (params && path.includes(':username')) {
      return path.replace(':username', params.username)
    }
    return path
  })
}))

// Mock the useIsMobile hook
vi.mock('@/app/hooks/use-mobile', () => ({
  useIsMobile: vi.fn()
}))

// Import the mocked hook to control its return value
import { useIsMobile } from '@/app/hooks/use-mobile'

describe('SidebarPageLayout Component (shadcn/ui)', () => {
  const user = userEvent.setup()

  // Helper function to create mock RequestInfo
  const mockRequestInfo = (username?: string): RequestInfo & { children: React.ReactNode } => ({
    ctx: username
      ? {
          user: {
            id: 'user-123',
            username,
            email: 'test@example.com',
            role: 'USER'
          }
        }
      : {},
    request: new Request('https://localhost:3000'),
    headers: new Headers(),
    children: <div>Test Content</div>
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Structure & Semantics', () => {
    it('should render sidebar with navigation items', () => {
      vi.mocked(useIsMobile).mockReturnValue(false)

      render(<SidebarPageLayout {...mockRequestInfo()}>Test Content</SidebarPageLayout>)

      // Check for navigation items
      expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Tasks/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Test/i })).toBeInTheDocument()
    })

    it('should render user-specific navigation items when authenticated', () => {
      vi.mocked(useIsMobile).mockReturnValue(false)

      render(<SidebarPageLayout {...mockRequestInfo('testuser')}>Test Content</SidebarPageLayout>)

      // Check for user-specific items
      expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument()
    })

    it('should render main content area', () => {
      vi.mocked(useIsMobile).mockReturnValue(false)

      render(<SidebarPageLayout {...mockRequestInfo()}>Test Content</SidebarPageLayout>)

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render sidebar trigger button', () => {
      vi.mocked(useIsMobile).mockReturnValue(false)

      render(<SidebarPageLayout {...mockRequestInfo()}>Test Content</SidebarPageLayout>)

      // SidebarTrigger should be present
      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Desktop Behavior', () => {
    it('should render sidebar on desktop', () => {
      vi.mocked(useIsMobile).mockReturnValue(false)

      render(<SidebarPageLayout {...mockRequestInfo()}>Test Content</SidebarPageLayout>)

      // Sidebar should be visible with navigation items
      expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Tasks/i })).toBeInTheDocument()
    })

    it('should toggle sidebar collapse/expand on desktop', async () => {
      vi.mocked(useIsMobile).mockReturnValue(false)

      render(<SidebarPageLayout {...mockRequestInfo()}>Test Content</SidebarPageLayout>)

      const toggleButton = screen.getByRole('button')

      // Click to toggle
      await user.click(toggleButton)

      // Sidebar should still be in the document (just collapsed)
      expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
    })
  })

  describe('Mobile Behavior', () => {
    it('should render mobile layout', () => {
      vi.mocked(useIsMobile).mockReturnValue(true)

      render(<SidebarPageLayout {...mockRequestInfo()}>Test Content</SidebarPageLayout>)

      // Content should be visible
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('Content Visibility', () => {
    it('should render main content regardless of sidebar state', async () => {
      vi.mocked(useIsMobile).mockReturnValue(false)

      render(<SidebarPageLayout {...mockRequestInfo()}>Test Content</SidebarPageLayout>)

      expect(screen.getByText('Test Content')).toBeInTheDocument()

      const toggleButton = screen.getByRole('button')
      await user.click(toggleButton)

      // Content should still be visible
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })
})

