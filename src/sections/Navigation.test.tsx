import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navigation from './Navigation'

describe('Navigation', () => {
  it('renders desktop navigation links and the platform entry', () => {
    render(<Navigation />)

    expect(screen.getByText('Motor Control Lab')).toBeInTheDocument()
    expect(screen.getAllByText('信息加工')).toHaveLength(1)
    expect(screen.getAllByText('感觉系统')).toHaveLength(1)
    expect(screen.getByRole('link', { name: '进入平台' })).toHaveAttribute('href', '/platform.html')
  })

  it('opens the mobile menu and scrolls to a selected section', async () => {
    const user = userEvent.setup()
    const target = document.createElement('section')
    target.id = 'attention'
    target.scrollIntoView = vi.fn()
    document.body.appendChild(target)

    render(<Navigation />)

    await user.click(screen.getByRole('button', { name: 'Toggle menu' }))

    expect(screen.getAllByText('注意分配')).toHaveLength(2)

    await user.click(screen.getAllByText('注意分配')[1])

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    expect(screen.getAllByText('注意分配')).toHaveLength(1)

    target.remove()
  })
})
