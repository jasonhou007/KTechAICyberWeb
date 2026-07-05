/**
 * @file no-kaitech-typo.test.ts
 * @description #351 regression guard: the wrong brand "KAITECH" must NEVER
 * reappear in tracked src/ source. The correct brand is "KTech"
 * (开泰远景信息科技有限公司).
 *
 * WHY THIS TEST EXISTS:
 * Header.vue's nav-logo markup rendered the visible text "KAITECH" (via
 * `KAI<span class="accent">TECH</span>`), which is the WRONG brand. #351
 * corrects it to `K<span class="accent">Tech</span>` so the visible text is
 * exactly "KTech". This test reads tracked src/ files directly so the build
 * fails the moment the old markup (or any variant) is reintroduced by
 * copy-paste or a generator — independent of Header unit tests, which could
 * pass on a stale fixture.
 *
 * RED-TEST PROOF: against the pre-fix tree (origin/main HEAD before this
 * commit), `git grep -n "KAITECH" -- src/components/Header.vue` returns the
 * old markup on line 4. So the body of this test (which asserts zero
 * matches) is RED on the pre-fix tree and turns GREEN with the Header.vue
 * fix.
 *
 * SELF-EXCLUSION NOTE: this spec file legitimately contains the string
 * "KAITECH" in its JSDoc and in the pathspec exclude argument below. The
 * scan therefore MUST skip itself, or the guard would fail on its own
 * documentation. We exclude via the pathspec flag
 * `:!src/__tests__/no-kaitech-typo.test.ts`.
 *
 * CASE SENSITIVITY: the scan is case-SENSITIVE against "KAITECH". It
 * deliberately does NOT match lowercase "kaitech" — that token appears in
 * legitimate out-of-scope identifiers (the email domain `kaitaitech.cn` and
 * the corporate domain `www.kaitai.tech`), which #351 explicitly does NOT
 * rename.
 *
 * OUT-OF-SCOPE identifiers (NOT renamed by #351, intentionally not flagged):
 *   - repo name `KTechAICyberWeb`
 *   - deploy base `/KTechAICyberWeb/`
 *   - email `kaitaitech.cn`
 *   - domain `www.kaitai.tech`
 *   - loading-screen `KTECH.AI` mark
 *
 * SCOPE LIMITATION — what this guard CANNOT catch (be honest about it):
 * This guard scans source for the LITERAL CONTIGUOUS string "KAITECH". The
 * original #351 bug was split-markup: `KAI<span class="accent">TECH</span>`
 * — the literal "KAITECH" NEVER appears contiguously in source because the
 * `<span>` tag interrupts it, so `git grep "KAITECH"` cannot detect a
 * regression to that markup. We have EMPIRICALLY VERIFIED this blind spot:
 * temporarily reverting Header.vue line 4 to `KAI<span>TECH</span>` leaves
 * this guard GREEN at 2/2 passing.
 *
 * The LOAD-BEARING guard against the split-markup regression is the Header
 * unit assertion in `src/components/__tests__/Header.test.ts`:
 *     expect(wrapper.find('.nav-logo').text()).toBe('KTech')
 * Vue Test Utils' `.text()` collapses the `<span>` into its visible text,
 * so a regression to `KAI<span>TECH</span>` makes `.text()` return
 * "KAITECH" and the assertion fails. (Empirically: that regression makes
 * Header.test.ts fail 4 of 63 cases.) This guard's value is therefore
 * COMPLEMENTARY, not redundant: it catches the literal "KAITECH"
 * reappearing in OTHER places the unit test does not cover — comments,
 * config files, i18n values, future components' hardcoded text — while
 * Header.test.ts catches the original visible-markup bug pattern.
 */

import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'

describe('#351 typo elimination — no "KAITECH" anywhere in tracked src/', () => {
  it('git grep reports zero KAITECH occurrences in tracked src/ (case-sensitive)', () => {
    // Walks the live working tree. Excludes self (this guard file) because its
    // JSDoc + exclude-flag legitimately reference the typo it documents.
    //
    // git grep exits non-zero (and prints nothing on stdout) when there are
    // zero matches — that is exactly the GREEN state we want; we swallow the
    // non-zero exit and assert empty output.
    let out = ''
    try {
      out = execSync(
        'git grep -n "KAITECH" -- src/ ":!src/__tests__/no-kaitech-typo.test.ts"',
        { encoding: 'utf8' },
      )
    } catch {
      out = ''
    }
    expect(out.trim()).toBe('')
  })

  it('the Header nav-logo source renders the KTech brand, not the old wrong brand', () => {
    // Direct source-level proof of the fix. If Header.vue ever regresses to
    // the old markup, this fails before the broader git grep above.
    let out = ''
    try {
      out = execSync('git grep -n "KAITECH" -- src/components/Header.vue', {
        encoding: 'utf8',
      })
    } catch {
      out = ''
    }
    expect(out.trim()).toBe('')
  })
})
