'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { getGuests, type GuestRow } from '@/lib/actions/guests'
import { StatusBadge } from '@/components/status-badge'
import { PageHeader, Card, btnPrimary, btnGhost } from '@/components/ui'
import { IconPlus, IconEdit } from '@/components/icons'
import { RoomCell } from '@/components/room-cell'
import { GuestForm } from './guest-form'
import { shortAgency } from '@/lib/agency'

const th = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'
const td = 'px-3 py-2.5'

export default function GuestsPage() {
  const { data: all = [], mutate } = useSWR('guests', () => getGuests(), { refreshInterval: 5000, revalidateOnFocus: true })
  const guests = all.filter((g) => g.category !== 'committee') // committee shown on /committee
  const [editing, setEditing] = useState<GuestRow | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <PageHeader
        title="Guests"
        subtitle={`${guests.length} peserta · rooming, arrival & dietary details`}
        actions={
          <button onClick={() => { setAdding(true); setEditing(null) }} className={btnPrimary}>
            <IconPlus className="w-4 h-4" /> Add guest
          </button>
        }
      />

      {adding && <GuestForm onDone={() => { setAdding(false); mutate() }} />}
      {editing && <GuestForm initial={editing} onDone={() => { setEditing(null); mutate() }} />}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className={th}>No.</th>
              <th className={th}>PBT</th>
              <th className={th}>Nama Penuh</th>
              <th className={th}>Room No.</th>
              <th className={th}>Tarikh Tiba</th>
              <th className={th}>Waktu Tiba</th>
              <th className={th}>No. Kad Pengenalan</th>
              <th className={th}>Jantina</th>
              <th className={th}>Alahan Makanan</th>
              <th className={th}>Size</th>
              <th className={th}>Status</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g, i) => {
              const allergy = g.food_allergy ?? ''
              const hasAllergy = allergy.trim() !== '' && allergy.trim().toLowerCase() !== 'tiada'
              return (
                <tr key={g.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className={`${td} text-slate-400`}>{i + 1}</td>
                  <td className={`${td} text-slate-500`} title={g.agency ?? ''}>{shortAgency(g.agency)}</td>
                  <td className={`${td} font-medium text-slate-900`}>{g.name}</td>
                  <RoomCell guest={g} onSaved={mutate} />
                  <td className={`${td} text-slate-600`}>{g.arrival_date ?? '—'}</td>
                  <td className={`${td} text-slate-600 tabular-nums`}>{g.arrival_time ?? '—'}</td>
                  <td className={`${td} tabular-nums text-slate-600`}>{g.ic_no ?? '—'}</td>
                  <td className={`${td} text-slate-600`}>{g.gender ?? '—'}</td>
                  <td className={`${td} ${hasAllergy ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>{allergy || '—'}</td>
                  <td className={`${td} text-slate-600`}>{g.tshirt_size ?? '—'}</td>
                  <td className={td}><StatusBadge status={g.transport_status} /></td>
                  <td className={`${td} text-right no-print`}>
                    <button onClick={() => { setEditing(g); setAdding(false) }} className={btnGhost} title="Edit"><IconEdit className="w-4 h-4" /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
