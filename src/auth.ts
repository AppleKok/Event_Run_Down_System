import NextAuth from 'next-auth'
import Nodemailer from 'next-auth/providers/nodemailer'
import NeonAdapter from '@auth/neon-adapter'
import { Pool } from '@neondatabase/serverless'
import nodemailer from 'nodemailer'
import type { Role } from '@/lib/roles'

function neonUrl() {
  const url = new URL(process.env.DATABASE_URL!)
  url.searchParams.delete('channel_binding') // not used by the serverless driver
  return url.toString()
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  // Pool MUST be created inside the factory (per-request), not at module scope.
  const pool = new Pool({ connectionString: neonUrl() })

  // Allowlist lookup — returns the assigned role, or null if the email isn't approved.
  async function allowedRole(email?: string | null): Promise<Role | null> {
    if (!email) return null
    const { rows } = await pool.query(
      'select role from allowed_emails where lower(email) = lower($1) limit 1',
      [email],
    )
    return (rows[0]?.role as Role) ?? null
  }

  return {
    adapter: NeonAdapter(pool),
    session: { strategy: 'database' },
    providers: [
      Nodemailer({
        server: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
        from: process.env.EMAIL_FROM ?? 'noreply@dls.global',
        async sendVerificationRequest({ identifier: email, url, provider }) {
          // Gate 1: only send magic links to approved emails. Non-approved → silently no-op
          // (prevents SMTP abuse and avoids revealing who is/isn't on the list).
          if (!(await allowedRole(email))) return
          const transport = nodemailer.createTransport(provider.server as nodemailer.TransportOptions)
          await transport.sendMail({
            to: email,
            from: provider.from,
            subject: 'Sign in to Event Run-Down',
            text: `Sign in to Event Run-Down:\n${url}\n\nIf you didn't request this, ignore this email.`,
            html: `<p>Sign in to <b>Event Run-Down</b>:</p>
                   <p><a href="${url}">Click here to sign in</a></p>
                   <p style="color:#888;font-size:12px">If you didn't request this, you can ignore this email.</p>`,
          })
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
      async signIn({ user }) {
        // Gate 2 (backstop): only approved emails may complete sign-in.
        const role = await allowedRole(user?.email)
        if (!role) return false
        // Keep the user's role in sync with the allowlist on every sign-in.
        await pool.query('update users set role = $1 where lower(email) = lower($2)', [role, user!.email])
        return true
      },
      session({ session, user }) {
        if (session.user) session.user.role = (user as { role?: Role }).role ?? 'viewer'
        return session
      },
    },
    trustHost: true,
  }
})
