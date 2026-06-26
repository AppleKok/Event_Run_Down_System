import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Nav } from '@/components/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Nav email={session.user.email ?? ''} role={session.user.role ?? 'viewer'} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
