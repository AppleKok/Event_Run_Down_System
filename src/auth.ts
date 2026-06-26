import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { Pool } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import type { Role } from '@/lib/roles'

function neonUrl() {
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.delete('channel_binding') // not used by the serverless driver
  return url.toString()
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' }, // Credentials provider requires JWT sessions (no email/SMTP involved)
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? '').trim().toLowerCase()
        const password = String(creds?.password ?? '')
        if (!email || !password) return null
        const pool = new Pool({ connectionString: neonUrl() })
        try {
          const { rows } = await pool.query(
            'select id, email, name, role, password_hash from users where lower(email) = lower($1) limit 1',
            [email],
          )
          const u = rows[0]
          if (!u || !u.password_hash) return null // only seeded accounts can sign in (the allowlist)
          const ok = await bcrypt.compare(password, u.password_hash)
          if (!ok) return null
          return { id: String(u.id), email: u.email, name: u.name, role: u.role as Role }
        } finally {
          await pool.end().catch(() => {})
        }
      },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const path = nextUrl.pathname
      if (path.startsWith('/login') || path.startsWith('/api/auth')) return true
      return !!session?.user
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? 'viewer'
        token.uid = (user as { id?: string }).id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as Role) ?? 'viewer'
        session.user.id = (token.uid as string) ?? ''
      }
      return session
    },
  },
  trustHost: true,
})
