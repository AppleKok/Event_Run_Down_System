import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../../src/components/status-badge'

describe('StatusBadge', () => {
  it('renders the status label', () => {
    render(<StatusBadge status="Confirmed" />)
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
  })
  it('falls back gracefully for unknown status', () => {
    render(<StatusBadge status="Weird" />)
    expect(screen.getByText('Weird')).toBeInTheDocument()
  })
})
