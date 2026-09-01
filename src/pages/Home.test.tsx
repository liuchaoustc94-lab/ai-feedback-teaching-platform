import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from './Home'

describe('Home', () => {
  it('renders the Vite starter counter and increments it', async () => {
    const user = userEvent.setup()

    render(<Home />)

    expect(screen.getByRole('heading', { name: 'Vite + React' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'count is 0' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'count is 0' }))

    expect(screen.getByRole('button', { name: 'count is 1' })).toBeInTheDocument()
  })
})
