'use client'
import { useState } from 'react'
import { submitSurvey } from '@/lib/actions/survey'
import {
  SURVEY_TITLE, SURVEY_SUBTITLE, PARTICIPANT_FIELDS, SURVEY_QUESTIONS,
  type SurveyAnswers,
} from '@/lib/survey'

const input =
  'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition'

export default function SurveyPage() {
  const [participant, setParticipant] = useState<Record<string, string>>({})
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [others, setOthers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function setSingle(qid: string, value: string) {
    setAnswers((a) => ({ ...a, [qid]: value }))
  }
  function toggleMulti(qid: string, value: string) {
    setAnswers((a) => {
      const cur = Array.isArray(a[qid]) ? (a[qid] as string[]) : []
      const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value]
      return { ...a, [qid]: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // Fold "Lain-lain" free text into <qid>_other for questions that have it.
      const merged: SurveyAnswers = { ...answers }
      for (const [qid, text] of Object.entries(others)) {
        if (text.trim()) merged[`${qid}_other`] = text.trim()
      }
      await submitSurvey({
        nama: participant.nama ?? '',
        emel: participant.emel ?? '',
        organisasi: participant.organisasi ?? '',
        jawatan: participant.jawatan ?? '',
        answers: merged,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Penghantaran gagal. Sila cuba lagi.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Terima kasih!</h1>
          <p className="text-sm text-slate-500 mt-1">Maklum balas anda telah dihantar. Kerjasama anda amat dihargai.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-2 bg-blue-600" />
          <div className="p-6">
            <h1 className="text-xl font-bold text-slate-900">{SURVEY_TITLE}</h1>
            <p className="text-sm text-slate-500 mt-1">{SURVEY_SUBTITLE}</p>
          </div>
        </div>

        {/* Section A — participant */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-4">A · Maklumat Peserta</h2>
          <div className="space-y-4">
            {PARTICIPANT_FIELDS.map((f) => (
              <label key={f.id} className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1.5">
                  {f.label}{f.required && <span className="text-red-500"> *</span>}
                </span>
                <input
                  type={'type' in f && f.type === 'email' ? 'email' : 'text'}
                  required={f.required}
                  value={participant[f.id] ?? ''}
                  onChange={(e) => setParticipant((p) => ({ ...p, [f.id]: e.target.value }))}
                  className={input}
                />
              </label>
            ))}
          </div>
        </section>

        {/* Section B — feedback */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-600 mb-4">B · Maklum Balas Sesi</h2>
          <div className="space-y-7">
            {SURVEY_QUESTIONS.map((q, idx) => {
              const selected = answers[q.id]
              return (
                <fieldset key={q.id}>
                  <legend className="text-sm font-medium text-slate-800">
                    {idx + 1}. {q.label}
                  </legend>
                  {q.hint && <p className="text-xs text-slate-400 mt-0.5">{q.hint}</p>}
                  <div className="mt-2.5 space-y-2">
                    {q.options.map((opt) => {
                      const checked = q.type === 'single'
                        ? selected === opt
                        : Array.isArray(selected) && selected.includes(opt)
                      return (
                        <label key={opt} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-blue-400 bg-blue-50/60' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <input
                            type={q.type === 'single' ? 'radio' : 'checkbox'}
                            name={q.id}
                            checked={checked}
                            onChange={() => (q.type === 'single' ? setSingle(q.id, opt) : toggleMulti(q.id, opt))}
                            className={`w-4 h-4 ${q.type === 'single' ? 'accent-blue-600' : 'accent-blue-600'}`}
                          />
                          <span className="text-sm text-slate-700">{opt}</span>
                        </label>
                      )
                    })}
                    {q.hasOther && (
                      <div className="flex items-center gap-2 pl-3">
                        <span className="text-sm text-slate-500 shrink-0">Lain-lain:</span>
                        <input
                          value={others[q.id] ?? ''}
                          onChange={(e) => setOthers((o) => ({ ...o, [q.id]: e.target.value }))}
                          placeholder="Nyatakan…"
                          className={`${input} py-1.5`}
                        />
                      </div>
                    )}
                  </div>
                </fieldset>
              )
            })}
          </div>
        </section>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="sticky bottom-4">
          <button
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-semibold shadow-lg shadow-blue-600/20 transition-colors disabled:opacity-60"
          >
            {busy ? 'Menghantar…' : 'Hantar Maklum Balas'}
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 pb-4">* Medan wajib diisi</p>
      </form>
    </main>
  )
}
