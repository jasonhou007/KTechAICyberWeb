/**
 * @file no-kbight-typo.test.ts
 * @description #260 regression guard: the "KBight" misspelling of the brand
 * must NEVER reappear in user-visible SEO surfaces (index.html, manifest, e2e).
 *
 * WHY THIS TEST EXISTS:
 * The brand is "KTech" (index.html JSON-LD alternateName "KTech Fintech",
 * twitter:site "@ktech_fintech"). Eight meta/title/JSON-LD fields plus the
 * manifest name and the e2e title regex carried the typo "KBight". #260
 * corrects every occurrence. This test reads the source files directly so it
 * fails the build the moment the typo is reintroduced by copy-paste or a
 * generator — independent of any runtime/head wiring.
 *
 * RED-TEST PROOF: against the pre-fix tree these assertions fail (the typo is
 * present on index.html lines 9/19/20/26/31/48/89/105, manifest.json line 2,
 * and the e2e regex alternative).
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()

const readSource = (rel: string): string =>
  readFileSync(`${ROOT}/${rel}`, 'utf8')

describe('#260 typo elimination — no "KBight" anywhere in SEO surfaces', () => {
  it('index.html contains no case-insensitive "kbight"', () => {
    const html = readSource('index.html')
    expect(html.toLowerCase()).not.toContain('kbight')
  })

  it('public/manifest.json contains no case-insensitive "kbight"', () => {
    const manifest = readSource('public/manifest.json')
    expect(manifest.toLowerCase()).not.toContain('kbight')
  })

  it('tests/e2e/homepage.spec.ts title regex drops the KBight alternative', () => {
    const spec = readSource('tests/e2e/homepage.spec.ts')
    expect(spec.toLowerCase()).not.toContain('kbight')
  })

  it('git grep reports zero KBight occurrences in shipped surfaces', () => {
    // Walks the live working tree, so a typo reintroduced in ANY tracked file
    // (not just the three above) fails the build. Excludes this guard file
    // itself (its JSDoc legitimately references the misspelling it documents)
    // and node_modules.
    let out = ''
    try {
      out = execSync(
        "git grep -in kbight -- ':!node_modules' ':!src/__tests__/no-kbight-typo.test.ts'",
        { encoding: 'utf8' },
      )
    } catch {
      // git grep exits non-zero (and prints nothing on stdout) when there are
      // zero matches — that is exactly the GREEN state we want.
      out = ''
    }
    expect(out.trim()).toBe('')
  })
})
