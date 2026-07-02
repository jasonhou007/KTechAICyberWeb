/**
 * @file 291-capture-a11y.mjs
 * @description MOBILE Lighthouse a11y capture for the 12 key routes
 * (About/Services/Contact/News) — mobile counterpart of #289. Reuses #226/#289
 * harness profile with Lighthouse default (mobile) formFactor. Asserts
 * formFactor==='mobile' (iter-16 device-class honesty gate) + a11y>=0.90 each.
 *
 * Measurement-only: no production code is changed by this script.
 *
 * @ticket #291
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKTREE = resolve(__dirname, '..')
// Evidence lives in the DevAgent repo so it persists after the lane worktree
// is removed. WORKTREE/.. is the website repo root; the DevAgent evidence
// root is three levels up from the website worktree.
const EVIDENCE_DIR = resolve(WORKTREE, '..', '..', '..', 'projects', 'kttech-cyber', 'projects', '291', 'evidence')
const BASE = process.env.LH_BASE || 'http://localhost:4173/KTechAICyberWeb'
const THRESHOLD = 0.90

const ROUTES = [
  'about',
  'services/blockchain',
  'services/supply-chain-finance',
  'services/project-and-program-management',
  'services/big-data-ai',
  'services/retail-lending',
  'services/cross-border-payment',
  'services/digital-asset-custody',
  'services/stablecoin',
  'contact',
  'news',
  'news/ktech-achieves-iso27001-certification',
]

if (!existsSync(EVIDENCE_DIR)) mkdirSync(EVIDENCE_DIR, { recursive: true })

const LIGHTHOUSE = resolve(WORKTREE, 'node_modules', '.bin', 'lighthouse')
const CHROME_FLAGS = '--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage'

const results = []
let allPass = true

for (const route of ROUTES) {
  const url = `${BASE}/${route}`
  // slug: strip the services/ or news/ prefix; news-detail route uses the
  // literal 'news-detail' slug to mirror #289's convention.
  let slug
  if (route === 'news/ktech-achieves-iso27001-certification') {
    slug = 'news-detail'
  } else {
    slug = route.replace(/^(services|news)\//, '')
  }
  const outJson = resolve(EVIDENCE_DIR, `lighthouse-mobile-${slug}.report.json`)
  // No --preset: Lighthouse's default formFactor IS mobile (Moto G Power
  // emulation + throttling). Passing --preset=desktop would flip it.
  const args = [
    url,
    `--output=json`,
    `--output-path=${outJson}`,
    `--quiet`,
    `--chrome-flags=${CHROME_FLAGS}`,
    `--only-categories=accessibility`,
  ]
  console.log(`\n▶ capturing ${url}`)
  try {
    execFileSync(LIGHTHOUSE, args, { cwd: WORKTREE, stdio: 'inherit', timeout: 180000 })
  } catch (e) {
    console.error(`  ✗ lighthouse failed for ${route}: ${e.message}`)
    allPass = false
    results.push({ route, url, error: e.message })
    continue
  }
  if (!existsSync(outJson)) {
    console.error(`  ✗ no report written for ${route}`)
    allPass = false
    results.push({ route, url, error: 'no-report-written' })
    continue
  }
  const report = JSON.parse(readFileSync(outJson, 'utf8'))
  const formFactor = report?.configSettings?.formFactor
  const preset = report?.configSettings?.preset
  const a11y = report?.categories?.accessibility?.score
  const failedAudits = Object.values(report?.audits || {})
    .filter((a) => a.score !== null && a.score < 1 && report.categories.accessibility.auditRefs.some((r) => r.id === a.id && r.weight > 0))
    .map((a) => ({ id: a.id, title: a.title, score: a.score }))
  const deviceOk = formFactor === 'mobile'
  const scoreOk = typeof a11y === 'number' && a11y >= THRESHOLD
  const pass = deviceOk && scoreOk
  if (!pass) allPass = false
  console.log(`  formFactor=${formFactor} preset=${preset} a11y=${a11y} → ${pass ? 'PASS' : 'FAIL'} (>=${THRESHOLD})`)
  if (failedAudits.length) console.log(`  failed weighted a11y audits: ${failedAudits.map((f) => f.id).join(', ')}`)
  results.push({ route, url, outFile: outJson, formFactor, preset, a11y, threshold: THRESHOLD, pass, failedAudits })
}

const summary = {
  ticket: 291,
  captured_at: new Date().toISOString(),
  base_url: BASE,
  preset: 'mobile(default)',
  threshold: THRESHOLD,
  device_profile_note: "iter-16 honesty gate: every report's configSettings.formFactor MUST == 'mobile' (Lighthouse default — no --preset passed)",
  routes: results,
  all_pass: allPass,
}
const summaryPath = resolve(EVIDENCE_DIR, 'SUMMARY.json')
writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
console.log(`\n=== SUMMARY written to ${summaryPath} ===`)
console.log(`all_pass=${allPass}`)
console.table(
  results.map((r) => ({
    route: r.route,
    formFactor: r.formFactor ?? 'ERR',
    a11y: r.a11y ?? 'ERR',
    pass: r.pass ?? false,
  })),
)

if (!allPass) {
  console.error('\n✗ One or more routes failed the a11y threshold or device-profile check.')
  process.exit(1)
}
console.log('\n✓ All 12 routes: a11y >= 0.90 on mobile formFactor.')
