/**
 * @file cyber-ops-hud.evidence.spec.ts
 * @description Evidence-capture for the Cyber Ops HUD (#182).
 * Captures before (HUD at rest, no pulse) + after (pulse fired, anomaly toast
 * shown, glitch active) screenshots of the shipped homepage HUD section.
 *
 * Run: node_modules/.bin/playwright test --config playwright.182.config.ts
 *      (testMatch restricted to cyber-ops-hud — this file matches the glob too,
 *       so point it at this file explicitly when regenerating evidence.)
 *
 * @ticket #182
 */
import { test, expect } from '@playwright/test'

// Evidence screenshots land in the repo-root tickets/182/evidence/ (mirrors the
// 205-company-facts evidence convention). Run from the repo root.
const EVIDENCE_DIR = 'tickets/182/evidence'

test.describe('#182 Cyber Ops HUD evidence capture', () => {
  test('capture before (at rest) + after (pulse + anomaly) screenshots', async ({ page }) => {
    await page.goto('/')
    const hud = page.locator('[data-test="cyber-ops-hud"]')
    await expect(hud).toBeVisible()
    // Scroll the HUD into full view.
    await hud.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)

    // BEFORE: HUD at rest (no pulse, no anomaly toast).
    await hud.screenshot({ path: `${EVIDENCE_DIR}/before-hud-rest.png` })

    // AFTER: fire a pulse → metrics spike + anomaly toast appears.
    await page.locator('[data-test="ops-pulse-button"]').click()
    await expect(page.locator('[data-test="ops-anomaly-toast"]')).toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(300) // let the glitch + spike render
    await hud.screenshot({ path: `${EVIDENCE_DIR}/after-hud-pulse-anomaly.png` })

    // AFTER-2: investigate drill-down state.
    await page.locator('[data-test="ops-investigate"]').click()
    await expect(page.locator('[data-test="ops-anomaly-toast"]')).toHaveClass(/ops-investigating/)
    await page.waitForTimeout(200)
    await hud.screenshot({ path: `${EVIDENCE_DIR}/after-hud-investigate.png` })

    // Sanity: the screenshots were written (non-empty).
    // (Playwright fails the test if the path is unwritable.)
  })
})
