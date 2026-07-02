import { test, expect } from '@playwright/test'

/**
 * #301 — Per-route og-image + twitter-image deploy + live-DOM resolution.
 *
 * Two acceptance criteria:
 *   AC1 (asset deploy) — each of the 11 per-route image files serves 200 +
 *     image/jpeg + >20KB at its deployed subpath URL. The files are generated
 *     by scripts/generate-seo-assets.mjs and committed to public/. Before #301
 *     these URLs 404'd (seo.js already referenced them but the files didn't
 *     exist); this gate catches a deploy / generation regression.
 *   AC3 (live-DOM resolution) — for each of the 5 content routes (/, /about,
 *     /news, /privacy, /terms), App.vue's useHead emits a per-route
 *     meta[property="og:image"] and meta[name="twitter:image"] whose content
 *     resolves to the right og-image-<route>.jpg / twitter-image-<route>.jpg,
 *     AND that URL serves 200. This proves the wiring (seo.js -> App.vue
 *     useHead -> browser meta tag) end-to-end and that the file actually serves.
 *
 * Models on tests/e2e/263-og-image-favicon.spec.ts: same BASE subpath
 * ('/KTechAICyberWeb/'), same request.get pattern, same content-type asserts.
 *
 * Tags: @seo @assets
 */

const BASE = '/KTechAICyberWeb/'

// The 11 per-route image files (6 og + 5 twitter; twitter-default is an
// intentional orphan — seo.js:175 falls the unknown-route twitter image back to
// og-image-default.jpg).
const PER_ROUTE_IMAGES = [
  'og-image-home.jpg',
  'og-image-about.jpg',
  'og-image-news.jpg',
  'og-image-privacy.jpg',
  'og-image-terms.jpg',
  'og-image-default.jpg',
  'twitter-image-home.jpg',
  'twitter-image-about.jpg',
  'twitter-image-news.jpg',
  'twitter-image-privacy.jpg',
  'twitter-image-terms.jpg'
]

// The 5 content routes App.vue emits per-route OG images for, mapped to the
// expected slug. seo.js routeMeta has entries for these 5 paths; unknown routes
// fall back to og-image-default.jpg (covered by the default-slug deploy test).
const ROUTE_SLUGS: Array<{ path: string; slug: string }> = [
  { path: `${BASE}`, slug: 'home' },
  { path: `${BASE}about`, slug: 'about' },
  { path: `${BASE}news`, slug: 'news' },
  { path: `${BASE}privacy`, slug: 'privacy' },
  { path: `${BASE}terms`, slug: 'terms' }
]

test.describe('#301 per-route og/twitter images — AC1 asset deploy', () => {
  for (const filename of PER_ROUTE_IMAGES) {
    test(`${filename} -> 200 image/jpeg >20KB`, async ({ request }) => {
      const res = await request.get(`${BASE}${filename}`)
      expect(res.status()).toBe(200)
      const ct = res.headers()['content-type'] || ''
      expect(ct.startsWith('image/jpeg')).toBe(true)
      const buf = await res.body()
      expect(buf.length).toBeGreaterThan(20000)
    })
  }

  test('does NOT ship twitter-image-default.jpg (orphan)', async ({ request }) => {
    // seo.js falls the unknown-route twitter image back to og-image-default.jpg,
    // so twitter-image-default.jpg is intentionally never referenced and must
    // NOT be served as a real JPEG. We assert content-type is NOT image/jpeg
    // (rather than status === 404) because the Vite dev server applies SPA
    // history-fallback and serves index.html with a 200 for unknown paths under
    // the base subpath — so a missing public/ file returns 200/text-html in dev,
    // while a static prod server returns 404. Both correctly fail the
    // "is this a real JPEG?" check, which is the actual contract. The unit
    // guard (seo-og-image-assets.spec.js: "does NOT ship an orphan
    // twitter-image-default.jpg") additionally proves the file is absent from
    // public/ via readFileSync.
    const res = await request.get(`${BASE}twitter-image-default.jpg`)
    const ct = res.headers()['content-type'] || ''
    expect(ct.startsWith('image/jpeg'), `twitter-image-default.jpg must NOT ship as a real JPEG (got content-type="${ct}")`).toBe(false)
  })
})

test.describe('#301 per-route og/twitter images — AC3 live-DOM resolution', () => {
  for (const { path, slug } of ROUTE_SLUGS) {
    test(`${path} renders og:image + twitter:image that resolve to <slug> files and serve 200`, async ({ page, request }) => {
      await page.goto(path)
      // useHead (@vueuse/head v2) patches document meta on a MACROTASK after
      // route resolution — `waitForLoadState('networkidle')` returns before the
      // patch lands, leaving the pre-hydration index.html static
      // og-image.jpg/twitter-image.jpg meta in the DOM. Poll for the per-route
      // slug to appear in the og:image content as the deterministic
      // "useHead has patched" signal (bounded, no magic timeout).
      const ogMeta = page.locator('meta[property="og:image"]')
      await expect.poll(
        async () => ogMeta.getAttribute('content'),
        { timeout: 5000, message: `og:image should resolve to og-image-${slug}.jpg after useHead patches` }
      ).toContain(`/og-image-${slug}.jpg`)

      const ogImage = (await ogMeta.getAttribute('content')) as string
      const twitterImage = (await page.locator('meta[name="twitter:image"]').getAttribute('content')) as string

      // useHead emitted non-null per-route URLs
      expect(ogImage, 'og:image meta must be present').toBeTruthy()
      expect(twitterImage, 'twitter:image meta must be present').toBeTruthy()

      // The URLs point at the expected per-route files (not the generic
      // og-image.jpg fallback, not a different route's image).
      expect(ogImage).toContain(`/og-image-${slug}.jpg`)
      expect(twitterImage).toContain(`/twitter-image-${slug}.jpg`)

      // seo.js emits ABSOLUTE production URLs (https://jasonhou007.github.io/
      // KTechAICyberWeb/og-image-<slug>.jpg). Those are unreachable from the
      // localhost dev server, so extract the subpath portion (everything from
      // the /KTechAICyberWeb/ asset name onward) and request THAT against the
      // dev server to prove the file actually serves. The absolute-URL shape is
      // already asserted via the toContain() checks above.
      const ogSubpath = `/KTechAICyberWeb/${ogImage.split('/KTechAICyberWeb/').pop()}`
      const twSubpath = `/KTechAICyberWeb/${twitterImage.split('/KTechAICyberWeb/').pop()}`
      const ogRes = await request.get(ogSubpath)
      expect(ogRes.status(), `${ogSubpath} should serve 200`).toBe(200)
      expect((ogRes.headers()['content-type'] || '').startsWith('image/jpeg')).toBe(true)
      const twRes = await request.get(twSubpath)
      expect(twRes.status(), `${twSubpath} should serve 200`).toBe(200)
      expect((twRes.headers()['content-type'] || '').startsWith('image/jpeg')).toBe(true)
    })
  }
})
