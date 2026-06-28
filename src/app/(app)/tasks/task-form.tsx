'use client'
import { useState } from 'react'
import { createTask, updateTask, TASK_STATUSES, type CommitteeTask } from '@/lib/actions/tasks'
import { Card, Field, inputClass, btnPrimary, btnSecondary } from '@/components/ui'

const EMPTY: Omit<CommitteeTask, 'id'> = {
  title: '', category: '', pic: '', due_date: '', status: 'Todo', notes: '',
}

export function TaskForm({ initial, onDone }: { initial?: CommitteeTask; onDone: () => void }) {
  const [row, setRow] = useState<CommitteeTask>(initial ?? { id: '', ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof CommitteeTask) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setRow({ ...row, [k]: e.target.value })

  async function save() {
    if (!row.title.trim()) { setError('Task title is required.'); return }
    setSaving(true)
    setError('')
    try {
      const { id, ...input } = row
      if (id) await updateTask(id, input)
      else await createTask(input)
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
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Task"><input className={inputClass} placeholder="Sahkan senarai bilik hotel" value={row.title} onChange={set('title')} /></Field>
        </div>
        <Field label="Category"><input className={inputClass} placeholder="Logistik / Transport / Katering" value={row.category ?? ''} onChange={set('category')} /></Field>
        <Field label="PIC (person in charge)"><input className={inputClass} placeholder="Nama" value={row.pic ?? ''} onChange={set('pic')} /></Field>
        <Field label="Due date"><input type="date" className={inputClass} value={row.due_date ?? ''} onChange={set('due_date')} /></Field>
        <Field label="Status">
          <select className={inputClass} value={row.status} onChange={set('status')}>
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2">
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
