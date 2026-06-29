'use client'
import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { getSessionRoster, setPresent, setCollected, type SessionGuest } from '@/lib/actions/sessions'
import { Card, btnSecondary, inputClass } from '@/components/ui'
import { IconPrinter, IconDownload } from '@/components/icons'
import { shortAgency } from '@/lib/agency'
import { downloadCsv } from '@/lib/csv'

const th = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'
const td = 'px-3 py-2.5'

// Per-session roster: mark present + tick collected items. Reused by the Attendance
// tabs and the standalone /attendance/[id] page (SWR key is shared, so no double fetch).
export function SessionRoster({ sessionId }: { sessionId: string }) {
  const { data, mutate } = useSWR(['session', sessionId], () => getSessionRoster(sessionId), {
    refreshInterval: 5000, revalidateOnFocus: true,
  })
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const session = data?.session
  const roster = useMemo(() => data?.roster ?? [], [data])
  const items = session?.items ?? []

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return roster
    return roster.filter((r) =>
      r.name.toLowerCase().includes(needle) ||
      (r.agency ?? '').toLowerCase().includes(needle) ||
      (r.room_no ?? '').toLowerCase().includes(needle))
  }, [roster, q])

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key)
    try { await fn(); await mutate() } finally { setBusy(null) }
  }
  function togglePresent(r: SessionGuest) {
    run(r.id + ':p', () => setPresent(sessionId, r.id, !r.present))
  }
  function toggleItem(r: SessionGuest, item: string) {
    const next = r.collected.includes(item) ? r.collected.filter((x) => x !== item) : [...r.collected, item]
    run(r.id + ':' + item, () => setCollected(sessionId, r.id, next))
  }

  function exportCsv() {
    downloadCsv(
      `${session?.name ?? 'session'}.csv`,
      ['PBT', 'Nama', 'Room No.', 'Present', ...items],
      visible.map((r) => [
        shortAgency(r.agency), r.name, r.room_no ?? '', r.present ? 'Yes' : 'No',
        ...items.map((it) => (r.collected.includes(it) ? 'Yes' : 'No')),
      ]),
    )
  }

  const presentCount = roster.filter((r) => r.present).length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">
          {session?.session_date ?? ''} · present {presentCount}/{roster.length}
          {items.length ? ` · collect: ${items.join(', ')}` : ''}
        </p>
        <div className="flex items-center gap-2 no-print w-full sm:w-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, PBT, room…" className={`${inputClass} flex-1 min-w-0 sm:flex-none sm:w-52`} />
          <button onClick={exportCsv} className={btnSecondary}><IconDownload className="w-4 h-4" /> CSV</button>
          <button onClick={() => window.print()} className={btnSecondary}><IconPrinter className="w-4 h-4" /> Print</button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className={th}>No.</th>
              <th className={th}>PBT</th>
              <th className={th}>Nama Penuh</th>
              <th className={th}>Room No.</th>
              <th className={`${th} text-center`}>Present</th>
              {items.map((it) => <th key={it} className={`${th} text-center`}>{it}</th>)}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={r.id} className={`border-b border-slate-100 last:border-0 transition-colors ${r.present ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'}`}>
                <td className={`${td} text-slate-400`}>{i + 1}</td>
                <td className={`${td} text-slate-500`} title={r.agency ?? ''}>{shortAgency(r.agency)}</td>
                <td className={`${td} font-medium text-slate-900`}>{r.name}</td>
                <td className={`${td} font-semibold tabular-nums ${r.room_no ? 'text-slate-800' : 'text-slate-300'}`}>{r.room_no ?? '—'}</td>
                <td className={`${td} text-center`}>
                  <input type="checkbox" checked={r.present} disabled={busy === r.id + ':p'}
                    onChange={() => togglePresent(r)} className="w-5 h-5 accent-emerald-600 cursor-pointer" />
                </td>
                {items.map((it) => (
                  <td key={it} className={`${td} text-center`}>
                    <input type="checkbox" checked={r.collected.includes(it)} disabled={busy === r.id + ':' + it}
                      onChange={() => toggleItem(r, it)} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={5 + items.length} className={`${td} text-center text-slate-400 py-8`}>{data ? 'No one matches.' : 'Loading…'}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
