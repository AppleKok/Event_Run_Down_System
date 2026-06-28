'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { getDashboard, type DashboardData } from '@/lib/actions/dashboard'
import { Card, Stat, SectionTitle, PageHeader, Chip } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import {
  IconGuests, IconBed, IconAlert, IconTransport, IconTasks, IconClock, IconPin,
} from '@/components/icons'

function fmtDay(iso: string): string {
  // '2026-06-30' -> '30 Jun'
  const [, m, d] = iso.split('-')
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${Number(d)} ${months[Number(m)] ?? ''}`.trim()
}

export default function OverviewPage() {
  const { data } = useSWR<DashboardData>('dashboard', () => getDashboard(), {
    refreshInterval: 8000,
    revalidateOnFocus: true,
  })

  const g = data?.guests
  const maxArr = Math.max(1, ...(data?.arrivalsByDay.map((a) => a.count) ?? [1]))

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Langkawi committee event · 30 Jun – 1 Jul 2026"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <Stat
          accent
          label="Days to event"
          value={data ? (data.daysToEvent > 0 ? data.daysToEvent : data.daysToEvent === 0 ? 'Today' : 'Live') : '—'}
          hint={data && data.daysToEvent > 0 ? 'until 30 Jun' : 'event window'}
          icon={<IconClock className="w-[18px] h-[18px]" />}
        />
        <Stat label="Guests" value={g?.total ?? '—'} hint="total peserta" icon={<IconGuests className="w-[18px] h-[18px]" />} />
        <Stat
          label="Rooms assigned"
          value={g ? `${g.roomsAssigned}` : '—'}
          hint={g ? `of ${g.total}` : undefined}
          icon={<IconBed className="w-[18px] h-[18px]" />}
        />
        <Stat label="Special diets" value={g?.specialDiets ?? '—'} hint="allergy / diet" icon={<IconAlert className="w-[18px] h-[18px]" />} />
        <Stat
          label="Transport trips"
          value={data?.transport.trips ?? '—'}
          hint={data ? `${data.transport.pax} pax` : undefined}
          icon={<IconTransport className="w-[18px] h-[18px]" />}
        />
        <Stat label="Open tasks" value={data?.tasks.open ?? '—'} hint={data ? `${data.tasks.done} done` : undefined} icon={<IconTasks className="w-[18px] h-[18px]" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Arrivals by day */}
        <Card className="p-5">
          <SectionTitle right={<Link href="/transport" className="text-blue-600 hover:underline text-sm">Transport →</Link>}>
            Arrivals at jetty
          </SectionTitle>
          {!data ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : data.arrivalsByDay.length === 0 ? (
            <p className="text-sm text-slate-400">No arrival dates recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.arrivalsByDay.map((a) => (
                <div key={a.date} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-sm text-slate-500">{fmtDay(a.date)}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(a.count / maxArr) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-slate-700 tabular-nums">{a.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Next on the run-down */}
        <Card className="p-5">
          <SectionTitle right={<Link href="/rundown" className="text-blue-600 hover:underline text-sm">Run-Down →</Link>}>
            Next on the run-down
          </SectionTitle>
          {!data ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : data.upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">No schedule items yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-2">
              {data.upcoming.map((u) => (
                <li key={u.id} className="flex items-start gap-3 py-2.5">
                  <div className="w-24 shrink-0">
                    <div className="text-xs text-slate-400">{fmtDay(u.day)}</div>
                    <div className="text-sm font-semibold text-slate-700 tabular-nums">{u.start_time ?? '—'}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800">{u.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                      {u.location && (
                        <span className="inline-flex items-center gap-1">
                          <IconPin className="w-3.5 h-3.5" /> {u.location}
                        </span>
                      )}
                      {u.pic && <span>· {u.pic}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Open tasks */}
      <div className="mt-6">
        <Card className="p-5">
          <SectionTitle right={<Link href="/tasks" className="text-blue-600 hover:underline text-sm">Tasks →</Link>}>
            Open committee tasks
          </SectionTitle>
          {!data ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : data.openTasks.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing open — all caught up. ✓</p>
          ) : (
            <ul className="divide-y divide-slate-100 -my-1">
              {data.openTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <StatusBadge status={t.status} />
                  <span className="flex-1 min-w-0 text-sm text-slate-800 truncate">{t.title}</span>
                  {t.category && <Chip className="hidden sm:inline-flex">{t.category}</Chip>}
                  {t.pic && <span className="hidden sm:inline text-xs text-slate-400 w-20 truncate text-right">{t.pic}</span>}
                  <span className="text-xs text-slate-400 w-16 text-right tabular-nums">{t.due_date ? fmtDay(t.due_date) : '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
