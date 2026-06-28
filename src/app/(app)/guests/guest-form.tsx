'use client'
import { useState } from 'react'
import { createGuest, updateGuest, type GuestRow } from '@/lib/actions/guests'
import { Card, Field, inputClass, btnPrimary, btnSecondary } from '@/components/ui'

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
    if (!row.name.trim()) { setError('Nama is required.'); return }
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
    <Card className="p-4 mb-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Nama Penuh"><input className={inputClass} value={row.name} onChange={set('name')} /></Field>
        <Field label="PBT / Agency"><input className={inputClass} value={row.agency ?? ''} onChange={set('agency')} /></Field>
        <Field label="No. Kad Pengenalan"><input className={inputClass} value={row.ic_no ?? ''} onChange={set('ic_no')} /></Field>
        <Field label="Jantina"><input className={inputClass} placeholder="Lelaki / Perempuan" value={row.gender ?? ''} onChange={set('gender')} /></Field>
        <Field label="Room No."><input className={inputClass} value={row.room_no ?? ''} onChange={set('room_no')} /></Field>
        <Field label="Sebilik Dengan (roommate)"><input className={inputClass} value={row.roommate ?? ''} onChange={set('roommate')} /></Field>
        <Field label="Tarikh Tiba"><input type="date" className={inputClass} value={row.arrival_date ?? ''} onChange={set('arrival_date')} /></Field>
        <Field label="Waktu Tiba (HH:MM)"><input className={inputClass} placeholder="14:30" value={row.arrival_time ?? ''} onChange={set('arrival_time')} /></Field>
        <Field label="Size T-Shirt"><input className={inputClass} placeholder="M / L / XL" value={row.tshirt_size ?? ''} onChange={set('tshirt_size')} /></Field>
        <Field label="Alahan Makanan"><input className={inputClass} value={row.food_allergy ?? ''} onChange={set('food_allergy')} /></Field>
        <Field label="PIC"><input className={inputClass} value={row.pic ?? ''} onChange={set('pic')} /></Field>
        <Field label="Status"><input className={inputClass} placeholder="Pending / Confirmed" value={row.transport_status} onChange={set('transport_status')} /></Field>
      </div>
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button disabled={saving} onClick={save} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={onDone} className={btnSecondary}>Cancel</button>
      </div>
    </Card>
  )
}
