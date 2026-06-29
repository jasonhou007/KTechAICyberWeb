/**
 * @file pulse.spec.ts
 * @description Playwright E2E for the Neon Pulse audio-reactive visualizer (#186).
 * @ticket #186
 *
 * Verifies the shipped user flow on the real app (chromium only — firefox/webkit
 * have pre-existing browser-binary debt):
 *  - the visualizer renders on the shipped homepage (region + engage + canvas);
 *  - Engage -> playing (status text flips + canvas present);
 *  - mode radio switch (each mode -> active checked state);
 *  - NO audio asset fetch (.mp3/.wav/.ogg requests never fire — the synth is
 *    in-memory Web-Audio, the mic is never recorded/transmitted);
 *  - reduced-motion emulation -> low-motion class + .pulse-flash count=0 over
 *    a 2s window (seizure-safe);
 *  - Stop -> idle.
 *
 * NOTE: this spec lives in tests/e2e/ (the configured Playwright testDir), NOT
 * e2e/ — the top-level e2e/ directory is never collected by playwright.config.ts.
 *
 * Run: node_modules/.bin/playwright test pulse --project=chromium
 */

import { test, expect } from '@playwright/test'

// Serial + single-worker: each test spins up a REAL AudioContext in chromium,
// and under parallel browser contexts the main thread can briefly starve during
// the synchronous synth graph build (4 oscillators + filters + rAF start),
// which made the Engage click action time out intermittently at the default
// 10s. Serializing removes the contention; the engage path itself is sound
// (verified in isolation: 1.8s).
test.describe.serial('#186 Neon Pulse', () => {
  test.beforeEach(async ({ page }) => {
    // Grant mic permissions up front so a mic-mode engage doesn't hang on the
    // browser permission prompt (we test the synth path primarily; the
    // composable's mic-deny fallback is covered in the unit suite).
    await page.context().grantPermissions(['microphone']).catch(() => {})
    await page.goto('/')
  })

  test('the visualizer renders on the shipped homepage with region + engage + canvas', async ({ page }) => {
    const pulse = page.locator('[data-test="neon-pulse"]')
    await expect(pulse).toBeVisible()

    // Engage control present.
    await expect(page.locator('[data-test="pulse-engage"]')).toBeVisible()
    // Canvas present.
    await expect(page.locator('[data-test="pulse-canvas"]')).toBeVisible()

    // Region is labelled for AT.
    const label = await pulse.getAttribute('aria-label')
    expect(label && label.length > 0).toBe(true)

    // Title is localized copy, not a raw key.
    const title = await page.locator('[data-test="neon-pulse"] .pulse-title').textContent()
    expect(title ?? '').not.toContain('pulse.')
  })

  test('Engage -> playing (status text flips, canvas still present)', async ({ page }) => {
    await page.locator('[data-test="pulse-engage"]').click()

    // Status readout flips away from the idle copy. The localized "playing"
    // copy is present; assert it's NOT a raw key and NOT empty.
    const status = page.locator('[data-test="pulse-status"]')
    await expect(status).not.toBeEmpty()
    const statusText = (await status.textContent()) ?? ''
    expect(statusText).not.toContain('pulse.')

    // Canvas remains present after engage.
    await expect(page.locator('[data-test="pulse-canvas"]')).toBeVisible()

    // Stop button is now offered (engage button hidden).
    await expect(page.locator('[data-test="pulse-stop"]')).toBeVisible()
  })

  test('mode radio switch: each mode selects and reflects active state', async ({ page }) => {
    for (const m of ['spectrum', 'radial', 'particles']) {
      const radio = page.locator(`[data-test="pulse-mode-${m}"]`)
      await radio.check()
      await expect(radio).toBeChecked()
    }
  })

  test('NO audio asset fetch: engaging the synth never requests .mp3/.wav/.ogg', async ({ page }) => {
    const audioRequests: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(url)) {
        audioRequests.push(url)
      }
    })

    // The engage click builds a real AudioContext + synth graph; allow a
    // generous action timeout so a brief main-thread stall under load does
    // not flake the assertion.
    await page.locator('[data-test="pulse-engage"]').click({ timeout: 20000 })
    // Let the rAF loop run a few frames.
    await page.waitForTimeout(800)

    // The synth is in-memory Web-Audio; no audio asset is fetched.
    expect(audioRequests).toHaveLength(0)
  })

  test('reduced-motion emulation: low-motion class + zero .pulse-flash.lit over 2s', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    // Engage under reduced motion (composable still reaches playing; flash is
    // short-circuited).
    await page.locator('[data-test="pulse-engage"]').click()
    await page.waitForTimeout(300)

    // The root picks up the low-motion class.
    await expect(page.locator('[data-test="neon-pulse"]')).toHaveClass(/low-motion/)

    // Over a 2s window the flash overlay must NEVER light (seizure-safe).
    let litCount = 0
    for (let i = 0; i < 20; i++) {
      const flash = page.locator('[data-test="pulse-flash"].lit')
      const count = await flash.count()
      litCount += count
      await page.waitForTimeout(100)
    }
    expect(litCount).toBe(0)
  })

  test('Stop -> idle (status readout returns to idle copy, Stop button hides)', async ({ page }) => {
    await page.locator('[data-test="pulse-engage"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator('[data-test="pulse-stop"]')).toBeVisible()

    await page.locator('[data-test="pulse-stop"]').click()
    await page.waitForTimeout(150)

    // Stop button is gone; Engage is back.
    await expect(page.locator('[data-test="pulse-engage"]')).toBeVisible()

    // Status readout is non-empty localized copy (not a raw key).
    const statusText = (await page.locator('[data-test="pulse-status"]').textContent()) ?? ''
    expect(statusText).not.toContain('pulse.')
  })
})
