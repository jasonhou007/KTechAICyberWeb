/**
 * @file App.no-rum.test.ts
 * @description Deletion-honesty + shipped-app proof for #240 (remove RUM beacon).
 * @ticket #240
 *
 * #240 removes the performance-monitoring (RUM) debug panel + its beacon that
 * leaked into production (#187). This is a DELETION archetype (iter-14/30): the
 * proof is NOT "tests pass" (removing a suite always makes remaining tests
 * pass) — the proof is:
 *   (a) the deleted files are GONE from disk,
 *   (b) no DANGLING reference (import / provide / i18n key / dep) survives in
 *       the shipped app source,
 *   (c) the shipped App.vue footer no longer renders the dashboard.
 *
 * RED-TEST PROOF (iter-30 absence-gate asymmetry): the "no RumDashboard in
 * App.vue source" branch fails RED if anyone re-adds `<RumDashboard` to the
 * template OR re-imports it; the "files gone from disk" branch fails RED if the
 * files are restored. Both are real gates, not tautologies — they protect
 * against a partial revert that re-introduces only the wiring without the
 * component (which would crash the app) or only the component without the
 * wiring (dead code).
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

/** Strip comments so a commented-out reference cannot masquerade as absent. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

describe('#240 — RUM beacon fully removed (deletion-honesty gate)', () => {
  describe('deleted files are gone from disk', () => {
    const deleted = [
      'src/composables/useRumBeacon.js',
      'src/composables/__tests__/useRumBeacon.test.ts',
      'src/components/RumDashboard.vue',
      'src/components/__tests__/RumDashboard.test.ts',
      'tests/e2e/187-rum-beacon.spec.ts',
    ]
    for (const rel of deleted) {
      it(`${rel} no longer exists`, () => {
        expect(fs.existsSync(path.join(root, rel))).toBe(false)
      })
    }
  })

  describe('shipped App.vue has no RUM wiring (no dangling consumer)', () => {
    const appSrc = stripComments(
      fs.readFileSync(path.join(root, 'src/App.vue'), 'utf-8'),
    )

    it('does not import useRumBeacon', () => {
      expect(appSrc).not.toMatch(/useRumBeacon/)
    })

    it('does not import or register RumDashboard', () => {
      expect(appSrc).not.toMatch(/RumDashboard/)
    })

    it('does not render <RumDashboard> in the template (footer-rum gone)', () => {
      // Covers both the component tag and the footer-rum class hook.
      expect(appSrc).not.toMatch(/footer-rum/)
      expect(appSrc).not.toMatch(/<RumDashboard/)
    })

    it('does not call provide("rum", ...) (inject contract removed)', () => {
      expect(appSrc).not.toMatch(/provide\(\s*['"]rum['"]\s*,/)
    })

    it('does not reference rumEnabled or the rumMounted gate', () => {
      expect(appSrc).not.toMatch(/rumEnabled/)
      expect(appSrc).not.toMatch(/rumMounted/)
    })
  })

  describe('preferences store has no rumEnabled (state + action gone)', () => {
    const storeSrc = stripComments(
      fs.readFileSync(path.join(root, 'src/stores/preferences.js'), 'utf-8'),
    )
    it('state/persist/hydrate/reset carry no rumEnabled field', () => {
      expect(storeSrc).not.toMatch(/rumEnabled/)
    })
    it('setRumEnabled action is gone', () => {
      expect(storeSrc).not.toMatch(/setRumEnabled/)
    })
  })

  describe('web-vitals dependency is gone', () => {
    it('package.json no longer declares web-vitals', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
      expect(deps).not.toHaveProperty('web-vitals')
    })
  })

  describe('i18n locales carry no rum.* keys (en/zh parity)', () => {
    it('en.json has no rum top-level block', () => {
      const en = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en.json'), 'utf-8'))
      expect(en).not.toHaveProperty('rum')
    })
    it('zh.json has no rum top-level block', () => {
      const zh = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/zh.json'), 'utf-8'))
      expect(zh).not.toHaveProperty('rum')
    })
  })
})
