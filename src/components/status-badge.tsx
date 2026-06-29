// Shared status pill — covers both transport statuses and committee-task statuses.
const STYLES: Record<string, string> = {
  // transport
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Changed: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  // tasks
  Todo: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  'In Progress': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Blocked: 'bg-red-50 text-red-700 ring-red-600/20',
  // attendance (arrival)
  'Not arrived': 'bg-slate-100 text-slate-500 ring-slate-500/20',
  'On site': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  // rooms (hotel)
  'Not checked in': 'bg-slate-100 text-slate-500 ring-slate-500/20',
  'Checked in': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Checked out': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Departed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  // shared
  Done: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  )
}
