'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { getGuests, type GuestRow } from '@/lib/actions/guests'
import { StatusBadge } from '@/components/status-badge'
import { PageHeader, Card, btnGhost } from '@/components/ui'
import { IconEdit } from '@/components/icons'
import { RoomCell } from '@/components/room-cell'
import { GuestForm } from '../guests/guest-form'

const th = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'
const td = 'px-3 py-2.5'

export default function CommitteePage() {
  const { data: all = [], mutate } = useSWR('guests', () => getGuests(), { refreshInterval: 5000, revalidateOnFocus: true })
  const committee = all.filter((g) => g.category === 'committee')
  const [editing, setEditing] = useState<GuestRow | null>(null)

  const withRoom = committee.filter((g) => g.room_no && g.room_no.trim() !== '').length

  return (
    <div>
      <PageHeader
        title="Committee"
        subtitle={`${committee.length} ahli jawatankuasa (DLS) · ${withRoom} rooms assigned`}
      />

      {editing && <GuestForm initial={editing} onDone={() => { setEditing(null); mutate() }} />}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className={th}>No.</th>
              <th className={th}>Nama Penuh</th>
              <th className={th}>Room No.</th>
              <th className={th}>Tarikh Tiba</th>
              <th className={th}>Waktu Tiba</th>
              <th className={th}>No. Kad Pengenalan</th>
              <th className={th}>Jantina</th>
              <th className={th}>Size</th>
              <th className={th}>Status</th>
              <th className={`${th} no-print`}></th>
            </tr>
          </thead>
          <tbody>
            {committee.map((g, i) => (
              <tr key={g.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td className={`${td} text-slate-400`}>{i + 1}</td>
                <td className={`${td} font-medium text-slate-900`}>{g.name}</td>
                <RoomCell guest={g} onSaved={mutate} />
                <td className={`${td} text-slate-600`}>{g.arrival_date ?? '—'}</td>
                <td className={`${td} text-slate-600 tabular-nums`}>{g.arrival_time ?? '—'}</td>
                <td className={`${td} tabular-nums text-slate-600`}>{g.ic_no ?? '—'}</td>
                <td className={`${td} text-slate-600`}>{g.gender ?? '—'}</td>
                <td className={`${td} text-slate-600`}>{g.tshirt_size ?? '—'}</td>
                <td className={td}><StatusBadge status={g.transport_status} /></td>
                <td className={`${td} text-right no-print`}>
                  <button onClick={() => setEditing(g)} className={btnGhost} title="Edit"><IconEdit className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {committee.length === 0 && (
              <tr><td colSpan={10} className={`${td} text-center text-slate-400 py-8`}>No committee members.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
