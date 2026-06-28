'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { canWrite, type Role } from '@/lib/roles'

export const TASK_STATUSES = ['Todo', 'In Progress', 'Blocked', 'Done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export interface CommitteeTask {
  id: string
  title: string
  category: string | null
  pic: string | null
  due_date: string | null // 'YYYY-MM-DD'
  status: string
  notes: string | null
}
export type TaskInput = Omit<CommitteeTask, 'id'>

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthenticated')
  return session
}
async function requireWrite() {
  const session = await requireSession()
  if (!canWrite(session.user.role as Role)) throw new Error('Unauthorized')
}

export async function getTasks(): Promise<CommitteeTask[]> {
  await requireSession()
  const rows = await sql`
    select id, title, category, pic, to_char(due_date, 'YYYY-MM-DD') as due_date, status, notes
    from committee_tasks
    order by due_date asc nulls last, created_at asc`
  return rows as CommitteeTask[]
}

export async function createTask(input: TaskInput): Promise<void> {
  await requireWrite()
  await sql`
    insert into committee_tasks (title, category, pic, due_date, status, notes)
    values (${input.title}, ${input.category || null}, ${input.pic || null},
            ${input.due_date || null}, ${input.status || 'Todo'}, ${input.notes || null})`
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  await requireWrite()
  await sql`
    update committee_tasks set
      title=${input.title}, category=${input.category || null}, pic=${input.pic || null},
      due_date=${input.due_date || null}, status=${input.status || 'Todo'},
      notes=${input.notes || null}, updated_at=now()
    where id=${id}`
}

export async function deleteTask(id: string): Promise<void> {
  await requireWrite()
  await sql`delete from committee_tasks where id=${id}`
}
