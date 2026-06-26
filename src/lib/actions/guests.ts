'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { canWrite, type Role } from '@/lib/roles'

export interface GuestRow {
  id: string
  name: string
  agency: string | null
  arrival_date: string | null
  arrival_time: string | null
  tshirt_size: string | null
  food_allergy: string | null
  transport_status: string
  pic: string | null
}
export type GuestInput = Omit<GuestRow, 'id'>

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
  const rows = await sql`select * from guests order by arrival_date asc nulls last, arrival_time asc nulls last`
  return rows as GuestRow[]
}
export async function getTransportGuests(): Promise<Pick<GuestRow, 'id' | 'name' | 'agency' | 'arrival_date' | 'arrival_time'>[]> {
  await requireSession()
  const rows = await sql`select id, name, agency, arrival_date, arrival_time from guests`
  return rows as Pick<GuestRow, 'id' | 'name' | 'agency' | 'arrival_date' | 'arrival_time'>[]
}
export async function createGuest(input: GuestInput): Promise<GuestRow> {
  await requireWrite()
  const rows = await sql`
    insert into guests (name, agency, arrival_date, arrival_time, tshirt_size, food_allergy, transport_status, pic)
    values (${input.name}, ${input.agency ?? null}, ${input.arrival_date ?? null}, ${input.arrival_time || null},
            ${input.tshirt_size || null}, ${input.food_allergy || null}, ${input.transport_status}, ${input.pic || null})
    returning *`
  return rows[0] as GuestRow
}
export async function updateGuest(id: string, input: GuestInput): Promise<GuestRow> {
  await requireWrite()
  const rows = await sql`
    update guests set
      name=${input.name}, agency=${input.agency ?? null}, arrival_date=${input.arrival_date ?? null},
      arrival_time=${input.arrival_time || null}, tshirt_size=${input.tshirt_size || null},
      food_allergy=${input.food_allergy || null}, transport_status=${input.transport_status},
      pic=${input.pic || null}, updated_at=now()
    where id=${id} returning *`
  if (!rows[0]) throw new Error('Guest not found')
  return rows[0] as GuestRow
}
