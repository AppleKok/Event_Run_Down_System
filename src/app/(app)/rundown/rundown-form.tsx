'use client'
import { useState } from 'react'
import { createRundownItem, updateRundownItem, type RundownItem } from '@/lib/actions/rundown'
import { Card, Field, inputClass, btnPrimary, btnSecondary } from '@/components/ui'

const EMPTY: Omit<RundownItem, 'id'> = {
  day: '2026-06-30', start_time: '', end_time: '', title: '', location: '', pic: '', notes: '',
}

export function RundownForm({ initial, onDone }: { initial?: RundownItem; onDone: () => void }) {
  const [row, setRow] = useState<RundownItem>(initial ?? { id: '', ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof RundownItem) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRow({ ...row, [k]: e.target.value })

  async function save() {
    if (!row.title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError('')
    try {
      const { id, ...input } = row
      if (id) await updateRundownItem(id, input)
      else await createRundownItem(input)
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
        <Field label="Day"><input type="date" className={inputClass} value={row.day} onChange={set('day')} /></Field>
        <Field label="Start (HH:MM)"><input className={inputClass} placeholder="14:00" value={row.start_time ?? ''} onChange={set('start_time')} /></Field>
        <Field label="End (HH:MM)"><input className={inputClass} placeholder="15:00" value={row.end_time ?? ''} onChange={set('end_time')} /></Field>
        <Field label="Activity / title"><input className={inputClass} placeholder="Pendaftaran & check-in" value={row.title} onChange={set('title')} /></Field>
        <Field label="Location"><input className={inputClass} placeholder="Bayview Hotel" value={row.location ?? ''} onChange={set('location')} /></Field>
        <Field label="PIC"><input className={inputClass} placeholder="Urusetia" value={row.pic ?? ''} onChange={set('pic')} /></Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Notes"><input className={inputClass} placeholder="Optional" value={row.notes ?? ''} onChange={set('notes')} /></Field>
        </div>
      </div>
      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button disabled={saving} onClick={save} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
        <button onClick={onDone} className={btnSecondary}>Cancel</button>
      </div>
    </Card>
  )
}
