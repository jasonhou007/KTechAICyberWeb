/**
 * @file 289-capture-a11y.mjs
 * @description Desktop Lighthouse a11y capture for the 7 remaining services
 * sub-routes (#226 follow-up). Reuses the #226 harness profile
 * (preset=desktop → formFactor=desktop, no throttling). Saves one JSON
 * artifact per route under projects/289/evidence/ and asserts each a11y
 * score >= 0.90 + formFactor == 'desktop' (iter-16 device-class honesty gate).
 *
 * Measurement-only: no production code is changed by this script.
 *
 * @ticket #289
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
const EVIDENCE_DIR = resolve(WORKTREE, '..', '..', '..', 'projects', 'kttech-cyber', 'projects', '289', 'evidence')
const BASE = process.env.LH_BASE || 'http://localhost:4173/KTechAICyberWeb'
const THRESHOLD = 0.90

const ROUTES = [
  'services/supply-chain-finance',
  'services/project-and-program-management',
  'services/big-data-ai',
  'services/retail-lending',
  'services/cross-border-payment',
  'services/digital-asset-custody',
  'services/stablecoin',
]

if (!existsSync(EVIDENCE_DIR)) mkdirSync(EVIDENCE_DIR, { recursive: true })

const LIGHTHOUSE = resolve(WORKTREE, 'node_modules', '.bin', 'lighthouse')
const CHROME_FLAGS = '--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage'

const results = []
let allPass = true

for (const route of ROUTES) {
  const url = `${BASE}/${route}`
  const slug = route.replace(/^services\//, '')
  const outJson = resolve(EVIDENCE_DIR, `lighthouse-desktop-${slug}.report.json`)
  // Lighthouse writes the human-readable HTML when --output is html; we only
  // need the JSON artifact for the a11y score + device-profile assertion.
  const args = [
    url,
    `--output=json`,
    `--output-path=${outJson}`,
    `--preset=desktop`,
    `--quiet`,
    `--chrome-flags=${CHROME_FLAGS}`,
    `--only-categories=accessibility`,
  ]
  console.log(`\n▶ capturing ${url}`)
  try {
    execFileSync(LIGHTHOUSE, args, { cwd: WORKTREE, stdio: 'inherit', timeout: 120000 })
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
  const deviceOk = formFactor === 'desktop'
  const scoreOk = typeof a11y === 'number' && a11y >= THRESHOLD
  const pass = deviceOk && scoreOk
  if (!pass) allPass = false
  console.log(`  formFactor=${formFactor} preset=${preset} a11y=${a11y} → ${pass ? 'PASS' : 'FAIL'} (>=${THRESHOLD})`)
  if (failedAudits.length) console.log(`  failed weighted a11y audits: ${failedAudits.map((f) => f.id).join(', ')}`)
  results.push({ route, url, outFile: outJson, formFactor, preset, a11y, threshold: THRESHOLD, pass, failedAudits })
}

const summary = {
  ticket: 289,
  captured_at: new Date().toISOString(),
  base_url: BASE,
  preset: 'desktop',
  threshold: THRESHOLD,
  device_profile_note: "iter-16 honesty gate: every report's configSettings.formFactor MUST == 'desktop'",
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
console.log('\n✓ All 7 routes: a11y >= 0.90 on desktop formFactor.')
