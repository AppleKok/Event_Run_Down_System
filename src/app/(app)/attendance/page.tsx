'use client'
import useSWR from 'swr'
import { useMemo, useState } from 'react'
import {
  getAttendance, checkIn, checkOut, undoCheckIn, undoCheckOut, setArrivalVenue,
  type AttendanceRow, type ArrivalVenue,
} from '@/lib/actions/attendance'
import { getSessions } from '@/lib/actions/sessions'
import { PageHeader, Card, btnSecondary, inputClass } from '@/components/ui'
import { IconPrinter, IconDownload, IconArrival, IconDeparture, IconUndo } from '@/components/icons'
import { SessionRoster } from '@/components/session-roster'
import { shortAgency } from '@/lib/agency'
import { downloadCsv } from '@/lib/csv'

const th = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'
const td = 'px-3 py-2.5'

// Action buttons — icon-only, colour-matched to the journey: arrived = blue, ready-to-go = green.
const btnIcon = 'inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const btnArrive = `${btnIcon} bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white`
const btnDepart = `${btnIcon} bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white`
const btnUndo = `${btnIcon} text-slate-400 hover:text-slate-700 hover:bg-slate-100`

const ARRIVAL_TAB = 'arrival'

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
    >
      {children}
      <span className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full ${active ? 'bg-blue-600' : 'bg-transparent'}`} />
    </button>
  )
}

// First tab: arrival check-in. Drives the Transport "present" highlight.
function ArrivalCheckIn() {
  const { data: rows = [], mutate } = useSWR('attendance', () => getAttendance(), {
    refreshInterval: 5000, revalidateOnFocus: true,
  })
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const counts = useMemo(() => ({
    total: rows.length,
    onSite: rows.filter((r) => r.status === 'On site').length,
    arrived: rows.filter((r) => r.checked_in_at).length,
    out: rows.filter((r) => r.status === 'Departed').length,
  }), [rows])

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (!needle) return true
      return r.name.toLowerCase().includes(needle) || (r.agency ?? '').toLowerCase().includes(needle)
    })
  }, [rows, q])

  function exportCsv() {
    downloadCsv(
      'attendance.csv',
      ['PBT', 'Nama', 'Venue', 'Status', 'Arrival time', 'Checked in by', 'Departure time', 'Checked out by'],
      visible.map((r) => [
        shortAgency(r.agency), r.name, r.arrival_venue, r.status,
        r.checked_in_at ?? '', r.checked_in_by ?? '', r.checked_out_at ?? '', r.checked_out_by ?? '',
      ]),
    )
  }

  async function run(id: string, fn: (id: string) => Promise<AttendanceRow>) {
    setBusy(id); setError('')
    try { await fn(id); await mutate() }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed.') }
    finally { setBusy(null) }
  }
  async function changeVenue(id: string, venue: ArrivalVenue) {
    setBusy(id); setError('')
    try { await setArrivalVenue(id, venue); await mutate() }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed.') }
    finally { setBusy(null) }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">On site {counts.onSite} · arrived {counts.arrived}/{counts.total} · departed {counts.out}</p>
        <div className="flex items-center gap-2 no-print w-full sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, PBT…" className={`${inputClass} flex-1 min-w-0 sm:flex-none sm:w-52`} />
          <button onClick={exportCsv} className={btnSecondary}><IconDownload className="w-4 h-4" /> CSV</button>
          <button onClick={() => window.print()} className={btnSecondary}><IconPrinter className="w-4 h-4" /> Print</button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className={th}>No.</th>
              <th className={th}>PBT</th>
              <th className={th}>Nama Penuh</th>
              <th className={th}>Venue</th>
              <th className={th}>Arrival time</th>
              <th className={th}>Departure time</th>
              <th className={`${th} text-right no-print`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const isBusy = busy === r.id
              return (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className={`${td} text-slate-400`}>{i + 1}</td>
                  <td className={`${td} text-slate-500`} title={r.agency ?? ''}>{shortAgency(r.agency)}</td>
                  <td className={`${td} font-medium text-slate-900`}>{r.name}</td>
                  <td className={td}>
                    <select
                      value={r.arrival_venue}
                      disabled={isBusy}
                      onChange={(e) => changeVenue(r.id, e.target.value as ArrivalVenue)}
                      className="border border-slate-200 rounded-lg pl-2.5 pr-7 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 disabled:opacity-60 transition cursor-pointer"
                    >
                      <option value="Jetty">Jetty</option>
                      <option value="Airport">Airport</option>
                      <option value="Drive/Self">Drive/Self</option>
                    </select>
                  </td>
                  <td className={`${td} text-slate-600 tabular-nums`} title={r.checked_in_by ?? ''}>{r.checked_in_at ?? '—'}</td>
                  <td className={`${td} text-slate-600 tabular-nums`} title={r.checked_out_by ?? ''}>{r.checked_out_at ?? '—'}</td>
                  <td className={`${td} no-print`}>
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === 'Not arrived' && (
                        <button disabled={isBusy} onClick={() => run(r.id, checkIn)} className={btnArrive} title="Mark arrived in Langkawi" aria-label="Mark arrived">
                          <IconArrival className="w-5 h-5" />
                        </button>
                      )}
                      {r.status === 'On site' && (
                        <>
                          <button disabled={isBusy} onClick={() => run(r.id, checkOut)} className={btnDepart} title="Mark ready to go / departed" aria-label="Mark departed">
                            <IconDeparture className="w-5 h-5" />
                          </button>
                          <button disabled={isBusy} onClick={() => run(r.id, undoCheckIn)} className={btnUndo} title="Undo arrival" aria-label="Undo arrival">
                            <IconUndo className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {r.status === 'Departed' && (
                        <button disabled={isBusy} onClick={() => run(r.id, undoCheckOut)} className={btnUndo} title="Undo departure" aria-label="Undo departure">
                          <IconUndo className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr><td colSpan={7} className={`${td} text-center text-slate-400 py-8`}>No guests match.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export default function AttendancePage() {
  const { data: sessions = [] } = useSWR('sessions', () => getSessions(), { refreshInterval: 5000, revalidateOnFocus: true })
  const [tab, setTab] = useState<string>(ARRIVAL_TAB)

  // If the active session tab disappears, fall back to arrival.
  const activeIsSession = sessions.some((s) => s.id === tab)
  const current = tab === ARRIVAL_TAB || activeIsSession ? tab : ARRIVAL_TAB

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Arrival check-in, then attendance for each session" />

      <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto no-print">
        <TabButton active={current === ARRIVAL_TAB} onClick={() => setTab(ARRIVAL_TAB)}>Arrival check in</TabButton>
        {sessions.map((s) => (
          <TabButton key={s.id} active={current === s.id} onClick={() => setTab(s.id)}>
            {s.name}
            <span className="ml-2 text-xs tabular-nums text-slate-400">{s.present}/{s.total}</span>
          </TabButton>
        ))}
      </div>

      {current === ARRIVAL_TAB ? <ArrivalCheckIn /> : <SessionRoster sessionId={current} />}
    </div>
  )
}
