'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { canWrite, type Role } from '@/lib/roles'

export type AttendanceStatus = 'Not arrived' | 'On site' | 'Departed'
export type ArrivalVenue = 'Jetty' | 'Airport' | 'Drive/Self'
// Not exported (a 'use server' file may only export async functions); the page has its own copy.
const ARRIVAL_VENUES: ArrivalVenue[] = ['Jetty', 'Airport', 'Drive/Self']

export interface AttendanceRow {
  id: string
  name: string
  agency: string | null
  room_no: string | null
  arrival_venue: ArrivalVenue
  arrival_time: string | null
  checked_in_at: string | null
  checked_out_at: string | null
  checked_in_by: string | null
  checked_out_by: string | null
  status: AttendanceStatus
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthenticated')
  return session
}
async function requireWrite() {
  const session = await requireSession()
  if (!canWrite(session.user.role as Role)) throw new Error('Unauthorized')
  return session
}
// Who is performing the action — for the light audit columns.
function actor(session: Awaited<ReturnType<typeof requireWrite>>): string {
  return session.user.name || session.user.email || 'committee'
}

export async function getAttendance(): Promise<AttendanceRow[]> {
  await requireSession()
  const rows = await sql`
    select id, name, agency, room_no, arrival_venue, arrival_time,
           to_char(checked_in_at,  'DD/MM/YY HH24:MI') as checked_in_at,
           to_char(checked_out_at, 'DD/MM/YY HH24:MI') as checked_out_at,
           checked_in_by, checked_out_by,
           case when checked_out_at is not null then 'Departed'
                when checked_in_at  is not null then 'On site'
                else 'Not arrived' end as status
    from guests
    order by agency asc nulls last, name asc`
  return rows as AttendanceRow[]
}

// Where the guest entered Langkawi. Defaults to 'Jetty'; committee can switch to 'Airport'.
export async function setArrivalVenue(id: string, venue: ArrivalVenue): Promise<AttendanceRow> {
  await requireWrite()
  if (!ARRIVAL_VENUES.includes(venue)) throw new Error('Invalid venue')
  const rows = await sql`
    update guests set arrival_venue = ${venue}, updated_at = now()
    where id = ${id}
    returning id, name, agency, room_no, arrival_venue, arrival_time,
              to_char(checked_in_at,  'DD/MM/YY HH24:MI') as checked_in_at,
              to_char(checked_out_at, 'DD/MM/YY HH24:MI') as checked_out_at,
              checked_in_by, checked_out_by,
              case when checked_out_at is not null then 'Departed'
                   when checked_in_at  is not null then 'On site'
                   else 'Not arrived' end as status`
  if (!rows[0]) throw new Error('Guest not found')
  return rows[0] as AttendanceRow
}

export async function checkIn(id: string): Promise<AttendanceRow> {
  const session = await requireWrite()
  const rows = await sql`
    update guests set checked_in_at = now(), checked_in_by = ${actor(session)}, updated_at = now()
    where id = ${id}
    returning id, name, agency, room_no, arrival_venue, arrival_time,
              to_char(checked_in_at,  'DD/MM/YY HH24:MI') as checked_in_at,
              to_char(checked_out_at, 'DD/MM/YY HH24:MI') as checked_out_at,
              checked_in_by, checked_out_by,
              case when checked_out_at is not null then 'Departed'
                   when checked_in_at  is not null then 'On site'
                   else 'Not arrived' end as status`
  if (!rows[0]) throw new Error('Guest not found')
  return rows[0] as AttendanceRow
}

export async function checkOut(id: string): Promise<AttendanceRow> {
  const session = await requireWrite()
  const rows = await sql`
    update guests set checked_out_at = now(), checked_out_by = ${actor(session)}, updated_at = now()
    where id = ${id}
    returning id, name, agency, room_no, arrival_venue, arrival_time,
              to_char(checked_in_at,  'DD/MM/YY HH24:MI') as checked_in_at,
              to_char(checked_out_at, 'DD/MM/YY HH24:MI') as checked_out_at,
              checked_in_by, checked_out_by,
              case when checked_out_at is not null then 'Departed'
                   when checked_in_at  is not null then 'On site'
                   else 'Not arrived' end as status`
  if (!rows[0]) throw new Error('Guest not found')
  return rows[0] as AttendanceRow
}

// Correct a mistaken check-in: clears both timestamps (a checkout without a check-in is meaningless).
export async function undoCheckIn(id: string): Promise<AttendanceRow> {
  await requireWrite()
  const rows = await sql`
    update guests set checked_in_at = null, checked_in_by = null,
                      checked_out_at = null, checked_out_by = null, updated_at = now()
    where id = ${id}
    returning id, name, agency, room_no, arrival_venue, arrival_time,
              to_char(checked_in_at,  'DD/MM/YY HH24:MI') as checked_in_at,
              to_char(checked_out_at, 'DD/MM/YY HH24:MI') as checked_out_at,
              checked_in_by, checked_out_by,
              case when checked_out_at is not null then 'Departed'
                   when checked_in_at  is not null then 'On site'
                   else 'Not arrived' end as status`
  if (!rows[0]) throw new Error('Guest not found')
  return rows[0] as AttendanceRow
}

// Correct a mistaken check-out: keeps the guest On site.
export async function undoCheckOut(id: string): Promise<AttendanceRow> {
  await requireWrite()
  const rows = await sql`
    update guests set checked_out_at = null, checked_out_by = null, updated_at = now()
    where id = ${id}
    returning id, name, agency, room_no, arrival_venue, arrival_time,
              to_char(checked_in_at,  'DD/MM/YY HH24:MI') as checked_in_at,
              to_char(checked_out_at, 'DD/MM/YY HH24:MI') as checked_out_at,
              checked_in_by, checked_out_by,
              case when checked_out_at is not null then 'Departed'
                   when checked_in_at  is not null then 'On site'
                   else 'Not arrived' end as status`
  if (!rows[0]) throw new Error('Guest not found')
  return rows[0] as AttendanceRow
}
