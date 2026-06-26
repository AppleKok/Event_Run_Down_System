import { describe, it, expect } from 'vitest'
import { toMinutes, toHHMM, addMinutes } from '../../src/lib/transport/time'

describe('time helpers', () => {
  it('parses HH:MM to minutes', () => {
    expect(toMinutes('00:00')).toBe(0)
    expect(toMinutes('15:08')).toBe(908)
    expect(toMinutes('23:59')).toBe(1439)
  })
  it('formats minutes to HH:MM with zero padding', () => {
    expect(toHHMM(0)).toBe('00:00')
    expect(toHHMM(908)).toBe('15:08')
    expect(toHHMM(1439)).toBe('23:59')
  })
  it('adds minutes', () => {
    expect(addMinutes('15:00', 15)).toBe('15:15')
    expect(addMinutes('23:50', 20)).toBe('00:10') // wraps past midnight
  })
})
