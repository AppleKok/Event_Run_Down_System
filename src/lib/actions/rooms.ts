'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import type { GuestRow } from '@/lib/actions/guests'

const TOTAL_ROOMS = 30

// Hotel status (room-based): a guest with a room assigned is "Checked in"; a checkout timestamp wins.
export type RoomStatus = 'Not checked in' | 'Checked in' | 'Checked out'

// A guest row with their event-level attendance, for the rooms view.
export type RoomGuest = GuestRow & {
  checked_in_at: string | null
  checked_out_at: string | null
  status: RoomStatus
}

export interface RoomsOverview {
  guests: RoomGuest[]
  totalRooms: number
  occupiedRooms: number // distinct assigned rooms with ≥1 guest checked in (on site)
  checkedOutRooms: number // assigned rooms where every occupant has checked out
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthenticated')
  return session
}

function isAssigned(roomNo: string | null): boolean {
  const v = (roomNo ?? '').trim().toLowerCase()
  return v !== '' && v !== 'no room'
}

export async function getRoomsOverview(): Promise<RoomsOverview> {
  await requireSession()
  const rows = (await sql`
    select id, name, agency, ic_no, gender, room_no, roommate,
           to_char(arrival_date, 'YYYY-MM-DD') as arrival_date, arrival_time,
           tshirt_size, food_allergy, transport_status, pic, category,
           to_char(checked_in_at,  'YYYY-MM-DD HH24:MI') as checked_in_at,
           to_char(checked_out_at, 'YYYY-MM-DD HH24:MI') as checked_out_at
    from guests order by agency asc nulls last, arrival_time asc nulls last, name`) as Omit<RoomGuest, 'status'>[]

  const guests: RoomGuest[] = rows.map((r) => ({
    ...r,
    status: r.checked_out_at ? 'Checked out' : isAssigned(r.room_no) ? 'Checked in' : 'Not checked in',
  }))

  // Roll hotel status up to the room level.
  const byRoom = new Map<string, RoomGuest[]>()
  for (const g of guests) {
    if (!isAssigned(g.room_no)) continue
    const key = g.room_no!.trim()
    const list = byRoom.get(key) ?? []
    list.push(g)
    byRoom.set(key, list)
  }
  let occupiedRooms = 0
  let checkedOutRooms = 0
  for (const occ of byRoom.values()) {
    if (occ.every((g) => g.checked_out_at)) checkedOutRooms++ // fully vacated
    else occupiedRooms++ // someone still in
  }

  return { guests, totalRooms: TOTAL_ROOMS, occupiedRooms, checkedOutRooms }
}
