/**
 * @file tests/unit/346-perf-about-selfdriving-async.spec.js
 * @description Source-of-fix gate for Issue #346 Commit 1 — lazy-load the
 * SelfDrivingDemo component on /about via `defineAsyncComponent`.
 *
 * Diagnosis (from #346 mobile LCP capture): /about LCP=3969ms (score 84).
 * The SelfDrivingDemo component (a heavy rAF-driven SVG/canvas pipeline
 * demo) is statically imported into About.vue, so Vite inlines it into the
 * /about route chunk and the browser must download+parse it BEFORE the LCP
 * image/text can paint. Home.vue already fixed this exact pattern (#203)
 * by switching to `defineAsyncComponent(() => import(...))`, which code-
 * splits the demo into its own chunk that loads in parallel with the LCP
 * critical path.
 *
 * The fix: mirror Home.vue's pattern verbatim in About.vue. The unit-test
 * burden is to assert the SOURCE uses the async form (not the static
 * import), and that the component is still wired into the template (so a
 * future refactor cannot silently delete the wiring).
 *
 * @ticket #346
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..', '..')
const ABOUT_PATH = resolve(ROOT, 'src/views/About.vue')

describe('#346 Commit 1 — About.vue lazy-loads SelfDrivingDemo via defineAsyncComponent', () => {
  let src
  let stripped
  beforeAll(() => {
    src = readFileSync(ABOUT_PATH, 'utf-8')
    // Strip block + line comments so a commented-out import cannot pass.
    stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
  })

  it('does NOT eagerly `import SelfDrivingDemo from ...SelfDrivingDemo.vue`', () => {
    const eagerRegex = /^\s*import\s+SelfDrivingDemo\s+from\s+['"][^'"]*SelfDrivingDemo\.vue['"]/m
    expect(
      stripped,
      'About.vue still statically imports SelfDrivingDemo — Vite inlines it into the route chunk, blocking /about LCP (#346)',
    ).not.toMatch(eagerRegex)
  })

  it('uses defineAsyncComponent(() => import(...SelfDrivingDemo.vue))', () => {
    const asyncRegex = /defineAsyncComponent\(\s*\(\)\s*=>\s*import\(['"][^'"]*SelfDrivingDemo\.vue['"]\)\s*\)/
    expect(
      stripped,
      'About.vue must wrap SelfDrivingDemo in defineAsyncComponent (mirrors Home.vue #203) — code-splits it out of the LCP critical path',
    ).toMatch(asyncRegex)
  })

  it('imports defineAsyncComponent from vue', () => {
    const vueImportRegex = /import\s*\{[^}]*\bdefineAsyncComponent\b[^}]*\}\s*from\s*['"]vue['"]/
    expect(
      stripped,
      'About.vue must add defineAsyncComponent to its `from \'vue\'` import list',
    ).toMatch(vueImportRegex)
  })

  it('still renders <SelfDrivingDemo in the template (wiring intact)', () => {
    expect(
      src,
      '<SelfDrivingDemo> tag missing from template — async-import is dead code without a render site',
    ).toMatch(/<SelfDrivingDemo/)
  })
})
