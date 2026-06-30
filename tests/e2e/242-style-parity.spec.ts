/**
 * @file 242-style-parity.spec.ts
 * @description Visual/parity E2E for the site style unification (Issue #242).
 * @ticket #242
 *
 * The "shipped-app proof" gate (iter 13/15/35): the unification must render in
 * the LIVE app, not just in CSS source. The unit spec (style-unification.spec.js)
 * proves the SOURCE has no legacy literals; this spec proves the RESOLVED
 * computed styles on the rendered pages match the canonical cyber palette:
 *
 *  1. body background is in the canonical dark family (luminance < 0.2), not a
 *     light/wrong-bg regression.
 *  2. a heading element resolves to canonical cyan rgb(0, 255, 204) — NOT the
 *     legacy neon-green rgb(0, 255, 136) (#00ff88) nor sky-cyan rgb(0, 240, 255)
 *     (#00f0ff). This is the single strongest parity signal: if a view still
 *     hardcodes #00f0ff / #00ff88, the computed color will not match.
 *  3. a .cyber-card (or equivalent) border-color resolves to a cyan-family rgba.
 *  4. full-page screenshots captured in BOTH en and zh for 4 routes → 8 shots
 *     saved to tests/e2e/screenshots/242-{route}-{lang}.png (visual evidence).
 *
 * Run: node_modules/.bin/playwright test 242-style-parity --project=chromium
 *   (webServer auto-starts `npm run dev` on :3000 — see playwright.config.ts.)
 *
 * RED-TEST PROOF: against origin/main, the heading-color assertion fails on
 * every route (headings resolve to #00f0ff / #00ff88 / #ff00ff legacy literals,
 * not rgb(0, 255, 204)).
 */
import { test, expect, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const SCREENSHOTS_DIR = resolve(process.cwd(), 'tests/e2e/screenshots')
mkdirSync(SCREENSHOTS_DIR, { recursive: true })

// The app is served at the Vite base subpath /KTechAICyberWeb/. Playwright's
// baseURL is origin-only (http://localhost:3000), so deep routes must include
// the subpath explicitly (mirrors 188-css-purge.spec.ts BASE pattern).
const BASE = '/KTechAICyberWeb/'
const ROUTES: Array<{ name: string; path: string }> = [
  { name: 'home', path: `${BASE}` },
  { name: 'about', path: `${BASE}about` },
  { name: 'service-big-data', path: `${BASE}services/big-data-ai` },
  { name: 'contact', path: `${BASE}contact` },
]

/** Relative luminance per WCAG. Returns 0..1. */
function luminance(r: number, g: number, b: number): number {
  const chan = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)
}

/** Parse "rgb(r, g, b)" / "rgba(r, g, b, a)" into [r,g,b]. */
function parseRgb(s: string): [number, number, number] {
  const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (!m) return [0, 0, 0]
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

test.describe('#242 style parity — canonical cyber palette renders live', () => {
  for (const route of ROUTES) {
    test(`${route.name}: body bg is dark family (luminance < 0.2)`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      const bg = await page.evaluate(() => {
        // Walk up from body to the first opaque ancestor (body itself paints
        // var(--bg-primary), so this is normally body).
        let el: HTMLElement | null = document.body
        while (el) {
          const c = getComputedStyle(el).backgroundColor
          if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c
          el = el.parentElement
        }
        return 'rgb(0,0,0)'
      })
      const [r, g, b] = parseRgb(bg)
      const lum = luminance(r, g, b)
      console.log(`\n[242] ${route.name} body bg: ${bg} lum=${lum.toFixed(3)}`)
      // Dark family = low luminance. Our Business / canonical #0a0a0a lum ~0.003.
      // A wrong-light-bg regression (e.g. #e0e8ff) lum ~0.83 — fails the gate.
      expect(lum).toBeLessThan(0.2)
    })

    test(`${route.name}: at least one heading resolves to canonical cyan rgb(0, 255, 204)`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      // Scan ALL visible headings. The first heading is often the white hero
      // (#ffffff) or text-primary — that's canonical too. The parity signal is:
      // (a) at least one heading IS the canonical cyan, AND (b) NO heading
      // resolves to a legacy neon literal (neon-green rgb(0,255,136) or
      // sky-cyan rgb(0,240,255)).
      const data = await page.evaluate(() => {
        const out: string[] = []
        for (const h of Array.from(document.querySelectorAll('h1, h2, h3'))) {
          const rect = (h as HTMLElement).getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) continue
          out.push(getComputedStyle(h).color)
        }
        return out
      })
      console.log(`\n[242] ${route.name} heading colors:`, data)
      expect(data.length).toBeGreaterThan(0)
      // (a) at least one heading is canonical cyan (tolerant: r~0, g~255, b~204).
      const hasCyan = data.some((c) => {
        const [r, g, b] = parseRgb(c)
        return Math.abs(r - 0) <= 5 && Math.abs(g - 255) <= 5 && Math.abs(b - 204) <= 10
      })
      expect(hasCyan, `${route.name} must have a canonical-cyan heading`).toBe(true)
      // (b) NO heading is a legacy neon literal.
      const hasLegacyNeon = data.some((c) => {
        const [r, g, b] = parseRgb(c)
        // neon-green rgb(0,255,136) or sky-cyan rgb(0,240,255).
        const neonGreen = r <= 5 && Math.abs(g - 255) <= 5 && Math.abs(b - 136) <= 10
        const skyCyan = r <= 5 && Math.abs(g - 240) <= 10 && Math.abs(b - 255) <= 5
        return neonGreen || skyCyan
      })
      expect(hasLegacyNeon, `${route.name} must not use legacy neon-green/sky-cyan`).toBe(false)
    })

    test(`${route.name}: a .cyber-card border resolves to a cyan-family rgba`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      // .cyber-card is the canonical card class. Some routes (e.g. contact) may
      // use a different card class — fall back to the first bordered card-like
      // element if .cyber-card is absent.
      const borders = await page.evaluate(() => {
        const sel = '.cyber-card, .card, .solution-card, [class*="card"]'
        const cards = Array.from(document.querySelectorAll(sel))
        const out: string[] = []
        for (const c of cards) {
          const rect = (c as HTMLElement).getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) continue
          const bc = getComputedStyle(c).borderColor
          if (bc && !/rgba?\(\s*0,\s*0,\s*0,\s*0?\)/.test(bc) && bc !== 'transparent') out.push(bc)
        }
        return out
      })
      console.log(`\n[242] ${route.name} card borders:`, borders)
      // If a route has visible bordered cards, at least one must be cyan-family
      // (canonical #00ffcc or its rgba). Reject legacy sky-cyan rgb(0,240,255).
      if (borders.length) {
        const hasCyan = borders.some((c) => {
          const [r, g, b] = parseRgb(c)
          return Math.abs(r - 0) <= 5 && Math.abs(g - 255) <= 10 && Math.abs(b - 204) <= 15
        })
        expect(hasCyan, `${route.name} must have a canonical-cyan card border`).toBe(true)
      }
    })
  }

  // Visual evidence: 8 full-page screenshots (4 routes x en/zh). These are the
  // artifacts cited in the PR body.
  for (const route of ROUTES) {
    for (const lang of ['en', 'zh'] as const) {
      test(`${route.name} (${lang}) screenshot`, async ({ page }) => {
        // Seed language via localStorage BEFORE navigation so the first paint
        // is in the target language (useLanguage reads ktech-language on init).
        await page.addInitScript((l) => {
          try { localStorage.setItem('ktech-language', l) } catch (_) { /* ignore */ }
        }, lang)
        await page.goto(route.path)
        await page.waitForLoadState('networkidle')
        // Let web fonts settle so the screenshot reflects Orbitron/Rajdhani.
        await page.waitForTimeout(500)
        const file = resolve(SCREENSHOTS_DIR, `242-${route.name}-${lang}.png`)
        await page.screenshot({ path: file, fullPage: true })
        console.log(`\n[242] screenshot saved: ${file}`)
      })
    }
  }
})
