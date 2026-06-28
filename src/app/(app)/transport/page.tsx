'use client'
import useSWR from 'swr'
import { getTransportGuests } from '@/lib/actions/guests'
import { suggestTrips } from '@/lib/transport/engine'
import { DEFAULT_CONFIG, type Guest, type SuggestedTrip } from '@/lib/transport/types'
import { PageHeader, Card, EmptyState, Chip, btnSecondary } from '@/components/ui'
import { IconClock } from '@/components/icons'

function fmtFullDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = ['', 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
  return `${d} ${months[m]} ${y}`
}

export default function TransportPage() {
  const { data: rawGuests = [] } = useSWR('transport-guests', () => getTransportGuests(), { refreshInterval: 5000, revalidateOnFocus: true })

  const guests: Guest[] = rawGuests.map((d) => ({
    id: d.id, name: d.name, agency: d.agency ?? '',
    arrivalDate: d.arrival_date ?? '', arrivalTime: d.arrival_time,
  }))
  const trips = suggestTrips(guests, DEFAULT_CONFIG)

  const byDate = trips.reduce<Record<string, SuggestedTrip[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t); return acc
  }, {})
  const dates = Object.keys(byDate)

  return (
    <div>
      <PageHeader
        title="Transport"
        subtitle={`Arrival pickups · Kuah Jetty → Bayview · pickup = arrival + ${DEFAULT_CONFIG.bufferMin} min · van ${DEFAULT_CONFIG.vanCapacity} pax`}
        actions={<button onClick={() => window.print()} className={btnSecondary}>Print driver sheet</button>}
      />

      {dates.length === 0 ? (
        <EmptyState title="No pickups to schedule" hint="Trips appear here once guests have arrival times set." />
      ) : (
        <div className="space-y-8">
          {dates.map((date) => (
            <section key={date}>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 px-1">{fmtFullDay(date)}</h2>
              <div className="grid gap-3">
                {byDate[date].map((t) => (
                  <Card key={t.tripNo} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">Trip {t.tripNo}</span>
                      <span className="text-sm text-slate-500 flex items-center gap-1.5">
                        <IconClock className="w-4 h-4 text-slate-400" />
                        Arrive {t.arrivalTime} · <b className="text-blue-600">Pickup {t.pickupTime}</b> · Bayview {t.dropoffTime} · Back {t.vanBackTime}
                      </span>
                    </div>
                    {t.conflict && (
                      <div className="text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-600/20 rounded-md px-2 py-1 text-xs mt-2 inline-block">
                        Pickup delayed from {t.idealPickupTime} (van still out)
                      </div>
                    )}
                    <ul className="mt-3 text-sm text-slate-600 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                      {t.guests.map((g) => (
                        <li key={g.id} className="truncate">{g.name} <span className="text-slate-400">· {g.agency}</span></li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <Chip>{t.guests.length} / {DEFAULT_CONFIG.vanCapacity} pax</Chip>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
