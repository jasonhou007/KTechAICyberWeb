import { test, expect } from '@playwright/test'

test.describe('#223 Packet Route removed from shipped homepage', () => {
  test('does not render the puzzle on /', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-test="packet-route"]')).toHaveCount(0)
    await expect(page.locator('[data-test="packet-grid"]')).toHaveCount(0)
    await expect(page.locator('.packet-route-section')).toHaveCount(0)
    expect(await page.locator('body').textContent() ?? '').not.toMatch(/packetRoute\.[a-zA-Z]/)
  })
})
