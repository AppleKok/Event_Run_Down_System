import { describe, it, expect } from 'vitest'
import { suggestTrips } from '../../src/lib/transport/engine'
import { DEFAULT_CONFIG, Guest } from '../../src/lib/transport/types'

const g = (id: string, name: string, time: string | null, date = '2026-06-30'): Guest =>
  ({ id, name, agency: 'X', arrivalDate: date, arrivalTime: time })

describe('suggestTrips', () => {
  it('ignores guests with no arrival time', () => {
    const trips = suggestTrips([g('1', 'A', null)], DEFAULT_CONFIG)
    expect(trips).toHaveLength(0)
  })

  it('one guest -> pickup = arrival + 15, dropoff +10, van back +20', () => {
    const [t] = suggestTrips([g('1', 'A', '15:00')], DEFAULT_CONFIG)
    expect(t.pickupTime).toBe('15:15')
    expect(t.dropoffTime).toBe('15:25')
    expect(t.vanBackTime).toBe('15:35')
    expect(t.conflict).toBe(false)
    expect(t.guests.map((x) => x.id)).toEqual(['1'])
  })

  it('groups guests arriving at the same time into one trip', () => {
    const trips = suggestTrips([g('1', 'A', '15:00'), g('2', 'B', '15:00')], DEFAULT_CONFIG)
    expect(trips).toHaveLength(1)
    expect(trips[0].guests).toHaveLength(2)
  })

  it('splits a same-time group larger than van capacity into multiple trips', () => {
    const guests = Array.from({ length: 12 }, (_, i) => g(String(i), `G${i}`, '11:00'))
    const trips = suggestTrips(guests, DEFAULT_CONFIG)
    expect(trips).toHaveLength(2)
    expect(trips[0].guests).toHaveLength(10)
    expect(trips[1].guests).toHaveLength(2)
  })

  it('pushes pickup and flags conflict when the single van is still out', () => {
    // 17:00 -> pickup 17:15, van back 17:35. 17:14 -> ideal 17:29 but van busy to 17:35.
    const trips = suggestTrips([g('1', 'A', '17:00'), g('2', 'B', '17:14')], DEFAULT_CONFIG)
    const second = trips.find((t) => t.guests[0].id === '2')!
    expect(second.idealPickupTime).toBe('17:29')
    expect(second.pickupTime).toBe('17:35')
    expect(second.conflict).toBe(true)
  })

  it('sorts trips by pickup and numbers them 1..N', () => {
    const trips = suggestTrips([g('1', 'A', '16:00'), g('2', 'B', '08:00')], DEFAULT_CONFIG)
    expect(trips.map((t) => t.tripNo)).toEqual([1, 2])
    expect(trips[0].arrivalTime).toBe('08:00')
    expect(trips[1].arrivalTime).toBe('16:00')
  })

  it('keeps different dates separate', () => {
    const trips = suggestTrips(
      [g('1', 'A', '08:00', '2026-06-30'), g('2', 'B', '08:00', '2026-07-01')],
      DEFAULT_CONFIG,
    )
    expect(trips).toHaveLength(2)
  })
})
