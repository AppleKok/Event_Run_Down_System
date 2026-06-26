const STYLES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-emerald-100 text-emerald-800',
  Changed: 'bg-orange-100 text-orange-800',
  Done: 'bg-slate-200 text-slate-700',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? 'bg-slate-100 text-slate-600'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>
}
