// Apply the Neon schema + seed. Run: node --env-file=.env.local scripts/migrate.mjs
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set. Run: node --env-file=.env.local scripts/migrate.mjs')
  process.exit(1)
}

// channel_binding is a libpq/TCP setting; the Neon HTTP driver does not use it.
const url = new URL(process.env.DATABASE_URL)
url.searchParams.delete('channel_binding')
const sql = neon(url.toString())

function statements(file) {
  return readFileSync(file, 'utf8')
    .split(/;\s*(?:\r?\n|$)/)                                   // split on statement-terminating ';'
    .map((chunk) =>
      chunk
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))        // drop pure-comment lines (keep inline comments)
        .join('\n')
        .trim(),
    )
    .filter((s) => s.length > 0)
}

async function runFile(label, file) {
  const stmts = statements(file)
  console.log(`\n--- ${label}: ${stmts.length} statements ---`)
  for (const stmt of stmts) await sql.query(stmt)
  console.log('OK')
}

async function main() {
  await runFile('Schema', join(__dirname, '../db/migrations/0001_init.sql'))

  const [{ count }] = await sql`select count(*)::int as count from guests`
  if (count > 0) console.log(`\nSeed skipped — guests already has ${count} rows.`)
  else await runFile('Seed', join(__dirname, '../db/seed.sql'))

  const [{ count: gc }] = await sql`select count(*)::int as count from guests`
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`
  console.log(`\nguests rows: ${gc}`)
  console.log('public tables:', tables.map((t) => t.table_name).join(', '))
  console.log('\nMigration complete.')
}

main().catch((e) => {
  console.error('MIGRATION FAILED:', e.message)
  process.exit(1)
})
