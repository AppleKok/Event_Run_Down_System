export interface Guest {
  id: string
  name: string
  agency: string
  arrivalDate: string          // 'YYYY-MM-DD'
  arrivalTime: string | null   // 'HH:MM' (time at jetty) or null if unknown
}

export interface TransportConfig {
  bufferMin: number      // default 15
  legMin: number         // default 10 (jetty -> hotel)
  roundTripMin: number   // default 20 (van free again)
  vanCapacity: number    // default 10
}

export interface TripGuest { id: string; name: string; agency: string; arrivalTime: string }

export interface SuggestedTrip {
  tripNo: number
  date: string             // 'YYYY-MM-DD'
  arrivalTime: string      // latest arrival in the group
  idealPickupTime: string  // arrivalTime + buffer
  pickupTime: string       // ideal, pushed later if the single van is still out
  dropoffTime: string      // pickupTime + legMin
  vanBackTime: string      // pickupTime + roundTripMin
  guests: TripGuest[]
  conflict: boolean        // pickup was delayed past ideal
}

export const DEFAULT_CONFIG: TransportConfig = {
  bufferMin: 15, legMin: 10, roundTripMin: 20, vanCapacity: 10,
}
