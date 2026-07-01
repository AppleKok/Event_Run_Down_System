'use server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'
import { isValidEmail, type SurveyInput, type SurveyAnswers } from '@/lib/survey'

export interface SurveyResponseRow {
  id: string
  nama: string | null
  emel: string | null
  organisasi: string | null
  jawatan: string | null
  answers: SurveyAnswers
  submitted_at: string
}

// PUBLIC — no auth. Called from the QR-accessed /survey form. Keep validation light
// so genuine feedback is never rejected; just require a name and store the rest as-is.
export async function submitSurvey(input: SurveyInput): Promise<void> {
  const nama = (input?.nama ?? '').trim()
  const emel = (input?.emel ?? '').trim()
  const organisasi = (input?.organisasi ?? '').trim()
  if (!nama) throw new Error('Sila isi nama anda.')
  if (!emel) throw new Error('Sila isi emel anda.')
  if (!isValidEmail(emel)) throw new Error('Format emel tidak sah.')
  if (!organisasi) throw new Error('Sila pilih PBT / Organisasi anda.')

  // Only persist the two answer shapes we expect (string | string[] of strings).
  const clean: SurveyAnswers = {}
  for (const [k, v] of Object.entries(input?.answers ?? {})) {
    if (typeof v === 'string') { if (v.trim()) clean[k] = v.trim() }
    else if (Array.isArray(v)) { const a = v.filter((x) => typeof x === 'string' && x.trim()); if (a.length) clean[k] = a }
  }

  await sql`
    insert into survey_responses (nama, emel, organisasi, jawatan, answers)
    values (${nama}, ${emel}, ${organisasi},
            ${(input.jawatan ?? '').trim() || null}, ${JSON.stringify(clean)}::jsonb)`
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthenticated')
  return session
}

// ADMIN — all responses, newest first.
export async function getSurveyResponses(): Promise<SurveyResponseRow[]> {
  await requireSession()
  const rows = await sql`
    select id, nama, emel, organisasi, jawatan, answers,
           to_char(submitted_at, 'DD/MM/YY HH24:MI') as submitted_at
    from survey_responses
    order by submitted_at desc`
  return rows as SurveyResponseRow[]
}
