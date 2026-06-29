import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Nav } from '@/components/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return (
    <div className="lg:flex bg-slate-50 min-h-screen text-slate-700">
      <Nav email={session.user.email ?? ''} role={session.user.role ?? 'viewer'} />
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  )
}
