'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { suggestTrips } from '@/lib/transport/engine'
import { DEFAULT_CONFIG, type Guest } from '@/lib/transport/types'

export interface DashboardData {
  daysToEvent: number
  guests: { total: number; roomsAssigned: number; specialDiets: number; confirmed: number; onSite: number; checkedOut: number }
  arrivalsByDay: { date: string; count: number }[]
  transport: { trips: number; pax: number; completedTrips: number; pickedUp: number }
  tasks: { total: number; open: number; done: number; blocked: number }
  upcoming: { id: string; day: string; start_time: string | null; title: string; location: string | null; pic: string | null }[]
  openTasks: { id: string; title: string; pic: string | null; due_date: string | null; status: string; category: string | null }[]
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthenticated')
}

export async function getDashboard(): Promise<DashboardData> {
  await requireSession()

  const guestAgg = (await sql`
    select
      count(*)::int as total,
      count(*) filter (
        where room_no is not null and btrim(room_no) <> '' and lower(btrim(room_no)) <> 'no room'
      )::int as rooms_assigned,
      count(*) filter (
        where food_allergy is not null and btrim(food_allergy) <> '' and lower(btrim(food_allergy)) <> 'tiada'
      )::int as special_diets,
      count(*) filter (where transport_status = 'Confirmed')::int as confirmed,
      count(*) filter (where checked_in_at is not null and checked_out_at is null)::int as on_site,
      count(*) filter (where checked_out_at is not null)::int as checked_out
    from guests where category <> 'committee'`)[0] as { total: number; rooms_assigned: number; special_diets: number; confirmed: number; on_site: number; checked_out: number }

  const arrivals = (await sql`
    select to_char(arrival_date, 'YYYY-MM-DD') as date, count(*)::int as count
    from guests where arrival_date is not null and category <> 'committee'
    group by arrival_date order by arrival_date`) as { date: string; count: number }[]

  // Reuse the pure transport engine to surface trip/pax totals.
  const tg = (await sql`
    select id, name, agency, to_char(arrival_date, 'YYYY-MM-DD') as arrival_date, arrival_time, arrival_venue, transport_group
    from guests`) as { id: string; name: string; agency: string | null; arrival_date: string | null; arrival_time: string | null; arrival_venue: string; transport_group: string | null }[]
  const guestsForTrips: Guest[] = tg.map((d) => ({
    id: d.id, name: d.name, agency: d.agency ?? '',
    arrivalDate: d.arrival_date ?? '', arrivalTime: d.arrival_time, venue: d.arrival_venue, group: d.transport_group,
  }))
  const trips = suggestTrips(guestsForTrips, DEFAULT_CONFIG)
  const pax = trips.reduce((n, t) => n + t.guests.length, 0)

  // Picked-up = pax on trips the committee has marked complete on the Transport page.
  const completedKeys = new Set(
    ((await sql`select trip_key from trip_status where completed_at is not null`) as { trip_key: string }[])
      .map((r) => r.trip_key),
  )
  const completedTrips = trips.filter((t) => completedKeys.has(t.key)).length
  const pickedUp = trips.filter((t) => completedKeys.has(t.key)).reduce((n, t) => n + t.guests.length, 0)

  const taskAgg = (await sql`
    select
      count(*)::int as total,
      count(*) filter (where status <> 'Done')::int as open,
      count(*) filter (where status = 'Done')::int as done,
      count(*) filter (where status = 'Blocked')::int as blocked
    from committee_tasks`)[0] as { total: number; open: number; done: number; blocked: number }

  const upcoming = (await sql`
    select id, to_char(day, 'YYYY-MM-DD') as day, start_time, title, location, pic
    from rundown_items
    order by day asc, start_time asc nulls last, sort_order asc
    limit 5`) as DashboardData['upcoming']

  const openTasks = (await sql`
    select id, title, pic, to_char(due_date, 'YYYY-MM-DD') as due_date, status, category
    from committee_tasks where status <> 'Done'
    order by due_date asc nulls last, created_at asc
    limit 6`) as DashboardData['openTasks']

  const daysToEvent = (await sql`select (date '2026-06-30' - current_date)::int as d`)[0].d as number

  return {
    daysToEvent,
    guests: {
      total: guestAgg.total,
      roomsAssigned: guestAgg.rooms_assigned,
      specialDiets: guestAgg.special_diets,
      confirmed: guestAgg.confirmed,
      onSite: guestAgg.on_site,
      checkedOut: guestAgg.checked_out,
    },
    arrivalsByDay: arrivals,
    transport: { trips: trips.length, pax, completedTrips, pickedUp },
    tasks: taskAgg,
    upcoming,
    openTasks,
  }
}
