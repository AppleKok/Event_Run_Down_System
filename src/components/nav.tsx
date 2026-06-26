import Link from 'next/link'

export function Nav({ email, role }: { email: string; role: string }) {
  const items = [
    { href: '/guests', label: 'Guests' },
    { href: '/transport', label: 'Transport' },
  ]
  return (
    <aside className="w-56 shrink-0 border-r bg-white min-h-screen p-4">
      <div className="font-bold text-slate-800 mb-1">Run-Down</div>
      <div className="text-xs text-slate-400 mb-5">{email} · {role}</div>
      <nav className="flex flex-col gap-1">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700">
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
