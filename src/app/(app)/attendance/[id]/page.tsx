'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getSessionRoster } from '@/lib/actions/sessions'
import { PageHeader, btnSecondary } from '@/components/ui'
import { SessionRoster } from '@/components/session-roster'

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  // Shares the SWR key with <SessionRoster>, so this only reads the name — no extra fetch.
  const { data } = useSWR(['session', id], () => getSessionRoster(id), { refreshInterval: 5000 })

  return (
    <div>
      <PageHeader
        title={data?.session.name ?? 'Session'}
        actions={<Link href="/attendance" className={btnSecondary}>← Attendance</Link>}
      />
      <SessionRoster sessionId={id} />
    </div>
  )
}
