export type Role = 'admin' | 'editor' | 'viewer'
export function canWrite(role: Role | undefined): boolean {
  return role === 'admin' || role === 'editor'
}
