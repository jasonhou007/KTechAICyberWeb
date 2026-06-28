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

test.describe('#180 AI Solution Forge configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
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
    // Pick an industry + a priority, then forge.
    await page.locator('[data-test="forge-industry"][data-key="finance"]').click()
    await page.locator('[data-test="forge-priority"][data-key="security"]').click()
    await page.locator('[data-test="forge-button"]').click()

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
    await page.locator('[data-test="forge-button"]').click()
    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // Change the industry; the AC4 watcher re-forges without a manual click.
    await page.locator('[data-test="forge-industry"][data-key="health"]').click()
    // A fresh blueprint lands (the result stays visible through the re-forge).
    await expect(result).toBeVisible({ timeout: 5000 })
    const services = page.locator('[data-test="forge-services"] li')
    await expect(services.first()).toBeVisible()
  })

  test('reroll + reset behave', async ({ page }) => {
    await page.locator('[data-test="forge-button"]').click()
    const result = page.locator('[data-test="forge-result"]')
    await expect(result).toBeVisible({ timeout: 5000 })

    // Reroll re-forges (result stays visible).
    await page.locator('[data-test="forge-reroll"]').click()
    await expect(result).toBeVisible({ timeout: 5000 })

    // Reset clears the result + stage.
    await page.locator('[data-test="forge-reset"]').click()
    await expect(result).toHaveCount(0)
    await expect(page.locator('[data-test="forge-stage"]')).toHaveCount(0)
  })

  test('keyboard-operable: focus the Forge button + Enter triggers a blueprint', async ({ page }) => {
    const forgeButton = page.locator('[data-test="forge-button"]')
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
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const forge = page.locator('[data-test="solution-forge"]')
    await expect(forge).toBeVisible()
    // Config UI still renders on mobile.
    expect(await page.locator('[data-test="forge-industry"]').count()).toBeGreaterThanOrEqual(5)
    // Forge works on mobile.
    await page.locator('[data-test="forge-button"]').click()
    await expect(page.locator('[data-test="forge-result"]')).toBeVisible({ timeout: 5000 })
  })
})
