'use client'
import useSWR from 'swr'
import { useMemo, useState, type ReactNode } from 'react'
import { getTransportGuests } from '@/lib/actions/guests'
import { getTripStatuses, setTripCompleted } from '@/lib/actions/transport'
import { suggestTrips, suggestShuttle } from '@/lib/transport/engine'
import { DEFAULT_CONFIG, EVENT_SHUTTLES, type Guest, type SuggestedTrip, type ShuttleResult } from '@/lib/transport/types'
import { PageHeader, Card, Stat, EmptyState, Chip, btnSecondary } from '@/components/ui'
import { IconClock, IconPin, IconCheck, IconTransport } from '@/components/icons'
import { shortAgency } from '@/lib/agency'

function fmtFullDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = ['', 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember']
  return `${d} ${months[m]} ${y}`
}

const completeBtn = 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors'

// Event runs 30 Jun – 2 Jul 2026; one transport tab per day.
const DAYS = [
  { key: '2026-06-30', label: '30 June' },
  { key: '2026-07-01', label: '1 July' },
  { key: '2026-07-02', label: '2 July' },
]

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
    >
      {children}
      <span className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full ${active ? 'bg-blue-600' : 'bg-transparent'}`} />
    </button>
  )
}

// Outbound event shuttle block (e.g. dinner): N van waves from Bayview to the venue.
function ShuttleSection({ sh, done, busy, onToggle }: {
  sh: ShuttleResult
  done: Set<string>
  busy: string | null
  onToggle: (key: string, next: boolean) => void
}) {
  const totalPax = sh.trips.reduce((n, t) => n + t.guests.length, 0)
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-slate-700">{sh.title} → {sh.destination}</h2>
      <p className="text-xs text-slate-500 mb-3">
        Bayview → {sh.destination} · first van {sh.departTime} · {sh.legMin} min drive · {sh.trips.length} vans · {totalPax} pax
      </p>
      <div className="grid gap-3">
        {sh.trips.map((t) => {
          const isDone = done.has(t.key)
          const present = t.guests.filter((g) => g.checkedIn).length
          return (
            <Card key={t.key} className={`p-4 transition-opacity ${isDone ? 'opacity-60 ring-1 ring-inset ring-emerald-600/20' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">Van {t.vanNo}</span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-600/20">
                    <IconPin className="w-3 h-3" />{sh.destination}
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1.5">
                    <IconClock className="w-4 h-4 text-slate-400" />
                    <b className="text-blue-600">Depart {t.departTime}</b> · arrive {t.arriveTime}
                  </span>
                </div>
                <button
                  disabled={busy === t.key}
                  onClick={() => onToggle(t.key, !isDone)}
                  className={`${completeBtn} no-print disabled:opacity-50 ${isDone ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}
                  title={isDone ? 'Trip completed — click to undo' : 'Mark this trip as completed'}
                >
                  {isDone ? <><IconCheck className="w-3.5 h-3.5" />Completed</> : <><IconCheck className="w-3.5 h-3.5" />Mark complete</>}
                </button>
              </div>
              <ul className="mt-3 text-sm text-slate-600 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                {t.guests.map((g) => (
                  <li key={g.id} className="truncate">
                    <span className={g.checkedIn ? 'text-blue-600 font-semibold' : ''} title={g.checkedIn ? 'Checked in (present)' : 'Not checked in yet'}>{g.name}</span>
                    <span className="text-slate-400" title={g.agency}> · {shortAgency(g.agency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-col items-end">
                <Chip>{t.guests.length} / {DEFAULT_CONFIG.vanCapacity} pax</Chip>
                <span className="mt-1 text-xs text-blue-600 font-medium">{present}/{t.guests.length} checked in</span>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

export default function TransportPage() {
  const { data: rawGuests = [] } = useSWR('transport-guests', () => getTransportGuests(), { refreshInterval: 5000, revalidateOnFocus: true })
  const { data: statuses = [], mutate: mutateStatus } = useSWR('trip-statuses', () => getTripStatuses(), { refreshInterval: 5000, revalidateOnFocus: true })
  const [busy, setBusy] = useState<string | null>(null)

  const done = useMemo(() => new Set(statuses.map((s) => s.trip_key)), [statuses])

  const guests: Guest[] = rawGuests.map((d) => ({
    id: d.id, name: d.name, agency: d.agency ?? '',
    arrivalDate: d.arrival_date ?? '', arrivalTime: d.arrival_time,
    checkedIn: d.checked_in, venue: d.arrival_venue, group: d.transport_group, category: d.category,
  }))
  const trips = suggestTrips(guests, DEFAULT_CONFIG)

  // Outbound event shuttles (dinner, etc.) carry all participants from the hotel.
  const participants = guests.filter((g) => g.category !== 'committee')
  const shuttles: ShuttleResult[] = EVENT_SHUTTLES.map((s) => suggestShuttle(participants, s, DEFAULT_CONFIG.vanCapacity))
  const shuttlesByDay = shuttles.reduce<Record<string, ShuttleResult[]>>((acc, s) => {
    (acc[s.day] ??= []).push(s); return acc
  }, {})

  const byDate = trips.reduce<Record<string, SuggestedTrip[]>>((acc, t) => {
    (acc[t.date] ??= []).push(t); return acc
  }, {})

  const [activeDay, setActiveDay] = useState(DAYS[0].key)
  const dayTrips = byDate[activeDay] ?? []
  const dayShuttles = shuttlesByDay[activeDay] ?? []
  const dayPax = dayTrips.reduce((n, t) => n + t.guests.length, 0)
  const dayDone = dayTrips.filter((t) => done.has(t.key))
  const dayPickedUp = dayDone.reduce((n, t) => n + t.guests.length, 0)

  async function toggleComplete(key: string, next: boolean) {
    setBusy(key)
    try { await setTripCompleted(key, next); await mutateStatus() }
    finally { setBusy(null) }
  }

  return (
    <div>
      {/* On-screen interactive view — hidden when printing */}
      <div className="print:hidden">
      <PageHeader
        title="Transport"
        subtitle={`Arrival pickups → Bayview · Jetty +${DEFAULT_CONFIG.venue.Jetty.bufferMin}m wait/${DEFAULT_CONFIG.venue.Jetty.legMin}m drive · Airport +${DEFAULT_CONFIG.venue.Airport.bufferMin}m/${DEFAULT_CONFIG.venue.Airport.legMin}m · van ${DEFAULT_CONFIG.vanCapacity} pax · self-drive excluded`}
        actions={<button onClick={() => window.print()} className={btnSecondary}>Print driver sheet</button>}
      />

      {/* One tab per event day */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {DAYS.map((d) => (
          <TabButton key={d.key} active={activeDay === d.key} onClick={() => setActiveDay(d.key)}>
            {d.label}
            <span className="ml-2 text-xs tabular-nums text-slate-400">
              {(byDate[d.key]?.length ?? 0) + (shuttlesByDay[d.key]?.reduce((n, s) => n + s.trips.length, 0) ?? 0)}
            </span>
          </TabButton>
        ))}
      </div>

      {dayTrips.length === 0 && dayShuttles.length === 0 ? (
        <EmptyState title="Nothing scheduled this day" hint="Arrival pickups and event shuttles for this day appear here." />
      ) : (
        <>
          {dayTrips.length > 0 && (
          <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Arrival pickups → Bayview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Stat accent label="Picked up" value={`${dayPickedUp}`} hint={`of ${dayPax} pax`} icon={<IconCheck className="w-[18px] h-[18px]" />} />
            <Stat label="Trips done" value={`${dayDone.length}`} hint={`of ${dayTrips.length} trips`} icon={<IconCheck className="w-[18px] h-[18px]" />} />
            <Stat label="Total trips" value={`${dayTrips.length}`} hint="van runs" icon={<IconTransport className="w-[18px] h-[18px]" />} />
            <Stat label="Total pax" value={`${dayPax}`} hint="need a ride" icon={<IconTransport className="w-[18px] h-[18px]" />} />
          </div>

          <div className="grid gap-3">
            {dayTrips.map((t) => {
              const isDone = done.has(t.key)
              const arrived = t.guests.filter((g) => g.checkedIn).length
              return (
                <Card key={t.key} className={`p-4 transition-opacity ${isDone ? 'opacity-60 ring-1 ring-inset ring-emerald-600/20' : ''}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">Trip {t.tripNo}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${t.venue === 'Airport' ? 'bg-violet-50 text-violet-700 ring-violet-600/20' : 'bg-sky-50 text-sky-700 ring-sky-600/20'}`}>
                            <IconPin className="w-3 h-3" />From {t.venue}
                          </span>
                          {t.group && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-600/20" title={`Assigned ride — ${t.group}`}>
                              Group · {t.group}
                            </span>
                          )}
                          <span className="text-sm text-slate-500 flex items-center gap-1.5">
                            <IconClock className="w-4 h-4 text-slate-400" />
                            <b className="text-blue-600">Pickup {t.pickupTime}</b>
                          </span>
                        </div>
                        <button
                          disabled={busy === t.key}
                          onClick={() => toggleComplete(t.key, !isDone)}
                          className={`${completeBtn} no-print disabled:opacity-50 ${isDone ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'}`}
                          title={isDone ? 'Trip completed — click to undo' : 'Mark this trip as completed'}
                        >
                          {isDone ? <><IconCheck className="w-3.5 h-3.5" />Completed</> : <><IconCheck className="w-3.5 h-3.5" />Mark complete</>}
                        </button>
                      </div>

                      {t.conflict && (
                        <div className="text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-600/20 rounded-md px-2 py-1 text-xs mt-2 inline-block">
                          Pickup delayed from {t.idealPickupTime} (van still out)
                        </div>
                      )}

                      <ul className="mt-3 text-sm text-slate-600 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                        {t.guests.map((g) => (
                          <li key={g.id} className="flex items-baseline justify-between gap-2">
                            <span className="truncate">
                              <span className={g.checkedIn ? 'text-blue-600 font-semibold' : ''} title={g.checkedIn ? 'Arrived (checked in)' : 'Not arrived yet'}>{g.name}</span>
                              <span className="text-slate-400" title={g.agency}> · {shortAgency(g.agency)}</span>
                            </span>
                            <span className="tabular-nums text-xs text-slate-400 shrink-0">{g.arrivalTime}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 flex flex-col items-end">
                        <Chip>{t.guests.length} / {DEFAULT_CONFIG.vanCapacity} pax</Chip>
                        <span className="mt-1 text-xs text-blue-600 font-medium">{arrived}/{t.guests.length} arrived</span>
                      </div>
                    </Card>
                  )
                })}
          </div>
          </section>
          )}

          {dayShuttles.map((sh) => (
            <ShuttleSection key={sh.title + sh.day} sh={sh} done={done} busy={busy} onToggle={toggleComplete} />
          ))}
        </>
      )}
      </div>

      {/* Print-only driver sheet: clean per-trip pickup list, no app chrome */}
      {(dayTrips.length > 0 || dayShuttles.length > 0) && (
        <div className="hidden print:block text-black">
          <h1 className="text-xl font-bold">Transport — Driver Sheet · {fmtFullDay(activeDay)}</h1>
          <p className="text-xs mb-4">Bayview Hotel · single van {DEFAULT_CONFIG.vanCapacity} pax · self-drive excluded</p>
          {dayTrips.length > 0 && (
            <section className="mb-5">
              <h2 className="text-base font-bold border-b-2 border-black pb-1 mb-2">Arrival pickups → Bayview</h2>
              <div className="space-y-3">
                {dayTrips.map((t) => (
                  <div key={t.key} className="break-inside-avoid border border-slate-400 rounded">
                    <div className={`flex items-center justify-between px-2 py-1 text-sm font-bold ${done.has(t.key) ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <span>
                        {done.has(t.key) && <span className="mr-1">☑</span>}
                        Trip {t.tripNo} · From {t.venue}{t.group ? ` · Group (${t.group})` : ''}
                      </span>
                      <span>Pickup {t.pickupTime} · {t.guests.length} pax{done.has(t.key) ? ' · ✓ Completed' : ''}</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wide text-slate-500 border-b border-slate-300">
                          <th className="w-7 px-2 py-0.5 font-semibold text-center">✓</th>
                          <th className="px-2 py-0.5 font-semibold">Passenger</th>
                          <th className="px-2 py-0.5 font-semibold text-right">Arrival</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.guests.map((g) => (
                          <tr key={g.id} className="border-b border-slate-200 last:border-0">
                            <td className="px-2 py-1 text-center align-middle">
                              <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-500 rounded-sm text-[10px] leading-none ${done.has(t.key) ? 'bg-slate-800 text-white' : ''}`}>{done.has(t.key) ? '✓' : ''}</span>
                            </td>
                            <td className="px-2 py-1">{g.name} <span className="text-slate-500">· {shortAgency(g.agency)}</span></td>
                            <td className="px-2 py-1 text-right tabular-nums whitespace-nowrap">{g.arrivalTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Event shuttles (dinner, etc.) — outbound from Bayview */}
          {dayShuttles.map((sh) => (
            <section key={sh.title + sh.day} className="mb-5">
              <h2 className="text-base font-bold border-b-2 border-black pb-1 mb-2">{fmtFullDay(sh.day)} — {sh.title} → {sh.destination}</h2>
              <div className="space-y-3">
                {sh.trips.map((t) => (
                  <div key={t.key} className="break-inside-avoid border border-slate-400 rounded">
                    <div className={`flex items-center justify-between px-2 py-1 text-sm font-bold ${done.has(t.key) ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <span>
                        {done.has(t.key) && <span className="mr-1">☑</span>}
                        Van {t.vanNo} · Bayview → {sh.destination}
                      </span>
                      <span>Depart {t.departTime} · arrive {t.arriveTime} · {t.guests.length} pax{done.has(t.key) ? ' · ✓ Completed' : ''}</span>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {t.guests.map((g) => (
                          <tr key={g.id} className="border-b border-slate-200 last:border-0">
                            <td className="px-2 py-1 text-center align-middle w-7">
                              <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-500 rounded-sm text-[10px] leading-none ${done.has(t.key) ? 'bg-slate-800 text-white' : ''}`}>{done.has(t.key) ? '✓' : ''}</span>
                            </td>
                            <td className="px-2 py-1">{g.name} <span className="text-slate-500">· {shortAgency(g.agency)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
