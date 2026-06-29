/**
 * @file scoped-style-dead-selector.audit.test.ts
 * @description Issue #219 — scoped <style> dead-selector audit regression gate.
 * @ticket #219
 *
 * This gate has three blocks:
 *
 * (A) The 4 dead cross-component selectors removed from CyberOpsHud.vue are
 *     ABSENT. These were dead because they targeted child-rendered classes
 *     (.ops-needle owned by OpsGauge.vue, .ops-glitch owned by
 *     OpsAnomalyToast.vue) via plain descendant selectors inside a
 *     <style scoped> block, without :deep(). Vue compiles
 *     `.cyber-ops-hud .ops-needle` to `.cyber-ops-hud[data-v-A]
 *     .ops-needle[data-v-A]`, but the rendered .ops-needle carries the child's
 *     [data-v-B] — the selector never matches. See
 *     docs/issue-219-scoped-style-audit.md §4 for the full RED-PROOF.
 *
 *     RED-PROOF (this block): before the CyberOpsHud.vue edit, all 4
 *     expect(...).not.toMatch assertions FAIL because the selectors are still
 *     present at lines 465–466 and 475–476. After the edit they PASS.
 *
 * (B) Survivor regression net — asserts PRESENCE of dynamic-class selectors
 *     across 14 components that a future #188-style blind purge would
 *     incorrectly delete. Every selector here is ALIVE (verified by grep
 *     against commit eb91f84 — see the audit doc). This block PASSES at
 *     baseline and after the edit; its purpose is to BLOCK a future
 *     false-positive purge.
 *
 * (C) Reduced-motion kill intent is preserved — the @media
 *     (prefers-reduced-motion: reduce) block still declares animation: none,
 *     and the .reduced-motion .ops-scanlines class-guard survivor still exists.
 *
 * Pattern mirrors CyberOpsHud.visual-ac.test.ts: read the .vue source, strip
 * comments (so a commented-out rule cannot masquerade as active), assert with
 * regex.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Strip comments so they cannot masquerade as active CSS or selectors. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
}

/** Read + comment-strip a .vue source file relative to this test file. */
function readVue(rel: string): string {
  const p = path.resolve(__dirname, rel)
  const raw = fs.readFileSync(p, 'utf-8')
  return stripComments(raw)
}

describe('Issue #219 — CyberOpsHud.vue: dead cross-component selectors removed', () => {
  let src: string

  beforeAll(() => {
    src = readVue('../CyberOpsHud.vue')
    expect(src, 'CyberOpsHud.vue source must be readable').toBeTruthy()
    expect(src.length).toBeGreaterThan(1000)
  })

  // RED-PROOF for each: before the edit, the selector is present at lines
  // 465–466 / 475–476, so this assertion FAILS. After removing those 4 lines,
  // the regex no longer matches and the assertion PASSES.
  it('does not contain `.cyber-ops-hud .ops-needle` (dead: child-rendered, no :deep)', () => {
    expect(src).not.toMatch(/\.cyber-ops-hud\s+\.ops-needle\b/)
  })

  it('does not contain `.cyber-ops-hud .ops-glitch` (dead: child-rendered, no :deep)', () => {
    expect(src).not.toMatch(/\.cyber-ops-hud\s+\.ops-glitch\b/)
  })

  it('does not contain `.reduced-motion .ops-glitch` (dead: child-rendered, no :deep)', () => {
    expect(src).not.toMatch(/\.reduced-motion\s+\.ops-glitch\b/)
  })

  it('does not contain `.reduced-motion .ops-needle` (dead: child-rendered, no :deep)', () => {
    expect(src).not.toMatch(/\.reduced-motion\s+\.ops-needle\b/)
  })
})

describe('Issue #219 — survivor dynamic-class selectors intact (regression net)', () => {
  // Each entry: [relative path, label, regex that MUST match the live source].
  // Every selector here is alive at commit eb91f84 — verified by grep before
  // this test was written (see docs/issue-219-scoped-style-audit.md §3).
  // A future blind purge that deletes any of these will turn the matching
  // assertion RED and block the build.
  const survivors: Array<[string, string, RegExp]> = [
    ['../NeuralTerminal.vue', 'NeuralTerminal .blink (dynamic :class)', /\.blink\b/],
    ['../NeuralTerminal.vue', 'NeuralTerminal .decode-anim (dynamic)', /\.decode-anim\b/],
    ['../ops/OpsAnomalyToast.vue', 'OpsAnomalyToast .ops-glitch (child OWNS it)', /\.ops-glitch\b/],
    ['../ops/OpsAnomalyToast.vue', 'OpsAnomalyToast ops-toast-enter-active (<Transition>)', /ops-toast-enter-active/],
    ['../ops/OpsGauge.vue', 'OpsGauge .ops-needle (child OWNS it)', /\.ops-needle\b/],
    ['../ops/OpsEventLog.vue', 'OpsEventLog .ops-cat-security (dynamic)', /\.ops-cat-security\b/],
    ['../SettlementStream.vue', 'SettlementStream ss-fx-row--up (dynamic)', /ss-fx-row--up/],
    ['../Contact.vue', 'Contact content-fade-enter-active (<Transition>)', /content-fade-enter-active/],
    ['../Header.vue', 'Header router-link-active (vue-router)', /router-link-active/],
    ['../NewsCard.vue', 'NewsCard :deep(.cyber-image__img)', /:deep\(\s*\.cyber-image__img\s*\)/],
    ['../SolutionForge.vue', 'SolutionForge .scanlines (child-root inherited)', /\.scanlines\b/],
    ['../NavigationDropdown.vue', 'NavigationDropdown dropdown-fade-enter-active (<Transition>)', /dropdown-fade-enter-active/],
    ['../CyberOpsHud.vue', 'CyberOpsHud .ops-scanlines (survivor, own template)', /\.ops-scanlines\b/],
    ['../CyberOpsHud.vue', 'CyberOpsHud .cyber-ops-hud * wildcard (survivor)', /\.cyber-ops-hud\s*\*/],
  ]

  it.each(survivors)('%s — %s is present', (rel, _label, re) => {
    const s = readVue(rel)
    expect(s, `${rel} source must be readable`).toBeTruthy()
    expect(s, `expected ${rel} to match ${re}`).toMatch(re)
  })
})

describe('Issue #219 — reduced-motion kill intent preserved in CyberOpsHud.vue', () => {
  let src: string

  beforeAll(() => {
    src = readVue('../CyberOpsHud.vue')
  })

  it('keeps a @media (prefers-reduced-motion: reduce) block that declares animation: none', () => {
    // AC 3.2 (seizure-safe) — the @media block survived the 4-line removal.
    expect(src).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)[\s\S]*?animation:\s*none/i)
  })

  it('keeps the .reduced-motion .ops-scanlines class-guard survivor', () => {
    // The belt-and-suspenders class guard still targets the one survivor
    // selector that IS in CyberOpsHud's own template.
    expect(src).toMatch(/\.reduced-motion\s+\.ops-scanlines\b/)
  })
})
