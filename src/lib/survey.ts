// Session-feedback survey definition — Digital Transformation & GIS Innovation Workshop 2026.
// Plain data module (no 'use server'), imported by both the public form and the admin view.

export const SURVEY_TITLE = 'Borang Maklum Balas Sesi'
export const SURVEY_SUBTITLE = 'Digital Transformation & GIS Innovation Workshop 2026'

export interface SurveyQuestion {
  id: string
  label: string
  type: 'single' | 'multi'
  options: string[]
  hasOther?: boolean // renders a free-text "Lain-lain" input
  hint?: string
}

// PBT / organisasi choices for the dropdown (deduped; obvious typos normalised).
// "Lain-lain" lets participants enter anything not listed.
export const PBT_OPTIONS = [
  'Majlis Bandaraya Alor Setar',
  'Majlis Daerah Baling',
  'Majlis Daerah Bandar Baharu',
  'Majlis Daerah Pendang',
  'Majlis Daerah Yan',
  'Majlis Daerah Padang Terap',
  'Majlis Perbandaran Kubang Pasu',
  'Majlis Perbandaran Kulim',
  'Majlis Perbandaran Sungai Petani',
  'Majlis Perbandaran Langkawi Bandar Pelancongan',
  'PBT Taman Perindustrian Hi-Tech',
  'SUK Kedah',
] as const
export const PBT_OTHER = 'Lain-lain'

// Basic email shape check — shared by the form and the server action.
export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

// Section A — participant details.
export interface ParticipantField {
  id: string
  label: string
  required: boolean
  type: 'text' | 'email' | 'select'
  options?: readonly string[]
}
export const PARTICIPANT_FIELDS: ParticipantField[] = [
  { id: 'nama', label: 'Nama (nama penuh seperti dalam IC)', required: true, type: 'text' },
  { id: 'emel', label: 'Emel', required: true, type: 'email' },
  { id: 'organisasi', label: 'Nama PBT / Organisasi', required: true, type: 'select', options: PBT_OPTIONS },
  { id: 'jawatan', label: 'Jawatan / Jabatan', required: true, type: 'text' },
]

// Section B — session feedback.
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1',
    label: 'Secara keseluruhan, bagaimana penilaian anda terhadap sesi ini?',
    type: 'single',
    options: ['Sangat Baik', 'Baik', 'Memuaskan', 'Perlu Penambahbaikan'],
  },
  {
    id: 'q2',
    label: 'Adakah kandungan sesi mudah difahami dan relevan dengan keperluan PBT?',
    type: 'single',
    options: ['Sangat Relevan', 'Relevan', 'Kurang Relevan', 'Tidak Relevan'],
  },
  {
    id: 'q3',
    label: 'Topik manakah yang paling bermanfaat kepada anda?',
    type: 'multi',
    hasOther: true,
    options: ['GIS', 'AI', 'Pengkomputeran Awan', 'Keselamatan Siber', 'Humanoid', 'Smart City / Dashboard'],
  },
  {
    id: 'q4',
    label: 'Adakah sesi ini membantu anda memahami bagaimana teknologi boleh menyokong operasi PBT?',
    type: 'single',
    options: ['Sangat Membantu', 'Membantu', 'Kurang Membantu', 'Tidak Membantu'],
  },
  {
    id: 'q5',
    label: 'Apakah cabaran utama PBT anda dalam melaksanakan transformasi digital atau bandar pintar?',
    type: 'multi',
    hasOther: true,
    options: [
      'Bajet terhad', 'Kekurangan kepakaran teknikal', 'Integrasi sistem sedia ada',
      'Keselamatan data', 'Infrastruktur ICT / rangkaian', 'Penerimaan pengguna',
    ],
  },
  {
    id: 'q6',
    label: 'Adakah PBT anda berminat untuk mengetahui lebih lanjut tentang penyelesaian yang dibentangkan?',
    type: 'single',
    options: ['Ya', 'Tidak', 'Mungkin'],
  },
  {
    id: 'q7',
    label: 'Apakah bentuk susulan yang anda cadangkan?',
    type: 'multi',
    hasOther: true,
    options: [
      'Sesi demo penyelesaian', 'Bengkel teknikal', 'Perbincangan projek bersama PBT',
      'Lawatan tapak / penilaian keperluan', 'Cadangan teknikal dan anggaran kos',
    ],
  },
  {
    id: 'q8',
    label: 'Adakah pihak anda merancang untuk memodenkan atau memindahkan mana-mana aplikasi dalam tempoh 12–24 bulan akan datang?',
    type: 'single',
    options: ['Ya', 'Tidak', 'Dalam penilaian'],
  },
  {
    id: 'q9',
    label: 'Beban kerja manakah yang sedang dipertimbangkan untuk dipindahkan ke awan?',
    type: 'multi',
    hint: 'Boleh pilih lebih daripada satu jawapan',
    options: [
      'GIS', 'Portal Web', 'Pangkalan Data', 'Sandaran & Pemulihan Bencana',
      'AI / Analitik', 'Aplikasi Bandar Pintar', 'IoT', 'Lain-lain',
    ],
  },
  {
    id: 'q10',
    label: 'Apakah keutamaan utama pihak anda?',
    type: 'multi',
    options: [
      'Pengoptimuman kos', 'Keselamatan siber', 'Pemulihan bencana', 'Kebolehskalaan',
      'AI & Pembelajaran Mesin', 'Analitik Data', 'Perkhidmatan Digital Rakyat',
    ],
  },
]

// Answer value: a string (single) or string[] (multi); "<qid>_other" holds free text.
export type SurveyAnswers = Record<string, string | string[]>

export interface SurveyInput {
  nama: string
  emel: string
  organisasi: string
  jawatan: string
  answers: SurveyAnswers
}

// A question counts as answered if an option is picked (or, for "Lain-lain"
// questions, the free-text is filled). Used to enforce that nothing is left blank.
export function isAnswered(q: SurveyQuestion, answers: SurveyAnswers): boolean {
  const v = answers[q.id]
  const hasOpt = Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== ''
  if (hasOpt) return true
  if (q.hasOther) {
    const o = answers[`${q.id}_other`]
    return typeof o === 'string' && o.trim() !== ''
  }
  return false
}
