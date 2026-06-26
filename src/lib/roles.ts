import { createClient } from './supabase/server'

export type Role = 'admin' | 'editor' | 'viewer'
export interface Profile { id: string; email: string; display_name: string | null; role: Role }

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles').select('id, email, display_name, role').eq('id', user.id).single()
  return (data as Profile) ?? null
}

export function canWrite(role: Role | undefined): boolean {
  return role === 'admin' || role === 'editor'
}
