'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { canWrite, type Role } from '@/lib/roles'

export interface GuestRow {
  id: string
  name: string
  agency: string | null
  ic_no: string | null
  gender: string | null
  room_no: string | null
  roommate: string | null
  arrival_date: string | null
  arrival_time: string | null
  tshirt_size: string | null
  food_allergy: string | null
  transport_status: string
  pic: string | null
  category: string
}
export type GuestInput = Omit<GuestRow, 'id' | 'category'>

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthenticated')
  return session
}
async function requireWrite() {
  const session = await requireSession()
  if (!canWrite(session.user.role as Role)) throw new Error('Unauthorized')
}

export async function getGuests(): Promise<GuestRow[]> {
  await requireSession()
  const rows = await sql`
    select id, name, agency, ic_no, gender, room_no, roommate,
           to_char(arrival_date, 'YYYY-MM-DD') as arrival_date, arrival_time,
           tshirt_size, food_allergy, transport_status, pic, category
    from guests order by agency asc nulls last, arrival_time asc nulls last, name`
  return rows as GuestRow[]
}
// checked_in = arrival check-in done (synced from the Attendance page) → drives the blue
// "passenger present" highlight on the Transport page.
export type TransportGuestRow = Pick<GuestRow, 'id' | 'name' | 'agency' | 'arrival_date' | 'arrival_time' | 'category'> & { checked_in: boolean; arrival_venue: string; transport_group: string | null }
export async function getTransportGuests(): Promise<TransportGuestRow[]> {
  await requireSession()
  const rows = await sql`
    select id, name, agency, to_char(arrival_date, 'YYYY-MM-DD') as arrival_date, arrival_time,
           checked_in_at is not null as checked_in, arrival_venue, transport_group, category
    from guests`
  return rows as TransportGuestRow[]
}
export async function createGuest(input: GuestInput): Promise<GuestRow> {
  await requireWrite()
  const rows = await sql`
    insert into guests (name, agency, ic_no, gender, room_no, roommate,
                        arrival_date, arrival_time, tshirt_size, food_allergy, transport_status, pic)
    values (${input.name}, ${input.agency ?? null}, ${input.ic_no || null}, ${input.gender || null},
            ${input.room_no || null}, ${input.roommate || null},
            ${input.arrival_date ?? null}, ${input.arrival_time || null},
            ${input.tshirt_size || null}, ${input.food_allergy || null}, ${input.transport_status}, ${input.pic || null})
    returning id, name, agency, ic_no, gender, room_no, roommate,
              to_char(arrival_date, 'YYYY-MM-DD') as arrival_date, arrival_time, tshirt_size, food_allergy, transport_status, pic, category`
  return rows[0] as GuestRow
}
// Fast path for the Guests table's inline Room No. editor — avoids round-tripping a full GuestInput.
// Twin-room rule: a real room number may hold at most 2 guests; a 3rd assignment is rejected.
// ("No room" / blank are unlimited — they aren't real rooms.)
export async function assignRoom(id: string, roomNo: string): Promise<void> {
  await requireWrite()
  const room = roomNo.trim()
  const isRealRoom = room !== '' && room.toLowerCase() !== 'no room'
  if (isRealRoom) {
    const [{ n }] = (await sql`
      select count(*)::int as n from guests
      where id <> ${id} and lower(btrim(room_no)) = ${room.toLowerCase()}`) as { n: number }[]
    if (n >= 2) throw new Error(`Room ${room} is full (max 2 pax — twin).`)
  }
  const rows = await sql`
    update guests set room_no=${room || null}, updated_at=now()
    where id=${id} returning id`
  if (!rows[0]) throw new Error('Guest not found')
}
export async function updateGuest(id: string, input: GuestInput): Promise<GuestRow> {
  await requireWrite()
  const rows = await sql`
    update guests set
      name=${input.name}, agency=${input.agency ?? null}, ic_no=${input.ic_no || null},
      gender=${input.gender || null}, room_no=${input.room_no || null},
      roommate=${input.roommate || null}, arrival_date=${input.arrival_date ?? null},
      arrival_time=${input.arrival_time || null}, tshirt_size=${input.tshirt_size || null},
      food_allergy=${input.food_allergy || null}, transport_status=${input.transport_status},
      pic=${input.pic || null}, updated_at=now()
    where id=${id} returning id, name, agency, ic_no, gender, room_no, roommate,
              to_char(arrival_date, 'YYYY-MM-DD') as arrival_date, arrival_time, tshirt_size, food_allergy, transport_status, pic, category`
  if (!rows[0]) throw new Error('Guest not found')
  return rows[0] as GuestRow
}
