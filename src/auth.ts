import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import NeonAdapter from '@auth/neon-adapter'
import { Pool } from '@neondatabase/serverless'
import type { Role } from '@/lib/roles'

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  // Pool MUST be created inside the factory (per-request), not at module scope.
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.delete('channel_binding') // not used by the serverless driver
  const pool = new Pool({ connectionString: url.toString() })
  return {
    adapter: NeonAdapter(pool),
    session: { strategy: 'database' },
    providers: [Resend({ from: process.env.EMAIL_FROM ?? 'noreply@geopeta.com' })],
    pages: { signIn: '/login' },
    callbacks: {
      authorized({ auth: session, request: { nextUrl } }) {
        const path = nextUrl.pathname
        if (path.startsWith('/login') || path.startsWith('/api/auth')) return true
        return !!session?.user
      },
      session({ session, user }) {
        if (session.user) session.user.role = ((user as { role?: Role }).role ?? 'viewer')
        return session
      },
    },
    trustHost: true,
  }
})
