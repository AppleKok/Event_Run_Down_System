'use client'
import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { suggestTrips } from '../../../lib/transport/engine'
import { DEFAULT_CONFIG, Guest, SuggestedTrip } from '../../../lib/transport/types'

export default function TransportPage() {
  const [trips, setTrips] = useState<SuggestedTrip[]>([])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('guests')
      .select('id, name, agency, arrival_date, arrival_time')
    const guests: Guest[] = ((data as any[]) ?? []).map((d) => ({
      id: d.id, name: d.name, agency: d.agency ?? '',
      arrivalDate: d.arrival_date, arrivalTime: d.arrival_time,
    }))
    setTrips(suggestTrips(guests, DEFAULT_CONFIG))
  }

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase.channel('transport-guests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const byDate = trips.reduce<Record<string, SuggestedTrip[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t); return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Transport — Arrival Pickups</h1>
        <button onClick={() => window.print()} className="border rounded-lg px-4 py-2">Print driver sheet</button>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Kuah Jetty → Bayview · pickup = arrival + {DEFAULT_CONFIG.bufferMin} min · van {DEFAULT_CONFIG.vanCapacity} pax
      </p>
      {Object.entries(byDate).map(([date, list]) => (
        <section key={date} className="mb-8">
          <h2 className="font-semibold text-slate-700 mb-3">{date}</h2>
          <div className="grid gap-3">
            {list.map((t) => (
              <div key={t.tripNo} className="bg-white border rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Trip {t.tripNo}</span>
                  <span className="text-sm">Arrive {t.arrivalTime} · <b>Pickup {t.pickupTime}</b> · Bayview {t.dropoffTime} · Back {t.vanBackTime}</span>
                </div>
                {t.conflict && <div className="text-amber-700 text-xs mt-1">Pickup delayed from {t.idealPickupTime} (van still out)</div>}
                <ul className="mt-2 text-sm text-slate-600 grid grid-cols-2 gap-x-6">
                  {t.guests.map((g) => <li key={g.id}>{g.name} <span className="text-slate-400">· {g.agency}</span></li>)}
                </ul>
                <div className="text-xs text-slate-400 mt-2">{t.guests.length} / {DEFAULT_CONFIG.vanCapacity} pax</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
