/**
 * @file 188-css-purge.spec.ts
 * @description Visual no-regression E2E for the CSS purge + font consolidation
 * in Issue #188 (Core Web Vitals — "unused CSS is removed").
 * @ticket #188
 *
 * WHY getComputedStyle (not DOM text): the DOM cannot SEE CSS. A font-family
 * revert or a theme-variable dedup regression passes every DOM test. The
 * strongest programmatic signal the browser exposes is the RESOLVED computed
 * style on a rendered element. So we assert:
 *
 *  1. The hero/section headings resolve to a font stack containing "Orbitron"
 *     (the corrected --font-display value — was 'Clash Display', which was
 *     never loaded, so before #188 these resolved to system-ui). RED against
 *     origin/main: today they resolve to system-ui, not Orbitron.
 *  2. body resolves to a monospace stack (cyber.css keeps the intentional
 *     'Courier New' body font).
 *  3. The [data-theme="dark"] block still resolves --text-primary to #e0e0e0
 *     after the #239 light-branch deletion (proves the cyber.css :root dedup
 *     AND the light-block removal didn't break dark theming).
 *  4. No `pageerror` console errors on Home (the inline-block removal didn't
 *     orphan a referenced script/style).
 *
 * Run: node_modules/.bin/playwright test 188-css-purge --project=chromium
 *   (the dev server must be running on :3000 — see playwright.config.js
 *   webServer note; reuseExistingServer:true is the default when uncommented.)
 */

import { test, expect, type Page } from '@playwright/test'

// The app is served at the Vite base subpath /KTechAICyberWeb/. Playwright's
// baseURL is origin-only (http://localhost:3000), so page.goto('/') works
// (the server 302-redirects / to the subpath) BUT page.goto('/about') hits the
// origin's /about which 404s (no redirect for deep routes). Specs that
// deep-link must include the subpath explicitly. Mirrors the BASE-constant
// pattern used by 140-router-base.spec.ts.
const BASE = '/KTechAICyberWeb/'
const HOME = `${BASE}`
const ABOUT = `${BASE}about`
// Route is /services/big-data-ai (see src/main.js), NOT /services/big-data.
const SERVICE_BIG_DATA = `${BASE}services/big-data-ai`

/** Read the resolved font-family of the first element matching `selector`. */
async function computedFontFamily(page: Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => {
    return getComputedStyle(el).fontFamily
  })
}

test.describe('#188 CSS purge — visual no-regression', () => {
  test('Home hero heading resolves to Orbitron (corrected --font-display)', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForLoadState('networkidle')
    // Home renders <h1 class="neon-text glitch-text">. After #188 the
    // --font-display variable resolves to 'Orbitron' (was 'Clash Display' =>
    // system-ui). Assert the RESOLVED computed style, not the source.
    const ff = await computedFontFamily(page, 'h1.neon-text')
    console.log('\n[188] Home h1.neon-text computed font-family:', ff)
    expect(ff.toLowerCase()).toContain('orbitron')
  })

  test('Home body resolves to a monospace stack (intentional cyber body font)', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForLoadState('networkidle')
    const ff = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    console.log('\n[188] body computed font-family:', ff)
    // cyber.css keeps `body { font-family: 'Courier New', monospace }`.
    expect(ff.toLowerCase()).toMatch(/courier|monospace/)
  })

  test('About page-title resolves to Orbitron', async ({ page }) => {
    await page.goto(ABOUT)
    await page.waitForLoadState('networkidle')
    const ff = await computedFontFamily(page, '.page-title')
    console.log('\n[188] About .page-title computed font-family:', ff)
    expect(ff.toLowerCase()).toContain('orbitron')
  })

  test('ServiceBigData hero heading resolves to Orbitron', async ({ page }) => {
    await page.goto(SERVICE_BIG_DATA)
    await page.waitForLoadState('networkidle')
    const ff = await computedFontFamily(page, '#bd-hero-heading')
    console.log('\n[188] ServiceBigData #bd-hero-heading computed font-family:', ff)
    expect(ff.toLowerCase()).toContain('orbitron')
  })

  test('[data-theme="dark"] still resolves --text-primary after #239 light-branch deletion (cyber.css dedup did not break dark theming)', async ({ page }) => {
    await page.goto(HOME)
    await page.waitForLoadState('networkidle')
    // #239: the site is locked to dark — App.vue forces data-theme="dark"
    // regardless of persisted state. Seed a stale 'light' preference to prove
    // the dark CSS still resolves (the light block was deleted, but the dark
    // block must remain the active resolver).
    await page.evaluate(() => {
      localStorage.setItem('ktech-preferences', JSON.stringify({ theme: 'light', language: 'en' }))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')

    // <html> must be dark (the lock), not light (the persisted preference).
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Read the RESOLVED --text-primary variable off <html>. This is the most
    // direct proof that the [data-theme="dark"] block in cyber.css still
    // applies after the #188 :root dedup AND the #239 light-block deletion:
    // the variable's value comes straight from the [data-theme="dark"]
    // selector, with NO CSS transition in the way. dark #e0e0e0.
    await expect.poll(
      async () => page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()
      ),
      { timeout: 3000, message: '--text-primary must resolve under [data-theme="dark"]' },
    ).toBe('#e0e0e0')

    // Belt-and-braces: body.color consumes --text-primary, so once the 300ms
    // `color` transition (`* { transition: color 0.3s }`, cyber.css) has
    // finished interpolating, body.color must settle to the resolved dark
    // value. Asserting the EXACT settled color proves the consumer reached the
    // dark theme. 5s timeout absorbs parallel-worker contention.
    await expect.poll(
      async () => page.evaluate(() => getComputedStyle(document.body).color),
      { timeout: 5000, message: 'body color must settle to the dark-theme value' },
    ).toBe('rgb(224, 224, 224)')
  })

  test('no pageerror console errors on Home after purge', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto(HOME)
    await page.waitForLoadState('networkidle')
    // Allow a moment for any deferred script error to surface.
    await page.waitForTimeout(500)
    console.log('\n[188] pageerror events on Home:', errors)
    expect(errors).toEqual([])
  })
})
