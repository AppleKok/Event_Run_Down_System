'use client'
import { useState } from 'react'
import { createGuest, updateGuest, type GuestRow } from '@/lib/actions/guests'

const EMPTY: Omit<GuestRow, 'id'> = {
  name: '', agency: '', ic_no: '', gender: '', room_no: '',
  roommate: '', arrival_date: '2026-06-30', arrival_time: '',
  tshirt_size: '', food_allergy: 'Tiada', transport_status: 'Pending', pic: '',
}

export function GuestForm({ initial, onDone }: { initial?: GuestRow; onDone: () => void }) {
  const [row, setRow] = useState<GuestRow>(initial ?? { id: '', ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof GuestRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRow({ ...row, [k]: e.target.value })

  async function save() {
    setSaving(true)
    setError('')
    try {
      if (row.id) await updateGuest(row.id, row)
      else await createGuest(row)
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border rounded-xl p-4 grid grid-cols-2 gap-3 mb-4">
      <input className="border rounded px-2 py-1" placeholder="Nama Penuh" value={row.name} onChange={set('name')} />
      <input className="border rounded px-2 py-1" placeholder="PBT / Agency" value={row.agency ?? ''} onChange={set('agency')} />
      <input className="border rounded px-2 py-1" placeholder="No. Kad Pengenalan" value={row.ic_no ?? ''} onChange={set('ic_no')} />
      <input className="border rounded px-2 py-1" placeholder="Jantina" value={row.gender ?? ''} onChange={set('gender')} />
      <input className="border rounded px-2 py-1" placeholder="Room No." value={row.room_no ?? ''} onChange={set('room_no')} />
      <input className="border rounded px-2 py-1" placeholder="Sebilik Dengan (roommate)" value={row.roommate ?? ''} onChange={set('roommate')} />
      <input className="border rounded px-2 py-1" type="date" value={row.arrival_date ?? ''} onChange={set('arrival_date')} />
      <input className="border rounded px-2 py-1" placeholder="Waktu Tiba HH:MM" value={row.arrival_time ?? ''} onChange={set('arrival_time')} />
      <input className="border rounded px-2 py-1" placeholder="Size T-Shirt" value={row.tshirt_size ?? ''} onChange={set('tshirt_size')} />
      <input className="border rounded px-2 py-1" placeholder="Alahan Makanan" value={row.food_allergy ?? ''} onChange={set('food_allergy')} />
      <input className="border rounded px-2 py-1" placeholder="PIC" value={row.pic ?? ''} onChange={set('pic')} />
      <input className="border rounded px-2 py-1" placeholder="Status" value={row.transport_status} onChange={set('transport_status')} />
      {error && <p className="col-span-2 text-red-600 text-sm">{error}</p>}
      <div className="col-span-2 flex gap-2">
        <button disabled={saving} onClick={save} className="bg-slate-800 text-white rounded px-4 py-1.5 font-semibold">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onDone} className="rounded px-4 py-1.5 border">Cancel</button>
      </div>
    </div>
  )
}
