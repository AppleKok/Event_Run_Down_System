'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { canWrite, type Role } from '@/lib/roles'

export interface SessionDef {
  id: string
  name: string
  session_date: string | null
  audience: string
  items: string[]
  total: number
  present: number
}

export interface SessionGuest {
  id: string
  name: string
  agency: string | null
  room_no: string | null
  tshirt_size: string | null
  present: boolean
  collected: string[]
  present_at: string | null
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
function actor(s: Awaited<ReturnType<typeof requireWrite>>): string {
  return s.user.name || s.user.email || 'committee'
}

// Count of guests matching an audience ('participants' | 'committee' | 'all'), excluding cancelled.
function audienceMatch(audience: string, category: string): boolean {
  if (audience === 'all') return true
  if (audience === 'committee') return category === 'committee'
  return category !== 'committee' // participants
}

export async function getSessions(): Promise<SessionDef[]> {
  await requireSession()
  const sessions = (await sql`
    select id, name, to_char(session_date,'YYYY-MM-DD') as session_date, audience, items, sort_order
    from event_sessions order by sort_order, session_date`) as (Omit<SessionDef,'total'|'present'> & { sort_order: number })[]
  const guests = (await sql`select category from guests where coalesce(transport_status,'') <> 'Cancelled'`) as { category: string }[]
  const present = (await sql`select session_id, count(*)::int n from session_attendance where present group by session_id`) as { session_id: string; n: number }[]
  const pmap = new Map(present.map((p) => [p.session_id, p.n]))
  return sessions.map((s) => ({
    ...s,
    total: guests.filter((g) => audienceMatch(s.audience, g.category)).length,
    present: pmap.get(s.id) ?? 0,
  }))
}

export async function getSessionRoster(sessionId: string): Promise<{ session: SessionDef; roster: SessionGuest[] }> {
  await requireSession()
  const s = (await sql`
    select id, name, to_char(session_date,'YYYY-MM-DD') as session_date, audience, items
    from event_sessions where id=${sessionId}`)[0] as Omit<SessionDef,'total'|'present'> | undefined
  if (!s) throw new Error('Session not found')

  const guests = (await sql`
    select id, name, agency, room_no, tshirt_size, category from guests
    where coalesce(transport_status,'') <> 'Cancelled'
    order by agency asc nulls last, name asc`) as { id: string; name: string; agency: string | null; room_no: string | null; tshirt_size: string | null; category: string }[]
  const att = (await sql`
    select guest_id, present, collected, to_char(present_at,'YYYY-MM-DD HH24:MI') as present_at
    from session_attendance where session_id=${sessionId}`) as { guest_id: string; present: boolean; collected: string[]; present_at: string | null }[]
  const amap = new Map(att.map((a) => [a.guest_id, a]))

  const roster: SessionGuest[] = guests
    .filter((g) => audienceMatch(s.audience, g.category))
    .map((g) => {
      const a = amap.get(g.id)
      return {
        id: g.id, name: g.name, agency: g.agency, room_no: g.room_no, tshirt_size: g.tshirt_size,
        present: a?.present ?? false, collected: a?.collected ?? [], present_at: a?.present_at ?? null,
      }
    })
  return {
    session: { ...s, total: roster.length, present: roster.filter((r) => r.present).length },
    roster,
  }
}

export async function setPresent(sessionId: string, guestId: string, present: boolean): Promise<void> {
  const s = await requireWrite()
  await sql`
    insert into session_attendance (session_id, guest_id, present, present_at, marked_by)
    values (${sessionId}, ${guestId}, ${present}, ${present ? new Date() : null}, ${actor(s)})
    on conflict (session_id, guest_id) do update
      set present=${present}, present_at=${present ? new Date() : null}, marked_by=${actor(s)}`
}

// Replace the collected-items list for a guest; collecting anything also marks them present.
export async function setCollected(sessionId: string, guestId: string, items: string[]): Promise<void> {
  const s = await requireWrite()
  const present = items.length > 0
  await sql`
    insert into session_attendance (session_id, guest_id, present, present_at, marked_by, collected)
    values (${sessionId}, ${guestId}, ${present}, ${present ? new Date() : null}, ${actor(s)}, ${items})
    on conflict (session_id, guest_id) do update
      set collected=${items},
          present = session_attendance.present or ${present},
          present_at = coalesce(session_attendance.present_at, ${present ? new Date() : null}),
          marked_by=${actor(s)}`
}

// Shirt size is a guest property (one per person), shown in the Guest list as
// "Size T-Shirt" (guests.tshirt_size). Editing it here updates the guest everywhere.
export async function setShirtSize(guestId: string, size: string): Promise<void> {
  await requireWrite()
  await sql`update guests set tshirt_size=${size || null}, updated_at=now() where id=${guestId}`
}
