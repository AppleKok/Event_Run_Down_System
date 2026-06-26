import { handlers } from '@/auth'
export const { GET, POST } = handlers
// SMTP send + DB lookups can take a few seconds (cross-region); allow headroom.
export const maxDuration = 30
