import { test, expect } from '@playwright/test'

/**
 * #263 — og-image + favicon HTTP-200 + base-path-fix proof.
 *
 * Two parts:
 *   1) request.get each committed SEO asset at its deployed subpath URL and
 *      assert 200 + the right content-type + non-trivial byte length. This is
 *      the regression gate: before #263 every one of these 404'd because the
 *      files were absent from public/.
 *   2) page.goto the home and listen on page.on('response') to assert NO
 *      favicon response is 404. This is the base-path-fix proof: the
 *      index.html <link rel="icon" href="favicon.ico"> and the App.vue useHead
 *      link both drive the browser to fetch the RELATIVE href (resolving under
 *      the '/KTechAICyberWeb/' base) — if either still had a leading slash,
 *      the browser would 404 the origin-root path.
 *
 * The webServer (playwright.config.ts) auto-starts `npm run dev` on
 * http://localhost:3000. Assets served from public/ live under the Vite base
 * subpath '/KTechAICyberWeb/'.
 *
 * Tags: @regression @seo @assets
 */

const BASE = '/KTechAICyberWeb/'

test.describe('#263 og-image + favicon deploy', () => {
  test('og-image.jpg → 200 image/jpeg >20KB', async ({ request }) => {
    const res = await request.get(`${BASE}og-image.jpg`)
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] || ''
    expect(ct.startsWith('image/jpeg')).toBe(true)
    const buf = await res.body()
    expect(buf.length).toBeGreaterThan(20000)
  })

  test('twitter-image.jpg → 200 image/jpeg >20KB', async ({ request }) => {
    const res = await request.get(`${BASE}twitter-image.jpg`)
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] || ''
    expect(ct.startsWith('image/jpeg')).toBe(true)
    const buf = await res.body()
    expect(buf.length).toBeGreaterThan(20000)
  })

  test('favicon.ico → 200 image/*-icon >1000 bytes', async ({ request }) => {
    const res = await request.get(`${BASE}favicon.ico`)
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] || ''
    // Vite/dev may serve as either vnd.microsoft.icon or x-icon
    expect(ct.includes('icon')).toBe(true)
    const buf = await res.body()
    expect(buf.length).toBeGreaterThan(1000)
  })

  test('favicon.svg → 200 image/svg+xml', async ({ request }) => {
    const res = await request.get(`${BASE}favicon.svg`)
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] || ''
    expect(ct.includes('svg')).toBe(true)
  })

  test('apple-touch-icon.png → 200 image/png', async ({ request }) => {
    const res = await request.get(`${BASE}apple-touch-icon.png`)
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] || ''
    expect(ct.startsWith('image/png')).toBe(true)
  })

  test('icon-192.png → 200 image/png', async ({ request }) => {
    const res = await request.get(`${BASE}icon-192.png`)
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] || ''
    expect(ct.startsWith('image/png')).toBe(true)
  })

  test('icon-512.png → 200 image/png', async ({ request }) => {
    const res = await request.get(`${BASE}icon-512.png`)
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] || ''
    expect(ct.startsWith('image/png')).toBe(true)
  })

  test('logo.png → 200 image/png', async ({ request }) => {
    const res = await request.get(`${BASE}logo.png`)
    expect(res.status()).toBe(200)
    const ct = res.headers()['content-type'] || ''
    expect(ct.startsWith('image/png')).toBe(true)
  })

  test('home: rendered favicon <link> resolves under the subpath + no favicon 404 (base-path-fix proof)', async ({ page }) => {
    const faviconResponses: { url: string; status: number }[] = []
    page.on('response', (res) => {
      const u = res.url()
      if (u.includes('favicon.ico') || u.includes('favicon.svg')) {
        faviconResponses.push({ url: u, status: res.status() })
      }
    })

    await page.goto(`${BASE}`)
    await page.waitForLoadState('networkidle')

    // --- Proof 1: every favicon <link> in the LIVE DOM resolves to a URL
    // under the deploy subpath '/KTechAICyberWeb/'. The browser resolves the
    // relative href against the document URL, so a correct `href="favicon.ico"`
    // yields `.../KTechAICyberWeb/favicon.ico`. If the base-path fix
    // regressed to `/favicon.ico`, the resolved URL would be at the origin
    // root (`http://localhost:3000/favicon.ico`), which 404s in production —
    // this assertion catches that.
    const iconHrefs = await page.$$eval(
      'link[rel="icon"], link[rel="apple-touch-icon"]',
      (els) => els.map((e) => e.href),
    )
    expect(iconHrefs.length).toBeGreaterThan(0)
    for (const href of iconHrefs) {
      expect(href).toContain('/KTechAICyberWeb/')
    }

    // --- Proof 2 (behavioral): fetch each rendered favicon href over HTTP
    // and assert 200. This proves the browser-facing URL the <link> points at
    // actually serves the asset — the regression we fixed (origin-root 404).
    for (const href of iconHrefs) {
      const res = await page.request.get(href)
      expect(res.status()).toBe(200)
    }

    // --- Proof 3 (regression gate): any favicon response the browser fired
    // on its own during page load must NOT be 404.
    const notFound = faviconResponses.filter((r) => r.status === 404)
    expect(notFound).toEqual([])
  })
})
