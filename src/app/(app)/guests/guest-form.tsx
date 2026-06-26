'use client'
import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

export interface GuestRow {
  id?: string; name: string; agency: string | null; arrival_date: string | null
  arrival_time: string | null; tshirt_size: string | null; food_allergy: string | null
  transport_status: string; pic: string | null
}

const EMPTY: GuestRow = {
  name: '', agency: '', arrival_date: '2026-06-30', arrival_time: '',
  tshirt_size: '', food_allergy: '', transport_status: 'Pending', pic: '',
}

export function GuestForm({ initial, onDone }: { initial?: GuestRow; onDone: () => void }) {
  const [row, setRow] = useState<GuestRow>(initial ?? EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof GuestRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRow({ ...row, [k]: e.target.value })

  async function save() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const payload = { ...row, arrival_time: row.arrival_time || null }
    if (row.id) {
      const { error } = await supabase.from('guests').update(payload).eq('id', row.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('guests').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false)
    onDone()
  }

  return (
    <div className="bg-white border rounded-xl p-4 grid grid-cols-2 gap-3 mb-4">
      <input className="border rounded px-2 py-1" placeholder="Name" value={row.name} onChange={set('name')} />
      <input className="border rounded px-2 py-1" placeholder="Agency" value={row.agency ?? ''} onChange={set('agency')} />
      <input className="border rounded px-2 py-1" type="date" value={row.arrival_date ?? ''} onChange={set('arrival_date')} />
      <input className="border rounded px-2 py-1" placeholder="Arrival HH:MM" value={row.arrival_time ?? ''} onChange={set('arrival_time')} />
      <input className="border rounded px-2 py-1" placeholder="T-shirt size" value={row.tshirt_size ?? ''} onChange={set('tshirt_size')} />
      <input className="border rounded px-2 py-1" placeholder="Food allergy" value={row.food_allergy ?? ''} onChange={set('food_allergy')} />
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
