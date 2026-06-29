// Where the guest enters Langkawi. Drive/Self arrange their own ride → no van needed.
export type TripVenue = 'Jetty' | 'Airport'

export interface Guest {
  id: string
  name: string
  agency: string
  arrivalDate: string          // 'YYYY-MM-DD'
  arrivalTime: string | null   // 'HH:MM' (time at jetty) or null if unknown
  checkedIn?: boolean          // arrival check-in done (from Attendance) → passenger present
  venue?: string               // 'Jetty' | 'Airport' | 'Drive/Self'; Drive/Self skip transport
  group?: string | null        // private-pickup tag; same tag = own car, split from the pool
  category?: string            // 'participant' | 'committee'; shuttles carry participants only
}

// Timing is per pickup point: the Airport is ~22 km from Bayview, the Jetty only ~2.5 km,
// so their drive legs (and therefore when the single van is "still out") differ a lot.
export interface VenueTiming {
  bufferMin: number      // arrival -> ready for pickup (disembark, luggage, gather the group)
  legMin: number         // drive: pickup point -> Bayview
  roundTripMin: number   // van free again ≈ legMin there + legMin back + short dwell
}

export interface TransportConfig {
  vanCapacity: number                        // default 10
  venue: Record<TripVenue, VenueTiming>
}

export interface TripGuest { id: string; name: string; agency: string; arrivalTime: string; checkedIn?: boolean }

export interface SuggestedTrip {
  tripNo: number
  key: string              // stable id for persistence: "date|venue|arrivalTime|group|chunk"
  date: string             // 'YYYY-MM-DD'
  venue: TripVenue         // pickup point: Kuah Jetty or Langkawi Airport
  group: string            // private-pickup tag, '' for the shared pool
  arrivalTime: string      // latest arrival in the group
  idealPickupTime: string  // arrivalTime + buffer
  pickupTime: string       // ideal, pushed later if the single van is still out
  dropoffTime: string      // pickupTime + legMin
  vanBackTime: string      // pickupTime + roundTripMin
  guests: TripGuest[]
  conflict: boolean        // pickup was delayed past ideal
}

export const DEFAULT_CONFIG: TransportConfig = {
  vanCapacity: 10,
  venue: {
    // Kuah Jetty (Jetty Point) -> Bayview: ~2.5 km through Kuah town, ~8 min each way.
    Jetty:   { bufferMin: 15, legMin: 8,  roundTripMin: 20 },
    // Langkawi Airport (Padang Matsirat) -> Bayview: ~22 km, ~28 min each way;
    // larger buffer for deplaning + baggage claim.
    Airport: { bufferMin: 20, legMin: 28, roundTripMin: 60 },
  },
}

// An outbound group shuttle from Bayview to an event venue (e.g. dinner). Unlike arrival
// pickups, everyone leaves from the hotel for one event; the single van runs waves until all
// attendees are ferried (departures spaced by roundTripMin + bufferMin).
export interface ShuttleConfig {
  day: string            // 'YYYY-MM-DD'
  departTime: string     // first van departs, 'HH:MM'
  title: string          // 'Dinner'
  destination: string    // 'RT Restaurant'
  legMin: number         // drive one way, hotel -> venue
  roundTripMin: number   // van back at the hotel ≈ 2 × legMin
  bufferMin: number      // load/unload gap before the next wave departs
}

export interface ShuttleTrip {
  key: string            // stable id for persistence: "shuttle|day|title|van"
  vanNo: number          // 1..N within this shuttle
  departTime: string     // leaves Bayview
  arriveTime: string     // departTime + legMin
  vanBackTime: string    // departTime + roundTripMin (van free for the next wave)
  guests: TripGuest[]
}

export interface ShuttleResult extends ShuttleConfig {
  trips: ShuttleTrip[]
}

export const EVENT_SHUTTLES: ShuttleConfig[] = [
  // Day 2 dinner: all PBT from Bayview to RT Restaurant; 5 min each way, ~10 min round trip.
  { day: '2026-07-01', departTime: '20:00', title: 'Dinner', destination: 'RT Restaurant', legMin: 5, roundTripMin: 10, bufferMin: 5 },
]
