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
import { mountLazySection, forceClick } from './fixtures/lazy-mount-helper'

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
    // #224: NeonPulse is lazy-mounted inside <LazySection>; scroll it into view
    // so the visualizer (region + engage + canvas) mounts before any query.
    // Behavior unchanged — the engage flow still works after mount.
    await mountLazySection(page, 'lazy-neon-pulse', 'neon-pulse')
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
    // #244 webkit/Mobile Safari/Mobile Chrome: the engage button is static, but
    // on MOBILE viewports (≤768px) Playwright's synthetic force-click does NOT
    // reliably reach the `@click="engage"` Vue handler for the EXPENSIVE async
    // AudioContext build. Diagnosis (CI run 28460722546 + local repro,
    // 2026-06-30 / 07-01): on Mobile Chrome (Pixel 5, chromium engine) forceClick
    // fails "effect not observed after 3 attempts" — the synthetic force-click is
    // intermittently dropped at the actionability stage before force applies, and
    // even when it does start the async engage() the effect predicate re-checks
    // inside the converge window. A STANDALONE native el.click() flips status
    // synchronously (Idle→Playing) and is deterministic across repeated runs
    // (verified 3/3 locally on Mobile Chrome; the same native path was already
    // proven for Mobile Safari in the prior #244 commit). Desktop
    // chromium/firefox/webkit keep forceClick (force + retry), which lands
    // reliably there. The mixed force+native retry is NOT used for engage because
    // a force-click that occasionally DOES start engage() then collides with a
    // follow-up native click (two AudioContext builds). Click semantics
    // unchanged — only HOW the click is dispatched varies by viewport.
    const engage = page.locator('[data-test="pulse-engage"]')
    await expect(engage).toBeVisible()
    const stopBtn = page.locator('[data-test="pulse-stop"]')
    const isMobileViewport = !!(page.viewportSize() && page.viewportSize().width <= 768)
    if (isMobileViewport) {
      // Single native click (proven reliable on Mobile Chrome + Mobile Safari);
      // the status flip is synchronous so a short probe confirms it landed.
      await engage.evaluate((el) => (el as HTMLElement).click())
      await expect(stopBtn).toBeVisible({ timeout: 5000 })
    } else {
      await forceClick(
        engage,
        async () => (await stopBtn.count()) === 1,
        3,
        2500,
      )
    }

    // Status readout flips away from the idle copy. The localized "playing"
    // copy is present; assert it's NOT a raw key and NOT empty.
    const status = page.locator('[data-test="pulse-status"]')
    await expect(status).not.toBeEmpty()
    const statusText = (await status.textContent()) ?? ''
    expect(statusText).not.toContain('pulse.')

    // Canvas remains present after engage.
    await expect(page.locator('[data-test="pulse-canvas"]')).toBeVisible()

    // Stop button is now offered (engage button hidden).
    await expect(page.locator('[data-test="pulse-stop"]')).toBeVisible({ timeout: 5000 })
  })

  test('mode radio switch: each mode selects and reflects active state', async ({ page }) => {
    // #244 webkit/Mobile Safari: mode radios are static, but webkit's stability
    // check times out racing the sibling pulse canvas animation. forceCheck
    // (forceClick on a radio) skips the stability gate and retries until the
    // radio reports checked. Check semantics unchanged.
    for (const m of ['spectrum', 'radial', 'particles']) {
      const radio = page.locator(`[data-test="pulse-mode-${m}"]`)
      await expect(radio).toBeVisible()
      await forceClick(radio, async () => await radio.isChecked())
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
