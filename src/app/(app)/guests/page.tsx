'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { getGuests, type GuestRow } from '@/lib/actions/guests'
import { StatusBadge } from '@/components/status-badge'
import { GuestForm } from './guest-form'

export default function GuestsPage() {
  const { data: guests = [], mutate } = useSWR('guests', () => getGuests(), { refreshInterval: 5000, revalidateOnFocus: true })
  const [editing, setEditing] = useState<GuestRow | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Guests <span className="text-slate-400 text-base">({guests.length})</span></h1>
        <button onClick={() => { setAdding(true); setEditing(null) }} className="bg-slate-800 text-white rounded-lg px-4 py-2 font-semibold">+ Add guest</button>
      </div>
      {adding && <GuestForm onDone={() => { setAdding(false); mutate() }} />}
      {editing && <GuestForm initial={editing} onDone={() => { setEditing(null); mutate() }} />}
      <div className="overflow-x-auto bg-white border rounded-xl">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-800 text-white text-left">
            <tr>
              <th className="p-2">No.</th>
              <th className="p-2">PBT</th>
              <th className="p-2">Nama Penuh</th>
              <th className="p-2">Room No.</th>
              <th className="p-2">Tarikh Tiba</th>
              <th className="p-2">Waktu Tiba</th>
              <th className="p-2">No. Kad Pengenalan</th>
              <th className="p-2">Jantina</th>
              <th className="p-2">Alahan Makanan</th>
              <th className="p-2">Size</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g, i) => {
              const allergy = g.food_allergy ?? ''
              const hasAllergy = allergy.trim() !== '' && allergy.trim().toLowerCase() !== 'tiada'
              return (
                <tr key={g.id} className="border-t">
                  <td className="p-2 text-slate-400">{i + 1}</td>
                  <td className="p-2 text-slate-500">{g.agency ?? '—'}</td>
                  <td className="p-2 font-medium">{g.name}</td>
                  <td className={`p-2 font-semibold tabular-nums ${g.room_no ? 'text-slate-800' : 'text-slate-300'}`}>{g.room_no ?? '—'}</td>
                  <td className="p-2">{g.arrival_date ?? '—'}</td>
                  <td className="p-2">{g.arrival_time ?? '—'}</td>
                  <td className="p-2 tabular-nums">{g.ic_no ?? '—'}</td>
                  <td className="p-2">{g.gender ?? '—'}</td>
                  <td className={`p-2 ${hasAllergy ? 'text-red-600 font-semibold' : ''}`}>{allergy || '—'}</td>
                  <td className="p-2">{g.tshirt_size ?? '—'}</td>
                  <td className="p-2"><StatusBadge status={g.transport_status} /></td>
                  <td className="p-2 text-right"><button onClick={() => { setEditing(g); setAdding(false) }} className="text-slate-500 underline">edit</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
