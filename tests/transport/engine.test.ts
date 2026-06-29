import { describe, it, expect } from 'vitest'
import { suggestTrips, suggestShuttle } from '../../src/lib/transport/engine'
import { DEFAULT_CONFIG, Guest, type ShuttleConfig } from '../../src/lib/transport/types'

const g = (id: string, name: string, time: string | null, date = '2026-06-30'): Guest =>
  ({ id, name, agency: 'X', arrivalDate: date, arrivalTime: time })

describe('suggestTrips', () => {
  it('ignores guests with no arrival time', () => {
    const trips = suggestTrips([g('1', 'A', null)], DEFAULT_CONFIG)
    expect(trips).toHaveLength(0)
  })

  it('one Jetty guest -> pickup = arrival + 15, dropoff +8, van back +20', () => {
    const [t] = suggestTrips([g('1', 'A', '15:00')], DEFAULT_CONFIG)
    expect(t.venue).toBe('Jetty')
    expect(t.pickupTime).toBe('15:15')
    expect(t.dropoffTime).toBe('15:23')
    expect(t.vanBackTime).toBe('15:35')
    expect(t.conflict).toBe(false)
    expect(t.guests.map((x) => x.id)).toEqual(['1'])
  })

  it('Airport trips use the longer drive leg and round-trip', () => {
    const ag: Guest = { id: '1', name: 'A', agency: 'X', arrivalDate: '2026-06-30', arrivalTime: '10:00', venue: 'Airport' }
    const [t] = suggestTrips([ag], DEFAULT_CONFIG)
    expect(t.venue).toBe('Airport')
    expect(t.pickupTime).toBe('10:20')   // +20 buffer
    expect(t.dropoffTime).toBe('10:48')  // +28 drive
    expect(t.vanBackTime).toBe('11:20')  // +60 round trip
  })

  it('excludes self-drive guests from van trips', () => {
    const sd: Guest = { id: '1', name: 'A', agency: 'X', arrivalDate: '2026-06-30', arrivalTime: '10:00', venue: 'Drive/Self' }
    expect(suggestTrips([sd], DEFAULT_CONFIG)).toHaveLength(0)
  })

  it('keeps Jetty and Airport groups arriving at the same time as separate trips', () => {
    const trips = suggestTrips([
      { id: '1', name: 'A', agency: 'X', arrivalDate: '2026-06-30', arrivalTime: '09:00', venue: 'Jetty' },
      { id: '2', name: 'B', agency: 'X', arrivalDate: '2026-06-30', arrivalTime: '09:00', venue: 'Airport' },
    ], DEFAULT_CONFIG)
    expect(trips).toHaveLength(2)
    expect(new Set(trips.map((t) => t.venue))).toEqual(new Set(['Jetty', 'Airport']))
  })

  it('splits a private group into its own car, separate from the same-time pool', () => {
    const trips = suggestTrips([
      { id: '1', name: 'Pool A', agency: 'X', arrivalDate: '2026-06-30', arrivalTime: '11:00', venue: 'Jetty' },
      { id: '2', name: 'Pool B', agency: 'X', arrivalDate: '2026-06-30', arrivalTime: '11:00', venue: 'Jetty' },
      { id: '3', name: 'Fam 1', agency: 'X', arrivalDate: '2026-06-30', arrivalTime: '11:00', venue: 'Jetty', group: 'Fam' },
      { id: '4', name: 'Fam 2', agency: 'X', arrivalDate: '2026-06-30', arrivalTime: '11:00', venue: 'Jetty', group: 'Fam' },
    ], DEFAULT_CONFIG)
    expect(trips).toHaveLength(2)
    const fam = trips.find((t) => t.group === 'Fam')!
    expect(fam.guests.map((g) => g.id).sort()).toEqual(['3', '4'])
    const pool = trips.find((t) => t.group === '')!
    expect(pool.guests.map((g) => g.id).sort()).toEqual(['1', '2'])
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

describe('suggestShuttle', () => {
  const cfg: ShuttleConfig = { day: '2026-07-01', departTime: '20:00', title: 'Dinner', destination: 'RT Restaurant', legMin: 5, roundTripMin: 10, bufferMin: 5 }
  const mk = (n: number): Guest[] =>
    Array.from({ length: n }, (_, i) => ({ id: String(i), name: `G${String(i).padStart(2, '0')}`, agency: 'X', arrivalDate: '', arrivalTime: null }))

  it('batches attendees into vans of capacity', () => {
    const { trips } = suggestShuttle(mk(35), cfg, 10)
    expect(trips.map((t) => t.guests.length)).toEqual([10, 10, 10, 5])
    expect(trips.map((t) => t.vanNo)).toEqual([1, 2, 3, 4])
  })

  it('staggers departures by round-trip + buffer, drive sets arrival', () => {
    const { trips } = suggestShuttle(mk(35), cfg, 10)
    expect(trips.map((t) => t.departTime)).toEqual(['20:00', '20:15', '20:30', '20:45'])
    expect(trips[0].arriveTime).toBe('20:05')   // +5 drive
    expect(trips[0].vanBackTime).toBe('20:10')  // +10 round trip
  })

})
