'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { getTasks, updateTask, deleteTask, type CommitteeTask } from '@/lib/actions/tasks'
import { PageHeader, Card, EmptyState, Chip, Stat, btnPrimary, btnGhost } from '@/components/ui'
import { IconPlus, IconUser, IconEdit, IconTrash } from '@/components/icons'
import { TaskForm } from './task-form'

const GROUP_ORDER = ['In Progress', 'Todo', 'Blocked', 'Done'] as const

function fmtDay(iso: string): string {
  const [, m, d] = iso.split('-')
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${Number(d)} ${months[Number(m)] ?? ''}`.trim()
}
function todayISO(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

export default function TasksPage() {
  const { data: tasks = [], mutate } = useSWR('tasks', () => getTasks(), { refreshInterval: 8000, revalidateOnFocus: true })
  const [editing, setEditing] = useState<CommitteeTask | null>(null)
  const [adding, setAdding] = useState(false)
  const today = todayISO()

  const groups: Record<string, CommitteeTask[]> = {}
  for (const t of tasks) (groups[t.status] ??= []).push(t)
  const visibleGroups = GROUP_ORDER.filter((s) => groups[s]?.length)

  const open = tasks.filter((t) => t.status !== 'Done').length
  const done = tasks.filter((t) => t.status === 'Done').length
  const blocked = tasks.filter((t) => t.status === 'Blocked').length

  async function toggleDone(t: CommitteeTask) {
    const { id, ...input } = t
    await updateTask(id, { ...input, status: t.status === 'Done' ? 'Todo' : 'Done' })
    mutate()
  }
  async function remove(t: CommitteeTask) {
    if (!confirm(`Delete "${t.title}"?`)) return
    await deleteTask(t.id)
    mutate()
  }

  return (
    <div>
      <PageHeader
        title="Committee Tasks"
        subtitle="Penyediaan & tugasan — who's doing what before the event"
        actions={
          <button onClick={() => { setAdding(true); setEditing(null) }} className={btnPrimary}>
            <IconPlus className="w-4 h-4" /> Add task
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat accent label="Open" value={open} hint="not done" />
        <Stat label="Done" value={done} hint="completed" />
        <Stat label="Blocked" value={blocked} hint="needs attention" />
      </div>

      {adding && <TaskForm onDone={() => { setAdding(false); mutate() }} />}
      {editing && <TaskForm initial={editing} onDone={() => { setEditing(null); mutate() }} />}

      {tasks.length === 0 && !adding ? (
        <EmptyState
          title="No tasks yet"
          hint="Add the committee's prep tasks to start tracking who does what."
          action={<button onClick={() => setAdding(true)} className={btnPrimary}><IconPlus className="w-4 h-4" /> Add task</button>}
        />
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((status) => (
            <section key={status}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <h2 className="text-sm font-semibold text-slate-700">{status}</h2>
                <Chip>{groups[status].length}</Chip>
              </div>
              <Card>
                <ul className="divide-y divide-slate-100">
                  {groups[status].map((t) => {
                    const overdue = t.status !== 'Done' && t.due_date && t.due_date < today
                    return (
                      <li key={t.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/60 transition-colors group">
                        <button
                          onClick={() => toggleDone(t)}
                          title={t.status === 'Done' ? 'Mark as not done' : 'Mark done'}
                          className={`w-5 h-5 shrink-0 rounded-full border-2 grid place-items-center transition-colors ${
                            t.status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-blue-400'
                          }`}
                        >
                          {t.status === 'Done' && (
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${t.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</div>
                          {t.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{t.notes}</p>}
                        </div>
                        {t.category && <Chip className="hidden sm:inline-flex">{t.category}</Chip>}
                        {t.pic && (
                          <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500 w-24 truncate">
                            <IconUser className="w-3.5 h-3.5 text-slate-400" />{t.pic}
                          </span>
                        )}
                        <span className={`text-xs w-16 text-right tabular-nums ${overdue ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                          {t.due_date ? fmtDay(t.due_date) : '—'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 no-print sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditing(t); setAdding(false) }} className={btnGhost} title="Edit"><IconEdit className="w-4 h-4" /></button>
                          <button onClick={() => remove(t)} className={`${btnGhost} hover:text-red-600`} title="Delete"><IconTrash className="w-4 h-4" /></button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
