'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { getRundown, deleteRundownItem, type RundownItem } from '@/lib/actions/rundown'
import { PageHeader, Card, EmptyState, Chip, btnPrimary, btnGhost } from '@/components/ui'
import { IconPlus, IconClock, IconPin, IconUser, IconEdit, IconTrash } from '@/components/icons'
import { RundownForm } from './rundown-form'

function fmtFullDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = ['', 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
  const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
  const wd = days[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${wd}, ${d} ${months[m]} ${y}`
}

export default function RundownPage() {
  const { data: items = [], mutate } = useSWR('rundown', () => getRundown(), { refreshInterval: 8000, revalidateOnFocus: true })
  const [editing, setEditing] = useState<RundownItem | null>(null)
  const [adding, setAdding] = useState(false)

  // group by day, preserving order (already sorted by day, start_time)
  const byDay: Record<string, RundownItem[]> = {}
  for (const it of items) (byDay[it.day] ??= []).push(it)
  const days = Object.keys(byDay)

  async function remove(it: RundownItem) {
    if (!confirm(`Delete "${it.title}"?`)) return
    await deleteRundownItem(it.id)
    mutate()
  }

  return (
    <div>
      <PageHeader
        title="Event Run-Down"
        subtitle="Atur cara program — committee schedule for the event"
        actions={
          <button onClick={() => { setAdding(true); setEditing(null) }} className={btnPrimary}>
            <IconPlus className="w-4 h-4" /> Add item
          </button>
        }
      />

      {adding && <RundownForm onDone={() => { setAdding(false); mutate() }} />}
      {editing && <RundownForm initial={editing} onDone={() => { setEditing(null); mutate() }} />}

      {days.length === 0 && !adding ? (
        <EmptyState
          title="No schedule yet"
          hint="Build the run-of-show by adding the first activity."
          action={<button onClick={() => setAdding(true)} className={btnPrimary}><IconPlus className="w-4 h-4" /> Add item</button>}
        />
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <section key={day}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <h2 className="text-sm font-semibold text-slate-700">{fmtFullDay(day)}</h2>
                <Chip>{byDay[day].length} item{byDay[day].length > 1 ? 's' : ''}</Chip>
              </div>
              <Card>
                <ul className="divide-y divide-slate-100">
                  {byDay[day].map((it) => (
                    <li key={it.id} className="flex items-start gap-4 p-4 hover:bg-slate-50/60 transition-colors group">
                      <div className="w-24 shrink-0">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 tabular-nums">
                          <IconClock className="w-4 h-4 text-blue-500" />
                          {it.start_time ?? '—'}
                        </div>
                        {it.end_time && <div className="text-xs text-slate-400 pl-[22px] tabular-nums">– {it.end_time}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{it.title}</div>
                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 mt-1">
                          {it.location && <span className="inline-flex items-center gap-1"><IconPin className="w-3.5 h-3.5 text-slate-400" />{it.location}</span>}
                          {it.pic && <span className="inline-flex items-center gap-1"><IconUser className="w-3.5 h-3.5 text-slate-400" />{it.pic}</span>}
                        </div>
                        {it.notes && <p className="text-xs text-slate-400 mt-1">{it.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 no-print sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(it); setAdding(false) }} className={btnGhost} title="Edit"><IconEdit className="w-4 h-4" /></button>
                        <button onClick={() => remove(it)} className={`${btnGhost} hover:text-red-600`} title="Delete"><IconTrash className="w-4 h-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
