import { Guest, TransportConfig, SuggestedTrip, TripGuest } from './types'
import { addMinutes, toMinutes } from './time'

export function suggestTrips(guests: Guest[], config: TransportConfig): SuggestedTrip[] {
  const valid = guests.filter((x): x is Guest & { arrivalTime: string } => x.arrivalTime != null)

  // group by date + arrival time
  const groups = new Map<string, TripGuest[]>()
  for (const x of valid) {
    const key = `${x.arrivalDate}|${x.arrivalTime}`
    const list = groups.get(key) ?? []
    list.push({ id: x.id, name: x.name, agency: x.agency, arrivalTime: x.arrivalTime })
    groups.set(key, list)
  }

  // build raw trips (split by capacity), unscheduled
  type Raw = { date: string; arrivalTime: string; guests: TripGuest[] }
  const raw: Raw[] = []
  for (const [key, list] of groups) {
    const [date, arrivalTime] = key.split('|')
    for (let i = 0; i < list.length; i += config.vanCapacity) {
      raw.push({ date, arrivalTime, guests: list.slice(i, i + config.vanCapacity) })
    }
  }

  // sort by date, then ideal pickup (= arrival + buffer === same ordering as arrival)
  raw.sort((a, b) =>
    a.date === b.date
      ? toMinutes(a.arrivalTime) - toMinutes(b.arrivalTime)
      : a.date < b.date ? -1 : 1,
  )

  // simulate a single van per date
  const trips: SuggestedTrip[] = []
  let vanFreeMin = -Infinity
  let currentDate = ''
  let tripNo = 0
  for (const r of raw) {
    if (r.date !== currentDate) { vanFreeMin = -Infinity; currentDate = r.date }
    const idealPickupTime = addMinutes(r.arrivalTime, config.bufferMin)
    const idealMin = toMinutes(idealPickupTime)
    const conflict = idealMin < vanFreeMin
    const pickupMin = conflict ? vanFreeMin : idealMin
    const pickupTime = addMinutes('00:00', pickupMin)
    const dropoffTime = addMinutes(pickupTime, config.legMin)
    const vanBackTime = addMinutes(pickupTime, config.roundTripMin)
    vanFreeMin = pickupMin + config.roundTripMin
    trips.push({
      tripNo: ++tripNo,
      date: r.date,
      arrivalTime: r.arrivalTime,
      idealPickupTime,
      pickupTime,
      dropoffTime,
      vanBackTime,
      guests: r.guests,
      conflict,
    })
  }
  return trips
}
