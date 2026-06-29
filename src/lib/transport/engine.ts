import { Guest, TransportConfig, SuggestedTrip, TripGuest, TripVenue, ShuttleConfig, ShuttleResult, ShuttleTrip } from './types'
import { addMinutes, toMinutes, toHHMM } from './time'

// Outbound event shuttle (e.g. dinner): batch attendees into vans of `vanCapacity` and run
// waves with the single van. Wave N+1 departs once the van is back plus the load buffer.
// Attendees are sorted by agency then name so a PBT tends to ride together.
export function suggestShuttle(attendees: Guest[], cfg: ShuttleConfig, vanCapacity: number): ShuttleResult {
  const sorted = [...attendees].sort((a, b) =>
    a.agency !== b.agency ? (a.agency < b.agency ? -1 : 1) : a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )
  const trips: ShuttleTrip[] = []
  let departMin = toMinutes(cfg.departTime)
  for (let i = 0, van = 0; i < sorted.length; i += vanCapacity, van++) {
    const departTime = toHHMM(departMin)
    trips.push({
      key: `shuttle|${cfg.day}|${cfg.title}|${van}`,
      vanNo: van + 1,
      departTime,
      arriveTime: addMinutes(departTime, cfg.legMin),
      vanBackTime: addMinutes(departTime, cfg.roundTripMin),
      guests: sorted.slice(i, i + vanCapacity).map((x) => ({
        id: x.id, name: x.name, agency: x.agency, arrivalTime: '', checkedIn: x.checkedIn,
      })),
    })
    departMin += cfg.roundTripMin + cfg.bufferMin
  }
  return { ...cfg, trips }
}

export function suggestTrips(guests: Guest[], config: TransportConfig): SuggestedTrip[] {
  // Need an arrival time, and must actually need a van (Drive/Self arrange their own ride).
  const normVenue = (v?: string): TripVenue => (v === 'Airport' ? 'Airport' : 'Jetty')
  const valid = guests.filter(
    (x): x is Guest & { arrivalTime: string } =>
      x.arrivalTime != null && (x.venue ?? 'Jetty') !== 'Drive/Self',
  )

  // group by date + venue + arrival time + private tag (tagged guests get their own car)
  const groups = new Map<string, TripGuest[]>()
  for (const x of valid) {
    const tag = (x.group ?? '').trim()
    const key = `${x.arrivalDate}|${normVenue(x.venue)}|${x.arrivalTime}|${tag}`
    const list = groups.get(key) ?? []
    list.push({ id: x.id, name: x.name, agency: x.agency, arrivalTime: x.arrivalTime, checkedIn: x.checkedIn })
    groups.set(key, list)
  }

  // build raw trips (split by capacity), unscheduled
  type Raw = { date: string; venue: TripVenue; arrivalTime: string; group: string; chunk: number; guests: TripGuest[] }
  const raw: Raw[] = []
  for (const [key, list] of groups) {
    const [date, venue, arrivalTime, group] = key.split('|')
    for (let i = 0, chunk = 0; i < list.length; i += config.vanCapacity, chunk++) {
      raw.push({ date, venue: venue as TripVenue, arrivalTime, group, chunk, guests: list.slice(i, i + config.vanCapacity) })
    }
  }

  // sort by date, then ideal pickup (= arrival + buffer === same ordering as arrival), then
  // venue, then private groups after the shared pool at the same time
  raw.sort((a, b) =>
    a.date !== b.date
      ? a.date < b.date ? -1 : 1
      : a.arrivalTime !== b.arrivalTime
        ? toMinutes(a.arrivalTime) - toMinutes(b.arrivalTime)
        : a.venue !== b.venue
          ? a.venue < b.venue ? -1 : 1
          : a.group < b.group ? -1 : a.group > b.group ? 1 : 0,
  )

  // simulate a single van per date (shared across venues)
  const trips: SuggestedTrip[] = []
  let vanFreeMin = -Infinity
  let currentDate = ''
  let tripNo = 0
  for (const r of raw) {
    if (r.date !== currentDate) { vanFreeMin = -Infinity; currentDate = r.date }
    const vt = config.venue[r.venue]
    const idealPickupTime = addMinutes(r.arrivalTime, vt.bufferMin)
    const idealMin = toMinutes(idealPickupTime)
    const conflict = idealMin < vanFreeMin
    const pickupMin = conflict ? vanFreeMin : idealMin
    const pickupTime = addMinutes('00:00', pickupMin)
    const dropoffTime = addMinutes(pickupTime, vt.legMin)
    const vanBackTime = addMinutes(pickupTime, vt.roundTripMin)
    vanFreeMin = pickupMin + vt.roundTripMin
    trips.push({
      tripNo: ++tripNo,
      key: `${r.date}|${r.venue}|${r.arrivalTime}|${r.group}|${r.chunk}`,
      date: r.date,
      venue: r.venue,
      group: r.group,
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
