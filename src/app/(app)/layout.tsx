import { redirect } from 'next/navigation'
import { getProfile } from '../../lib/roles'
import { Nav } from '../../components/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Nav email={profile.email} role={profile.role} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
