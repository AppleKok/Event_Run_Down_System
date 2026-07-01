'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  IconOverview, IconGuests, IconCommittee, IconAttendance, IconRooms, IconTransport, IconRundown, IconTasks,
  IconFeedback, IconSignOut, IconMenu, IconClose,
} from './icons'

const items = [
  { href: '/', label: 'Overview', icon: IconOverview, exact: true },
  { href: '/guests', label: 'Guests', icon: IconGuests },
  { href: '/committee', label: 'Committee', icon: IconCommittee },
  { href: '/attendance', label: 'Attendance', icon: IconAttendance },
  { href: '/rooms', label: 'Rooms', icon: IconRooms },
  { href: '/transport', label: 'Transport', icon: IconTransport },
  { href: '/rundown', label: 'Run-Down', icon: IconRundown },
  { href: '/tasks', label: 'Tasks', icon: IconTasks },
  { href: '/feedback', label: 'Feedback', icon: IconFeedback },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-blue-600 text-white grid place-items-center font-bold text-sm shadow-sm">
        RD
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 leading-tight">Run-Down</div>
        <div className="text-[11px] text-slate-400 leading-tight">Langkawi · 30 Jun–1 Jul 2026</div>
      </div>
    </div>
  )
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
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
            onClick={onNavigate}
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
  )
}

function UserBlock({ email, role }: { email: string; role: string }) {
  return (
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
  )
}

export function Nav({ email, role }: { email: string; role: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the mobile drawer whenever the route changes (covers link taps and
  // browser back/forward). Adjusting state during render is the lint-clean pattern.
  const [prevPath, setPrevPath] = useState(pathname)
  if (pathname !== prevPath) {
    setPrevPath(pathname)
    setOpen(false)
  }

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      {/* Mobile top bar — sticky; hosts the brand + hamburger (hidden on lg+). */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="w-10 h-10 -mr-2 grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <IconMenu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile drawer + scrim (hidden on lg+). */}
      <div className={`lg:hidden ${open ? '' : 'pointer-events-none'} no-print`}>
        <div
          onClick={() => setOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] bg-white shadow-xl flex flex-col transition-transform duration-200 ease-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="px-4 h-14 flex items-center justify-between border-b border-slate-100 shrink-0">
            <Brand />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 -mr-2 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <IconClose className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
          <UserBlock email={email} role={role} />
        </aside>
      </div>

      {/* Desktop sidebar (lg+ only). */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-slate-200 bg-white min-h-screen flex-col no-print">
        <div className="px-5 py-5 border-b border-slate-100">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <UserBlock email={email} role={role} />
      </aside>
    </>
  )
}
