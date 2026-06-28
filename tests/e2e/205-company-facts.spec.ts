import { test, expect } from '@playwright/test'

// Issue #205 — KTech company facts corrected (capital, name, established date).
// Live-DOM proof against the RUNNING app (not just isolation tests), per the
// shipped-app gate. Asserts the corrected facts render on the About page.
//
// The footer.companyName correction is verified in the Footer unit test
// (src/components/__tests__/Footer.test.ts) — that is the proper place for it
// because the live About page has more than one `.footer-text`-class node and
// the unit test pins the exact binding unambiguously.

test.describe('#205 company facts — About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/KTechAICyberWeb/about')
    await page.waitForLoadState('networkidle')
  })

  test('renders corrected registered capital (300 million yuan)', async ({ page }) => {
    const cards = page.locator('.who-we-are .content-card')
    // capital is the 3rd card (Company Name, Parent Company, Capital, ...)
    const capitalCard = cards.nth(2)
    await expect(capitalCard.locator('h3')).toHaveText('Registered Capital')
    await expect(capitalCard.locator('p')).toHaveText('RMB 300 million')
  })

  test('renders corrected full company name with (KTech) suffix', async ({ page }) => {
    const cards = page.locator('.who-we-are .content-card')
    const nameCard = cards.nth(0)
    await expect(nameCard.locator('p')).toContainText(
      'KASIKORN VISION INFORMATION TECHNOLOGY Co., Ltd. (KTech)',
    )
  })

  test('renders the new Established card (June 2020)', async ({ page }) => {
    const cards = page.locator('.who-we-are .content-card')
    await expect(cards).toHaveCount(5)
    const establishedCard = cards.nth(3)
    await expect(establishedCard.locator('h3')).toHaveText('Established')
    await expect(establishedCard.locator('p')).toHaveText('June 2020')
  })

  test('zh locale renders corrected facts after language toggle', async ({ page }) => {
    // Switch the site-wide language toggle (en -> zh). There is no /zh route;
    // locale is composable state toggled by the LanguageSwitcher button.
    const switcher = page.locator('.language-switcher')
    await expect(switcher).toBeVisible()
    await switcher.click()
    // The who-we-are cards re-render with zh text. Wait for the zh capital text.
    const cards = page.locator('.who-we-are .content-card')
    await expect(cards.nth(2).locator('p')).toHaveText('3亿元人民币')
    const establishedCard = cards.nth(3)
    await expect(establishedCard.locator('h3')).toHaveText('成立时间')
    await expect(establishedCard.locator('p')).toHaveText('2020年6月')
  })

  test('captured screenshot of the corrected who-we-are section', async ({ page }) => {
    await page.locator('.who-we-are').scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await page.screenshot({
      path: 'tickets/205/evidence/after-about-facts.png',
      fullPage: false,
    })
    await expect(page.locator('.who-we-are')).toBeVisible()
  })
})
