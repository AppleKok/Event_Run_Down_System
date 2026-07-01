'use client'
import useSWR from 'swr'
import { useEffect, useMemo, useState } from 'react'
import { getSurveyResponses } from '@/lib/actions/survey'
import { SURVEY_QUESTIONS, PARTICIPANT_FIELDS, SURVEY_TITLE, SURVEY_SUBTITLE } from '@/lib/survey'
import { PageHeader, Card, Stat, btnSecondary, SectionTitle } from '@/components/ui'
import { IconDownload, IconFeedback } from '@/components/icons'
import { QrCode } from '@/components/qr-code'
import { downloadCsv } from '@/lib/csv'

const th = 'px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'
const td = 'px-3 py-2.5 align-top'

function asList(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string' && v) return [v]
  return []
}

export default function FeedbackPage() {
  const { data: rows = [] } = useSWR('survey-responses', () => getSurveyResponses(), {
    refreshInterval: 8000, revalidateOnFocus: true,
  })
  const [surveyUrl, setSurveyUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'summary' | 'responses'>('summary')
  const [pdfBusy, setPdfBusy] = useState(false)

  // Read the browser origin once after mount (server has no window). Both server and
  // client-hydration render '' first, then this updates — so no hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSurveyUrl(`${window.location.origin}/survey`) }, [])

  async function copyLink() {
    try { await navigator.clipboard.writeText(surveyUrl); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }

  // Per-question option counts (multi counts each pick) + collected "Lain-lain" text.
  const summary = useMemo(() => SURVEY_QUESTIONS.map((q) => {
    const counts: Record<string, number> = Object.fromEntries(q.options.map((o) => [o, 0]))
    const others: string[] = []
    for (const r of rows) {
      for (const val of asList(r.answers?.[q.id])) {
        if (val in counts) counts[val] += 1
      }
      const other = r.answers?.[`${q.id}_other`]
      if (typeof other === 'string' && other.trim()) others.push(other.trim())
    }
    const max = Math.max(1, ...Object.values(counts))
    return { q, counts, others, max }
  }), [rows])

  function exportCsv() {
    const otherQs = SURVEY_QUESTIONS.filter((q) => q.hasOther)
    const headers = [
      'Dihantar', ...PARTICIPANT_FIELDS.map((f) => f.label),
      ...SURVEY_QUESTIONS.map((q, i) => `${i + 1}. ${q.label}`),
      ...otherQs.map((q) => `${SURVEY_QUESTIONS.indexOf(q) + 1}. Lain-lain`),
    ]
    downloadCsv(
      'survey-responses.csv',
      headers,
      rows.map((r) => [
        r.submitted_at, r.nama ?? '', r.emel ?? '', r.organisasi ?? '', r.jawatan ?? '',
        ...SURVEY_QUESTIONS.map((q) => asList(r.answers?.[q.id]).join('; ')),
        ...otherQs.map((q) => { const o = r.answers?.[`${q.id}_other`]; return typeof o === 'string' ? o : '' }),
      ]),
    )
  }

  // Build a tabular PDF report: participant list + per-question response summary.
  // jsPDF is loaded lazily (browser-only, keeps it out of the initial bundle).
  async function downloadPdf() {
    if (rows.length === 0) return
    setPdfBusy(true)
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const M = 40
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const contentW = pageW - M * 2
      const finalY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

      // Header
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(20)
      doc.text(SURVEY_TITLE, M, 46)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90)
      doc.text(SURVEY_SUBTITLE, M, 62)
      const now = new Date().toLocaleString('en-GB')
      doc.text(`Dijana: ${now}    |    Jumlah maklum balas: ${rows.length}`, M, 78)
      doc.setTextColor(20)

      // A — participants
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      doc.text('A. Senarai Peserta', M, 98)
      autoTable(doc, {
        startY: 106,
        head: [['#', 'Nama', 'Emel', 'PBT / Organisasi', 'Jawatan', 'Dihantar']],
        body: rows.map((r, i) => [String(i + 1), r.nama ?? '—', r.emel ?? '—', r.organisasi ?? '—', r.jawatan ?? '—', r.submitted_at]),
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: { 0: { cellWidth: 20 }, 5: { cellWidth: 66 } },
        margin: { left: M, right: M },
      })

      // B — per-question summary
      let y = finalY() + 26
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      if (y > pageH - 80) { doc.addPage(); y = 48 }
      doc.text('B. Ringkasan Maklum Balas', M, y); y += 12

      SURVEY_QUESTIONS.forEach((q, idx) => {
        const s = summary[idx]
        if (y > pageH - 120) { doc.addPage(); y = 48 }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(20)
        const lines = doc.splitTextToSize(`${idx + 1}. ${q.label}`, contentW)
        doc.text(lines, M, y)
        y += lines.length * 12 + 4
        autoTable(doc, {
          startY: y,
          head: [['Pilihan', 'Bilangan', '%']],
          body: q.options.map((o) => {
            const c = s.counts[o]
            const pct = rows.length ? Math.round((c / rows.length) * 100) : 0
            return [o, String(c), `${pct}%`]
          }),
          styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
          headStyles: { fillColor: [226, 232, 240], textColor: 30 },
          columnStyles: { 1: { cellWidth: 60, halign: 'center' }, 2: { cellWidth: 46, halign: 'center' } },
          margin: { left: M, right: M },
        })
        y = finalY() + 6
        if (s.others.length) {
          const otxt = doc.splitTextToSize(`Lain-lain: ${s.others.join('; ')}`, contentW)
          if (y + otxt.length * 11 > pageH - 40) { doc.addPage(); y = 48 }
          doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(90)
          doc.text(otxt, M, y); y += otxt.length * 11 + 4
          doc.setTextColor(20)
        }
        y += 16
      })

      doc.save(`survey-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Feedback Survey"
          subtitle="Borang maklum balas awam — imbas QR untuk mengisi"
          actions={
            <>
              <button onClick={downloadPdf} disabled={pdfBusy || rows.length === 0} className={btnSecondary}>
                <IconDownload className="w-4 h-4" /> {pdfBusy ? 'PDF…' : 'PDF'}
              </button>
              <button onClick={exportCsv} className={btnSecondary}><IconDownload className="w-4 h-4" /> CSV</button>
            </>
          }
        />

        {/* Share / QR card */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="shrink-0 rounded-xl border border-slate-200 p-3 bg-white">
              {surveyUrl ? <QrCode value={surveyUrl} size={180} /> : <div className="w-[180px] h-[180px] bg-slate-100 rounded-lg animate-pulse" />}
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 text-blue-600 mb-1"><IconFeedback className="w-4 h-4" /><span className="text-sm font-semibold">Public form</span></div>
              <p className="text-sm text-slate-500 mb-3">Peserta imbas QR ini (atau buka pautan) untuk menghantar maklum balas sesi.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input readOnly value={surveyUrl} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-slate-50" />
                <button onClick={copyLink} className={btnSecondary}>{copied ? 'Copied!' : 'Copy link'}</button>
                <button onClick={() => window.print()} className={btnSecondary}>Print QR</button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats + tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <Stat accent label="Jumlah maklum balas" value={`${rows.length}`} icon={<IconFeedback className="w-[18px] h-[18px]" />} />
          <Stat label="PBT / Organisasi" value={`${new Set(rows.map((r) => (r.organisasi ?? '').trim().toLowerCase()).filter(Boolean)).size}`} hint="unik" />
          <Stat label="Berminat (S6: Ya)" value={`${rows.filter((r) => r.answers?.q6 === 'Ya').length}`} hint="follow-up leads" />
        </div>

        <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
          {(['summary', 'responses'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative px-4 py-2.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {t === 'summary' ? 'Ringkasan' : `Respons (${rows.length})`}
              <span className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full ${tab === t ? 'bg-blue-600' : 'bg-transparent'}`} />
            </button>
          ))}
        </div>

        {tab === 'summary' ? (
          <div className="space-y-6">
            {summary.map(({ q, counts, others, max }, idx) => (
              <Card key={q.id} className="p-5">
                <SectionTitle>{idx + 1}. {q.label}</SectionTitle>
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <div key={opt} className="flex items-center gap-3">
                      <span className="w-44 shrink-0 text-sm text-slate-600 truncate" title={opt}>{opt}</span>
                      <div className="flex-1 h-5 rounded bg-slate-100 overflow-hidden">
                        <div className="h-full bg-blue-500/80 rounded" style={{ width: `${(counts[opt] / max) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right text-sm tabular-nums text-slate-500">{counts[opt]}</span>
                    </div>
                  ))}
                </div>
                {others.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Lain-lain ({others.length})</p>
                    <ul className="text-sm text-slate-600 list-disc pl-5 space-y-0.5">
                      {others.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className={th}>Dihantar</th><th className={th}>Nama</th><th className={th}>Emel</th>
                  <th className={th}>PBT / Organisasi</th><th className={th}>Jawatan</th>
                  {SURVEY_QUESTIONS.map((q, i) => <th key={q.id} className={th} title={q.label}>{i + 1}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className={`${td} text-slate-400 tabular-nums whitespace-nowrap`}>{r.submitted_at}</td>
                    <td className={`${td} font-medium text-slate-900`}>{r.nama ?? '—'}</td>
                    <td className={`${td} text-slate-500`}>{r.emel ?? '—'}</td>
                    <td className={`${td} text-slate-600`}>{r.organisasi ?? '—'}</td>
                    <td className={`${td} text-slate-500`}>{r.jawatan ?? '—'}</td>
                    {SURVEY_QUESTIONS.map((q) => {
                      const vals = asList(r.answers?.[q.id])
                      const other = r.answers?.[`${q.id}_other`]
                      const extra = typeof other === 'string' && other ? [`Lain-lain: ${other}`] : []
                      const all = [...vals, ...extra]
                      return <td key={q.id} className={`${td} text-slate-600 min-w-[8rem]`}>{all.length ? all.join(', ') : '—'}</td>
                    })}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5 + SURVEY_QUESTIONS.length} className={`${td} text-center text-slate-400 py-10`}>Belum ada maklum balas.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Print-only QR poster */}
      <div className="hidden print:block text-center text-black py-10">
        <h1 className="text-2xl font-bold">{SURVEY_TITLE}</h1>
        <p className="text-base mb-6">{SURVEY_SUBTITLE}</p>
        <p className="text-lg font-semibold mb-4">Imbas untuk maklum balas / Scan for feedback</p>
        {surveyUrl && <div className="inline-block"><QrCode value={surveyUrl} size={320} /></div>}
        <p className="mt-4 text-sm">{surveyUrl}</p>
      </div>
    </div>
  )
}
