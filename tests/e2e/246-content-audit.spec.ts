import { test, expect } from '@playwright/test'

// Issue #246 — Copy factual-accuracy audit. Live-DOM proof that the corrected
// contact/address/vision facts RENDER on the running app, in BOTH locales.
//
// The playbook for #246 also asks for a hero-title assertion. Note: the
// `hero.title` key ("KTech") is rendered ONLY by src/components/Hero.vue,
// which is NOT mounted on any live route (the live Home page renders
// `home.title` instead). So `hero.title` has no live-DOM surface and is
// covered authoritatively by the unit tests:
//   - src/locales/__tests__/246-content-audit.spec.ts (locale-level, both langs)
//   - src/components/__tests__/Hero.test.ts (component-level render)
// This E2E covers the corrected facts that DO render on live pages: the
// Contact page (email/phone/address) and the About page (vision).
//
// Conventions mirror tests/e2e/205-company-facts.spec.ts: the dev server is
// served at the /KTechAICyberWeb/ subpath, so deep-links include it
// explicitly (the playwright baseURL is the origin only).

const BASE = '/KTechAICyberWeb/'

test.describe('#246 content audit — Contact page (live DOM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}contact`)
    await page.waitForLoadState('networkidle')
  })

  test('en: renders corrected email, phone, and address', async ({ page }) => {
    const info = page.locator('.company-info-section .info-grid')
    await expect(info).toBeVisible()

    // Email (rendered inside a mailto anchor)
    await expect(info.locator('a[href^="mailto:"]')).toHaveAttribute(
      'href',
      'mailto:KTECH@kaitaitech.cn',
    )
    await expect(info.locator('a[href^="mailto:"]')).toHaveText('KTECH@kaitaitech.cn')

    // Phone (rendered inside a tel: anchor, non-digits stripped)
    await expect(info.locator('a[href^="tel:"]')).toHaveAttribute(
      'href',
      'tel:+8675536878020',
    )
    await expect(info.locator('a[href^="tel:"]')).toHaveText('+86 755 36878020')

    // Address: must contain the corrected Runhong Building street address.
    await expect(info).toContainText('Runhong Building')
    await expect(info).toContainText('12F')
  })

  test('zh: renders corrected email/phone/address after language toggle', async ({ page }) => {
    const switcher = page.locator('.language-switcher')
    await expect(switcher).toBeVisible()
    await switcher.click()

    const info = page.locator('.company-info-section .info-grid')
    // Email is the same inbox in both locales.
    await expect(info.locator('a[href^="mailto:"]')).toHaveText('KTECH@kaitaitech.cn')
    // Phone is the same in both locales.
    await expect(info.locator('a[href^="tel:"]')).toHaveText('+86 755 36878020')
    // Address: zh street-level address (Meiyuan Road / Runhong Building).
    await expect(info).toContainText('润弘大厦')
    await expect(info).toContainText('梅苑路75号')
  })
})

test.describe('#246 content audit — About page vision (live DOM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}about`)
    await page.waitForLoadState('networkidle')
  })

  test('en: vision card renders the corrected regional-leading wording', async ({ page }) => {
    const visionCard = page.locator('.vision-mission .vmc-card').first()
    await expect(visionCard.locator('h3')).toHaveText('Our Vision')
    await expect(visionCard.locator('p')).toHaveText(
      'To become a regional leading fintech platform.',
    )
  })

  test('zh: vision card renders 区域领先 after language toggle', async ({ page }) => {
    const switcher = page.locator('.language-switcher')
    await expect(switcher).toBeVisible()
    await switcher.click()

    const visionCard = page.locator('.vision-mission .vmc-card').first()
    await expect(visionCard.locator('p')).toContainText('区域领先')
  })

  test('en: mission card renders the corrected cutting-edge wording', async ({ page }) => {
    const cards = page.locator('.vision-mission .vmc-card')
    const missionCard = cards.nth(1)
    await expect(missionCard.locator('p')).toHaveText(
      'Empower customers with cutting-edge technology.',
    )
  })

  test('en: projects stat renders 20+ (not the old 50+)', async ({ page }) => {
    const stat = page.locator('.stats-grid .stat-item').first()
    await expect(stat.locator('.stat-value')).toHaveText('20+')
  })
})
