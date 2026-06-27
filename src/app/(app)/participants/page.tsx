'use client'
import useSWR from 'swr'
import { getParticipants } from '@/lib/actions/guests'

function Field({ label, value }: { label: string; value: string | null }) {
  const has = value != null && value.trim() !== ''
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 shrink-0">{label}:</span>
      <span className={has ? 'text-slate-800' : 'text-slate-300'}>{has ? value : '—'}</span>
    </div>
  )
}

export default function ParticipantsPage() {
  const { data: people = [] } = useSWR('participants', () => getParticipants(), {
    refreshInterval: 8000,
    revalidateOnFocus: true,
  })
  const withDetails = people.filter((p) => p.ic_no && p.ic_no.trim() !== '').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800">
          Maklumat Peserta <span className="text-slate-400 text-base">({people.length})</span>
        </h1>
        <span className="text-sm text-slate-500">{withDetails} of {people.length} with full IC details</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <div key={p.id} className="bg-white border rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-2 border-b pb-2">{p.agency ?? '—'}</h2>
            <div className="text-sm space-y-1">
              <Field label="Nama" value={p.name} />
              <Field label="No Kad Pengenalan" value={p.ic_no} />
              <Field label="Jantina" value={p.gender} />
              <Field label="Alahan Makanan" value={p.food_allergy} />
              <Field label="Saiz t-shirt" value={p.tshirt_size} />
              <Field label="Jenis Bilik" value={p.room_type} />
              <Field label="Jenis Katil" value={p.bed_type} />
              <Field label="Sebilik Dengan" value={p.roommate} />
              <Field label="Tarikh Tiba" value={p.arrival_date} />
              <Field label="Waktu Tiba" value={p.arrival_time} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
