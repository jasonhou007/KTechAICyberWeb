/**
 * @file solution-forge.spec.ts
 * @description Playwright E2E for the AI Solution Forge configurator (#180).
 *
 * Verifies the shipped user flow on the real app:
 *  - the forge renders on the shipped homepage (>=5 industries, >=4 priorities),
 *  - configuring inputs + clicking Forge yields a blueprint card with a CTA
 *    router-link whose localized text is never a raw i18n key,
 *  - changing inputs after a result re-forges automatically (AC4),
 *  - reroll + reset behave,
 *  - the forge is keyboard-operable,
 *  - reduced-motion mode is safe (no strobing), and
 *  - the mobile viewport renders without throwing.
 *
 * Run: node_modules/.bin/playwright test solution-forge --project=chromium
 * (playwright.config.ts sets baseURL = http://localhost:3000; goto('/') resolves
 * to the /KTechAICyberWeb/ subpath.)
 *
 * @ticket #180
 */

import { test, expect } from '@playwright/test'
import { mountLazySection, forceClick } from './fixtures/lazy-mount-helper'

// #293 RESOLVED the webkit engine (Desktop Safari + Mobile Safari)
// handler-convergence flakiness across the Forge click→blueprint flows that
// #229 cited on this suite. The root cause was that the E2E effect predicates
// waited on the rAF-gated forge-result render (v-if="assemblyState==='done' &&
// recommendation" — 'done' is set only in finishForge() at the end of a
// ~17-frame requestAnimationFrame chain), so under webkit-CI load (rAF
// throttled) every fixed settleMs/retry budget (#244 forceClick) exhausted.
// The forge handler itself is correct — it flips a deterministic FSM value
// (assemblyState: idle→computing→done) synchronously inside finishForge(). The
// fix: SolutionForge now exposes :data-state="assemblyState" on its persistent
// [data-test="solution-forge"] root (mirroring NeuralCore's inferenceState), so
// expect(...).toHaveAttribute('data-state','done'|'idle') auto-polls until the
// FSM flips — no fixed timeout, no retry budget, rAF-cadence-independent.
//
// forceClick is RETAINED for the cheap idempotent chip/radio toggles
// (forge-industry, forge-priority), where the sibling-arc actionability race
// genuinely applies — but with its DEFAULT settleMs (no fixed 2500ms gap),
// since those toggles are not rAF-gated. forceClick is REMOVED from the
// forge/reroll/reset convergence actions (replaced by the FSM data-state wait).
//
// Note: Playwright's `browserName` fixture returns the BROWSER ENGINE name
// (e.g. 'webkit' for both the desktop 'webkit' project AND 'Mobile Safari',
// 'firefox' for the desktop firefox project). The mobile-viewport test below
// uses it to skip on firefox only (mobile viewport is covered on chromium +
// webkit).

test.describe('#180 AI Solution Forge configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // #224: SolutionForge is lazy-mounted inside <LazySection>; scroll it into
    // view so the inner component mounts before any query. Behavior unchanged.
    await mountLazySection(page, 'lazy-solution-forge', 'solution-forge')
  })

  test('the forge renders on the shipped homepage', async ({ page }) => {
    const forge = page.locator('[data-test="solution-forge"]')
    await expect(forge).toBeVisible()
    // >=5 industries + >=4 priorities prove the config UI mounted.
    const industries = await page.locator('[data-test="forge-industry"]').count()
    expect(industries).toBeGreaterThanOrEqual(5)
    const priorities = await page.locator('[data-test="forge-priority"]').count()
    expect(priorities).toBeGreaterThanOrEqual(4)
    // Forge button present.
    await expect(page.locator('[data-test="forge-button"]')).toBeVisible()
  })

  test('configure + Forge yields a blueprint card with a CTA router-link', async ({ page }) => {
    const industry = page.locator('[data-test="forge-industry"][data-key="finance"]')
    const priority = page.locator('[data-test="forge-priority"][data-key="security"]')
    const forgeBtn = page.locator('[data-test="forge-button"]')
    // Pick an industry + a priority, then forge. forceClick stays on the chip/
    // radio selects (sibling-arc actionability race) with DEFAULT settle — see
    // file-header note. The forge click itself waits on the deterministic FSM
    // data-state (#293), not the rAF-gated result render.
    await expect(industry).toBeVisible()
    await forceClick(industry, async () =>
      (await industry.getAttribute('aria-checked')) === 'true',
    )
    await expect(priority).toBeVisible()
    await forceClick(priority, async () =>
      (await priority.getAttribute('aria-checked')) === 'true',
    )
    await expect(forgeBtn).toBeVisible()
    await forgeBtn.click()
    await expect(page.locator('[data-test="solution-forge"]')).toHaveAttribute('data-state', 'done')

    // The result blueprint card renders after the forge completes.
    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // >=1 recommended service rendered with localized copy (not a raw key).
    const services = page.locator('[data-test="forge-services"] li')
    await expect(services.first()).toBeVisible()
    const serviceCount = await services.count()
    expect(serviceCount).toBeGreaterThanOrEqual(1)
    const serviceText = (await services.first().textContent()) ?? ''
    expect(serviceText).not.toContain('forge.services.')

    // Metrics rendered (throughput/accuracy/ttv).
    await expect(page.locator('[data-test="forge-metrics"]')).toBeVisible()

    // Verdict rendered with localized copy (not a raw key).
    const verdict = page.locator('[data-test="forge-verdict"]')
    await expect(verdict).toBeVisible()
    const verdictText = (await verdict.textContent()) ?? ''
    expect(verdictText).not.toContain('forge.verdicts.')

    // CTA router-link present and points at a service route.
    const cta = page.locator('[data-test="forge-cta"]')
    await expect(cta).toBeVisible()
    const href = (await cta.getAttribute('href')) ?? ''
    expect(href).toContain('/services/')
  })

  test('changing an input after a result re-forges automatically (AC4)', async ({ page }) => {
    const forgeBtn = page.locator('[data-test="forge-button"]')
    await expect(forgeBtn).toBeVisible()
    await forgeBtn.click()
    await expect(page.locator('[data-test="solution-forge"]')).toHaveAttribute('data-state', 'done')
    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // Change the industry; the AC4 watcher re-forges without a manual click.
    // forceClick stays on the chip toggle (sibling-arc actionability race) with
    // DEFAULT settle — see file-header note.
    const health = page.locator('[data-test="forge-industry"][data-key="health"]')
    await expect(health).toBeVisible()
    await forceClick(health, async () =>
      (await health.getAttribute('aria-checked')) === 'true',
    )
    // #293: the watcher re-forge is rAF-gated; wait on the FSM data-state to
    // reconverge to 'done' before asserting the fresh blueprint is visible.
    await expect(page.locator('[data-test="solution-forge"]')).toHaveAttribute('data-state', 'done')
    // A fresh blueprint lands (the result stays visible through the re-forge).
    await expect(result).toBeVisible({ timeout: 5000 })
    const services = page.locator('[data-test="forge-services"] li')
    await expect(services.first()).toBeVisible()
  })

  test('reroll + reset behave', async ({ page }) => {
    const forgeBtn = page.locator('[data-test="forge-button"]')
    await expect(forgeBtn).toBeVisible()
    await forgeBtn.click()
    await expect(page.locator('[data-test="solution-forge"]')).toHaveAttribute('data-state', 'done')
    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // Reroll re-forges (result stays visible). #293: FSM data-state wait.
    const reroll = page.locator('[data-test="forge-reroll"]')
    await expect(reroll).toBeVisible()
    await reroll.click()
    await expect(page.locator('[data-test="solution-forge"]')).toHaveAttribute('data-state', 'done')
    await expect(result).toBeVisible({ timeout: 5000 })

    // Reset clears the result + stage. reset() flips the FSM synchronously back
    // to 'idle' — wait on that deterministic value (#293), then assert the
    // result + stage DOM are gone.
    const reset = page.locator('[data-test="forge-reset"]')
    await expect(reset).toBeVisible()
    await reset.click()
    await expect(page.locator('[data-test="solution-forge"]')).toHaveAttribute('data-state', 'idle')
    await expect(result).toHaveCount(0)
    await expect(page.locator('[data-test="forge-stage"]')).toHaveCount(0)
  })

  test('keyboard-operable: focus the Forge button + Enter triggers a blueprint', async ({ page }) => {
    const forgeButton = page.locator('[data-test="forge-button"]')
    // focus+Enter path bypasses webkit actionability stability check (no click).
    await forgeButton.focus()
    await expect(forgeButton).toBeFocused()
    await page.keyboard.press('Enter')
    // #293: wait on the deterministic FSM data-state (auto-polls until 'done').
    await expect(page.locator('[data-test="solution-forge"]')).toHaveAttribute('data-state', 'done')

    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // The CTA is also keyboard-reachable (it is a router-link, focusable).
    const cta = page.locator('[data-test="forge-cta"]')
    await cta.focus()
    await expect(cta).toBeFocused()
  })

  test('reduced-motion mode is safe (no strobing: stage lands without rapid flash loops)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.locator('[data-test="forge-button"]').click()

    // The stage + result render under reduced motion (JS skips the rAF loop).
    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // The reduced-motion class guard is applied to the root so the CSS
    // animation:none rules are active.
    const root = page.locator('[data-test="solution-forge"]')
    await expect(root).toHaveClass(/reduced-motion/)

    // Capture computed animation state on the animated arc: it must be 'none'
    // (no spin loop), proving the reduced-motion CSS guard is active.
    const arc = page.locator('.forge-arc-1').first()
    const animationName = await arc.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return cs.animationName
    })
    // 'none' means no animation is running (the guard won).
    expect(animationName === 'none' || animationName === '').toBe(true)
  })

  test('mobile viewport renders without throwing', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'mobile viewport tested on chromium/webkit')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    // #224: re-navigation after beforeEach resets the page; re-trigger mount.
    await mountLazySection(page, 'lazy-solution-forge', 'solution-forge')
    const forge = page.locator('[data-test="solution-forge"]')
    await expect(forge).toBeVisible()
    // Config UI still renders on mobile.
    expect(await page.locator('[data-test="forge-industry"]').count()).toBeGreaterThanOrEqual(5)
    // Forge works on mobile. #293: wait on the deterministic FSM data-state
    // (auto-polls until 'done') rather than the rAF-gated result render.
    const forgeBtn = page.locator('[data-test="forge-button"]')
    await expect(forgeBtn).toBeVisible()
    await forgeBtn.click()
    await expect(page.locator('[data-test="solution-forge"]')).toHaveAttribute('data-state', 'done')
    await expect(page.locator('[data-test="forge-result"]')).toBeVisible({ timeout: 5000 })
  })
})
