'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { canWrite, type Role } from '@/lib/roles'

export interface RundownItem {
  id: string
  day: string // 'YYYY-MM-DD'
  start_time: string | null
  end_time: string | null
  title: string
  location: string | null
  pic: string | null
  notes: string | null
}
export type RundownInput = Omit<RundownItem, 'id'>

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthenticated')
  return session
}
async function requireWrite() {
  const session = await requireSession()
  if (!canWrite(session.user.role as Role)) throw new Error('Unauthorized')
}

export async function getRundown(): Promise<RundownItem[]> {
  await requireSession()
  const rows = await sql`
    select id, to_char(day, 'YYYY-MM-DD') as day, start_time, end_time, title, location, pic, notes
    from rundown_items
    order by day asc, start_time asc nulls last, sort_order asc, title asc`
  return rows as RundownItem[]
}

export async function createRundownItem(input: RundownInput): Promise<void> {
  await requireWrite()
  await sql`
    insert into rundown_items (day, start_time, end_time, title, location, pic, notes)
    values (${input.day}, ${input.start_time || null}, ${input.end_time || null},
            ${input.title}, ${input.location || null}, ${input.pic || null}, ${input.notes || null})`
}

export async function updateRundownItem(id: string, input: RundownInput): Promise<void> {
  await requireWrite()
  await sql`
    update rundown_items set
      day=${input.day}, start_time=${input.start_time || null}, end_time=${input.end_time || null},
      title=${input.title}, location=${input.location || null}, pic=${input.pic || null},
      notes=${input.notes || null}, updated_at=now()
    where id=${id}`
}

export async function deleteRundownItem(id: string): Promise<void> {
  await requireWrite()
  await sql`delete from rundown_items where id=${id}`
}
