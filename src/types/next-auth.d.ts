import type { DefaultSession } from 'next-auth'
type Role = 'admin' | 'editor' | 'viewer'
declare module 'next-auth' {
  interface Session {
    user: { role: Role } & DefaultSession['user']
  }
}
declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: Role
  }
}
