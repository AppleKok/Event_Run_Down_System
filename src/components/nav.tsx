'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  IconOverview, IconGuests, IconTransport, IconRundown, IconTasks, IconSignOut,
} from './icons'

const items = [
  { href: '/', label: 'Overview', icon: IconOverview, exact: true },
  { href: '/guests', label: 'Guests', icon: IconGuests },
  { href: '/transport', label: 'Transport', icon: IconTransport },
  { href: '/rundown', label: 'Run-Down', icon: IconRundown },
  { href: '/tasks', label: 'Tasks', icon: IconTasks },
]

export function Nav({ email, role }: { email: string; role: string }) {
  const pathname = usePathname()
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white min-h-screen flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white grid place-items-center font-bold text-sm shadow-sm">
            RD
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 leading-tight">Run-Down</div>
            <div className="text-[11px] text-slate-400 leading-tight">Langkawi · 30 Jun–1 Jul 2026</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <div className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Committee
        </div>
        {items.map((i) => {
          const active = i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + '/')
          const Icon = i.icon
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              {i.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-100">
        <div className="px-2 pb-2">
          <div className="text-xs font-medium text-slate-700 truncate" title={email}>{email}</div>
          <div className="text-[11px] text-slate-400 capitalize">{role}</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        >
          <IconSignOut className="w-[18px] h-[18px]" /> Sign out
        </button>
      </div>
    </aside>
  )
}
