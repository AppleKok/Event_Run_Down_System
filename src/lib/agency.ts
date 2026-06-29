// Display-only short form for the PBT/agency column (full name stays in the database).
export function shortAgency(agency: string | null): string {
  if (!agency) return '—'
  return agency
    .replace(/^Majlis Perbandaran Langkawi Bandaraya Pelancongan$/i, 'MP Langkawi')
    .replace(/^Majlis Perbandaran /i, 'MP ')
    .replace(/^Majlis Daerah /i, 'MD ')
    .replace(/^Majlis Bandaraya /i, 'MB ')
    .replace(/^PBT Taman Perindustrian /i, 'PBT ')
}
