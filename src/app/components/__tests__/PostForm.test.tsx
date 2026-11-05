import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const h = vi.hoisted(() => ({ createPost: vi.fn(), updatePost: vi.fn() }))
vi.mock('@/app/pages/posts/functions', () => h)

import { PostForm } from '../PostForm'

const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const submit = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  Object.defineProperty(window, 'location', { value: { href: '' }, writable: true })
})

describe('PostForm (create)', () => {
  const org = { id: 'o1', name: 'KNS' }

  it('preselects the only club and publishes with default visibility', async () => {
    h.createPost.mockResolvedValue({ id: 'p1' })
    render(<PostForm mode="create" organizations={[org]} />)
    expect(screen.getByText('KNS')).toBeInTheDocument()
    expect(screen.getByLabelText(/club only/i)).toBeChecked()

    fill(/title/i, '  Regatta  ')
    fill(/content/i, 'Tekst')
    fireEvent.click(screen.getByLabelText(/everyone/i))
    submit(/publish/i)

    await waitFor(() => expect(h.createPost).toHaveBeenCalled())
    expect(h.createPost).toHaveBeenCalledWith({
      title: 'Regatta', content: 'Tekst', category: 'News', visibility: 'PUBLIC', imageUrl: '', organizationId: 'o1',
    })
    await waitFor(() => expect(window.location.href).toBe('/home'))
  })

  it('checks title and content before calling the server', () => {
    render(<PostForm mode="create" organizations={[org]} />)
    fill(/title/i, 'ab')
    submit(/publish/i)
    expect(screen.getByRole('alert')).toHaveTextContent(/title/i)
    fill(/title/i, 'Long enough')
    submit(/publish/i)
    expect(screen.getByRole('alert')).toHaveTextContent(/content/i)
    expect(h.createPost).not.toHaveBeenCalled()
  })

  it('requires choosing a club when there are several', () => {
    render(<PostForm mode="create" organizations={[org, { id: 'o2', name: 'Other' }]} />)
    fill(/title/i, 'Long enough')
    fill(/content/i, 'Tekst')
    submit(/publish/i)
    expect(screen.getByRole('alert')).toHaveTextContent(/club/i)
    expect(h.createPost).not.toHaveBeenCalled()
  })

  it('shows an error when the server rejects', async () => {
    h.createPost.mockRejectedValue(new Error('Forbidden'))
    render(<PostForm mode="create" organizations={[org]} />)
    fill(/title/i, 'Long enough')
    fill(/content/i, 'Tekst')
    submit(/publish/i)
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(window.location.href).toBe('')
  })
})

describe('PostForm (edit)', () => {
  it('starts from the post values, shows the fixed club and saves via updatePost', async () => {
    h.updatePost.mockResolvedValue({ id: 'p1' })
    render(
      <PostForm
        mode="edit"
        postId="p1"
        organization={{ id: 'o1', name: 'KNS' }}
        initial={{ title: 'Old', content: 'Body', category: 'Event', visibility: 'COACH', imageUrl: '' }}
      />,
    )
    expect(screen.getByLabelText(/title/i)).toHaveValue('Old')
    expect(screen.getByLabelText(/me and coaches/i)).toBeChecked()
    expect(screen.getByText(/cannot be changed/i)).toBeInTheDocument()

    fill(/title/i, 'New title')
    submit(/save changes/i)
    await waitFor(() =>
      expect(h.updatePost).toHaveBeenCalledWith('p1', {
        title: 'New title', content: 'Body', category: 'Event', visibility: 'COACH', imageUrl: '',
      }),
    )
    expect(h.createPost).not.toHaveBeenCalled()
  })
})
