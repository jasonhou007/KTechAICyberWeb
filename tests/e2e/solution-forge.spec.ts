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
    // #229 AC #4 → #244: this test was SKIPPED on webkit/Mobile Safari in the
    // prior #229 commit (9d4354e) because the Forge click→blueprint flow timed
    // out racing webkit's stability check vs the sibling forge arc spin. #244
    // (commit e445b69 / 15a0877, merged to main) FIXED it with forceClick
    // (force + retry until effect lands; settleMs=2500 > the async re-forge
    // convergence so a successful first click completes before any retry).
    // #229's rebase onto main therefore UN-SKIPS this test. Verified green on
    // webkit + Mobile Safari CI (run captured in this ticket's evidence).
    const industry = page.locator('[data-test="forge-industry"][data-key="finance"]')
    const priority = page.locator('[data-test="forge-priority"][data-key="security"]')
    const forgeBtn = page.locator('[data-test="forge-button"]')
    // Pick an industry + a priority, then forge.
    await expect(industry).toBeVisible()
    await forceClick(industry, async () =>
      (await industry.getAttribute('aria-checked')) === 'true',
    )
    await expect(priority).toBeVisible()
    await forceClick(priority, async () =>
      (await priority.getAttribute('aria-checked')) === 'true',
    )
    await expect(forgeBtn).toBeVisible()
    await forceClick(
      forgeBtn,
      async () => (await page.locator('[data-test="forge-result"]').count()) === 1,
      3,
      2500,
    )

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
    // #229 AC #4 → #244: UN-SKIPPED (was skipped in 9d4354e); #244's forceClick
    // (settleMs=2500 > the re-forge convergence) fixed the webkit stability race.
    const forgeBtn = page.locator('[data-test="forge-button"]')
    await expect(forgeBtn).toBeVisible()
    await forceClick(
      forgeBtn,
      async () => (await page.locator('[data-test="forge-result"]').count()) === 1,
      3,
      2500,
    )
    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // Change the industry; the AC4 watcher re-forges without a manual click.
    // #244: forceClick the health chip — cheap idempotent toggle (default settle).
    const health = page.locator('[data-test="forge-industry"][data-key="health"]')
    await expect(health).toBeVisible()
    await forceClick(health, async () =>
      (await health.getAttribute('aria-checked')) === 'true',
    )
    // A fresh blueprint lands (the result stays visible through the re-forge).
    await expect(result).toBeVisible({ timeout: 5000 })
    const services = page.locator('[data-test="forge-services"] li')
    await expect(services.first()).toBeVisible()
  })

  test('reroll + reset behave', async ({ page }) => {
    // #229 AC #4 → #244: UN-SKIPPED (was skipped in 9d4354e); #244's forceClick
    // (settleMs=2500 > the async re-forge convergence) fixed the webkit stability race.
    const forgeBtn = page.locator('[data-test="forge-button"]')
    await expect(forgeBtn).toBeVisible()
    await forceClick(
      forgeBtn,
      async () => (await page.locator('[data-test="forge-result"]').count()) === 1,
      3,
      2500,
    )
    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // Reroll re-forges (result stays visible).
    const reroll = page.locator('[data-test="forge-reroll"]')
    await expect(reroll).toBeVisible()
    await forceClick(
      reroll,
      async () => (await page.locator('[data-test="forge-result"]').count()) === 1,
      3,
      2500,
    )
    await expect(result).toBeVisible({ timeout: 5000 })

    // Reset clears the result + stage.
    const reset = page.locator('[data-test="forge-reset"]')
    await expect(reset).toBeVisible()
    await forceClick(reset, async () =>
      (await page.locator('[data-test="forge-result"]').count()) === 0,
    )
    await expect(result).toHaveCount(0)
    await expect(page.locator('[data-test="forge-stage"]')).toHaveCount(0)
  })

  test('keyboard-operable: focus the Forge button + Enter triggers a blueprint', async ({ page }) => {
    // #229 AC #4 → #244: this test was SKIPPED on webkit/Mobile Safari in the
    // prior #229 commit (9d4354e). #244 (commit e445b69 / 15a0877, merged to
    // main) FIXED it — focus+Enter bypasses webkit's actionability stability
    // check entirely (no click), so it never races the forge arc spin.
    // #229's rebase onto main therefore UN-SKIPS this test. Verified green on
    // webkit + Mobile Safari CI (run captured in this ticket's evidence).
    const forgeButton = page.locator('[data-test="forge-button"]')
    // #244: focus+Enter path bypasses webkit actionability stability check (no click).
    await forgeButton.focus()
    await expect(forgeButton).toBeFocused()
    await page.keyboard.press('Enter')

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
    // #229 AC #4 → #244: this test was SKIPPED on webkit/Mobile Safari in the
    // prior #229 commit (9d4354e). #244 (commit e445b69 / 15a0877, merged to
    // main) FIXED the forge-click actionability race on mobile with forceClick
    // (settleMs=2500 > the re-forge convergence). #229's rebase onto main
    // therefore UN-SKIPS this test. Verified green on Mobile Safari CI (run
    // captured in this ticket's evidence).
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    // #224: re-navigation after beforeEach resets the page; re-trigger mount.
    await mountLazySection(page, 'lazy-solution-forge', 'solution-forge')
    const forge = page.locator('[data-test="solution-forge"]')
    await expect(forge).toBeVisible()
    // Config UI still renders on mobile.
    expect(await page.locator('[data-test="forge-industry"]').count()).toBeGreaterThanOrEqual(5)
    // Forge works on mobile.
    // #244: forceClick (sibling arc spin races webkit/Mobile Safari stability;
    // settleMs=2500 > re-forge convergence). Mobile Safari drops synthetic
    // force-clicks under load, so the retry is required.
    const forgeBtn = page.locator('[data-test="forge-button"]')
    await expect(forgeBtn).toBeVisible()
    await forceClick(
      forgeBtn,
      async () => (await page.locator('[data-test="forge-result"]').count()) === 1,
      3,
      2500,
    )
    await expect(page.locator('[data-test="forge-result"]')).toBeVisible({ timeout: 5000 })
  })
})
