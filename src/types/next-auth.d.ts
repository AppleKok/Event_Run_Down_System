import type { DefaultSession } from 'next-auth'

type Role = 'admin' | 'editor' | 'viewer'

declare module 'next-auth' {
  interface Session {
    user: { id: string; role: Role } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role
    uid?: string
  }
}
