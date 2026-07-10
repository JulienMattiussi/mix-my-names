import { render, screen } from '@testing-library/react'
import App from '@/App'

describe('App', () => {
  it('renders the shared-letter figure', () => {
    render(<App />)
    expect(screen.getByRole('img', { name: /MASCHTALER.*MARTIN/i })).toBeInTheDocument()
  })
})
