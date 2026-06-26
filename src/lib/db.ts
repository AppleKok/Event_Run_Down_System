import 'server-only'
import { neon } from '@neondatabase/serverless'
const url = new URL(process.env.DATABASE_URL!)
url.searchParams.delete('channel_binding')
export const sql = neon(url.toString())
