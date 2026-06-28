// Shared presentational primitives — the design system. No hooks/handlers,
// so these work in both server and client component trees.
import type { ReactNode } from 'react'

// ---- Buttons (class constants so any page/form stays visually consistent) ----
export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
export const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors'
export const btnGhost =
  'inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 rounded-md p-1.5 text-sm transition-colors'
export const inputClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition'

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>{children}</div>
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 no-print">{actions}</div>}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  accent = false,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  accent?: boolean
  icon?: ReactNode
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        {icon && <span className={accent ? 'text-blue-500' : 'text-slate-300'}>{icon}</span>}
      </div>
      <div className={`mt-2 text-3xl font-bold tabular-nums leading-none ${accent ? 'text-blue-600' : 'text-slate-900'}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-slate-400 mt-1.5">{hint}</div>}
    </Card>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-slate-700">{children}</h2>
      {right && <div className="text-sm">{right}</div>}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <Card className="p-10 text-center">
      <p className="text-slate-600 font-medium">{title}</p>
      {hint && <p className="text-sm text-slate-400 mt-1">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  )
}

// Small neutral chip (categories, agency, etc.)
export function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ${className}`}>
      {children}
    </span>
  )
}
