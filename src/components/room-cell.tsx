'use client'
import { useState } from 'react'
import { assignRoom, type GuestRow } from '@/lib/actions/guests'

// Inline click-to-edit Room No. cell — fast path for bulk room assignment.
// Shared by the Guests and Committee tables.
export function RoomCell({ guest, onSaved }: { guest: GuestRow; onSaved: () => void }) {
  const td = 'px-3 py-2.5'
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(guest.room_no ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (saving) return
    if (val.trim() === (guest.room_no ?? '')) { setEditing(false); setError(''); return }
    setSaving(true)
    try {
      await assignRoom(guest.id, val)
      onSaved()
      setError('')
      setEditing(false)
    } catch (e) {
      // Keep editing open so the user can pick a different room (e.g. twin room full).
      setError(e instanceof Error ? e.message : 'Could not save room.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <td className={td}>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') { setVal(guest.room_no ?? ''); setError(''); setEditing(false) }
          }}
          disabled={saving}
          placeholder="—"
          className={`w-20 border rounded px-1.5 py-0.5 text-sm tabular-nums focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-500/40' : 'border-blue-300 focus:ring-blue-500/40'}`}
        />
        {error && <div className="text-[11px] text-red-600 mt-1 whitespace-normal max-w-[10rem]">{error}</div>}
      </td>
    )
  }
  return (
    <td
      onClick={() => { setVal(guest.room_no ?? ''); setEditing(true) }}
      title="Click to assign room"
      className={`${td} font-semibold tabular-nums cursor-pointer hover:bg-blue-50/60 ${guest.room_no ? 'text-slate-800' : 'text-slate-300'}`}
    >
      {guest.room_no ?? '—'}
    </td>
  )
}
