'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { canWrite, type Role } from '@/lib/roles'

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

export interface TripStatus {
  trip_key: string
  completed_at: string | null
  completed_by: string | null
}

// Trips are computed live, so completion is keyed by the engine's stable trip key.
export async function getTripStatuses(): Promise<TripStatus[]> {
  await requireSession()
  const rows = await sql`
    select trip_key, to_char(completed_at, 'DD/MM/YY HH24:MI') as completed_at, completed_by
    from trip_status where completed_at is not null`
  return rows as TripStatus[]
}

export async function setTripCompleted(tripKey: string, completed: boolean): Promise<void> {
  const session = await requireWrite()
  const actor = session.user.name || session.user.email || 'committee'
  if (completed) {
    await sql`
      insert into trip_status (trip_key, completed_at, completed_by, updated_at)
      values (${tripKey}, now(), ${actor}, now())
      on conflict (trip_key) do update
        set completed_at = now(), completed_by = ${actor}, updated_at = now()`
  } else {
    await sql`
      insert into trip_status (trip_key, completed_at, completed_by, updated_at)
      values (${tripKey}, null, null, now())
      on conflict (trip_key) do update
        set completed_at = null, completed_by = null, updated_at = now()`
  }
}
