'use client'
import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { getRoomsOverview, type RoomGuest } from '@/lib/actions/rooms'
import { checkOut, undoCheckOut } from '@/lib/actions/attendance'
import { PageHeader, Card, Stat, btnSecondary, btnGhost } from '@/components/ui'
import { StatusBadge } from '@/components/status-badge'
import { RoomCell } from '@/components/room-cell'
import { IconAttendance, IconRooms, IconPrinter, IconDownload } from '@/components/icons'
import { shortAgency } from '@/lib/agency'
import { downloadCsv } from '@/lib/csv'

const th = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'
const td = 'px-3 py-2.5'

// Three room states from the free-text room_no:
//  - "No room"  → stays elsewhere / day attendee (VSTECS, Geomapic, MP Langkawi)
//  - real value → assigned to that room
//  - blank      → needs a room but not assigned yet
function isNoRoom(roomNo: string | null): boolean {
  return (roomNo ?? '').trim().toLowerCase() === 'no room'
}
function isAssigned(roomNo: string | null): boolean {
  const v = (roomNo ?? '').trim().toLowerCase()
  return v !== '' && v !== 'no room'
}

export default function RoomsPage() {
  const { data, mutate } = useSWR('rooms-overview', () => getRoomsOverview(), {
    refreshInterval: 5000, revalidateOnFocus: true,
  })
  const guests = useMemo(() => data?.guests ?? [], [data])
  const totalRooms = data?.totalRooms ?? 30
  const checkedOut = data?.checkedOutRooms ?? 0
  const [busy, setBusy] = useState<string | null>(null)

  async function run(id: string, fn: (id: string) => Promise<unknown>) {
    setBusy(id)
    try { await fn(id); await mutate() } finally { setBusy(null) }
  }

  const { needRoom, noRoom, assignedRooms } = useMemo(() => {
    const needRoom: RoomGuest[] = []
    const noRoom: RoomGuest[] = []
    const used = new Set<string>()
    for (const g of guests) {
      if (isNoRoom(g.room_no)) { noRoom.push(g); continue }
      needRoom.push(g)
      if (isAssigned(g.room_no)) used.add(g.room_no!.trim())
    }
    return { needRoom, noRoom, assignedRooms: used.size }
  }, [guests])

  const assignedPax = needRoom.filter((g) => isAssigned(g.room_no)).length

  function exportCsv() {
    const rows = [
      ...needRoom.map((g) => [g.room_no?.trim() || '(unassigned)', g.name, shortAgency(g.agency), g.status]),
      ...noRoom.map((g) => ['No room', g.name, shortAgency(g.agency), g.status]),
    ]
    downloadCsv('rooms.csv', ['Room No.', 'Nama', 'PBT', 'Status'], rows)
  }

  return (
    <div>
      <PageHeader
        title="Rooms"
        subtitle={`${assignedRooms}/${totalRooms} rooms used · ${assignedPax}/${needRoom.length} guests assigned · ${noRoom.length} no room`}
        actions={
          <>
            <button onClick={exportCsv} className={btnSecondary}><IconDownload className="w-4 h-4" /> CSV</button>
            <button onClick={() => window.print()} className={btnSecondary}><IconPrinter className="w-4 h-4" /> Print</button>
          </>
        }
      />

      {/* Overview — hotel check-in (room assigned) / check-out / rooms used */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <Stat label="Checked in" value={`${assignedPax}/${needRoom.length}`} hint="guests with a room" accent icon={<IconAttendance className="w-5 h-5" />} />
        <Stat label="Checked out" value={`${checkedOut}/${totalRooms}`} hint="rooms vacated" icon={<IconRooms className="w-5 h-5" />} />
        <Stat label="Rooms used" value={`${assignedRooms}/${totalRooms}`} hint={`${totalRooms - assignedRooms} free`} />
      </div>

      {/* Assign rooms — editable Room No. per guest */}
      <h2 className="text-sm font-semibold text-slate-700 mb-3">
        Assign rooms <span className="text-slate-400 font-normal">· click a room cell to edit</span>
      </h2>
      <Card className="overflow-x-auto mb-8">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className={th}>No.</th>
              <th className={th}>PBT</th>
              <th className={th}>Nama Penuh</th>
              <th className={th}>Room No.</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right no-print`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {needRoom.map((g, i) => (
              <tr key={g.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td className={`${td} text-slate-400`}>{i + 1}</td>
                <td className={`${td} text-slate-500`} title={g.agency ?? ''}>{shortAgency(g.agency)}</td>
                <td className={`${td} font-medium text-slate-900`}>{g.name}</td>
                <RoomCell guest={g} onSaved={mutate} />
                <td className={td}><StatusBadge status={g.status} /></td>
                <td className={`${td} text-right no-print`}>
                  {g.status === 'Checked in' && (
                    <button disabled={busy === g.id} onClick={() => run(g.id, checkOut)} className={btnSecondary}>Check out</button>
                  )}
                  {g.status === 'Checked out' && (
                    <button disabled={busy === g.id} onClick={() => run(g.id, undoCheckOut)} className={btnGhost} title="Undo check-out">Undo</button>
                  )}
                </td>
              </tr>
            ))}
            {needRoom.length === 0 && (
              <tr><td colSpan={6} className={`${td} text-center text-slate-400 py-8`}>{data ? 'No guests need a room.' : 'Loading…'}</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* No room — day attendees / stay elsewhere */}
      <h2 className="text-sm font-semibold text-slate-700 mb-3">No room <span className="text-slate-400 font-normal">· {noRoom.length} pax</span></h2>
      <Card className="p-5">
        {noRoom.length === 0 ? (
          <p className="text-sm text-slate-400">No one is marked “No room”.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
            {noRoom.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 text-sm border-b border-slate-100 pb-1">
                <span className="text-slate-700 truncate">{g.name}</span>
                <span className="text-slate-400 text-xs shrink-0" title={g.agency ?? ''}>{shortAgency(g.agency)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
