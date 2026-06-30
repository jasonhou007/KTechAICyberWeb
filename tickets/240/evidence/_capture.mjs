import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto('http://localhost:4173/KTechAICyberWeb/', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

// Footer region — the area where the RUM dashboard used to render.
const footer = page.locator('footer.cyber-footer')
await footer.scrollIntoViewIfNeeded()
await page.waitForTimeout(400)

// Live-DOM assertions (the shipped-app gate, against the real build).
const rumDashboard = await page.locator('.rum-dashboard').count()
const rumToggle = await page.locator('[data-test="rum-toggle"]').count()
const footerRum = await page.locator('.footer-rum').count()
const footerPresent = await page.locator('footer.cyber-footer').count()
const statusDot = await page.locator('footer.cyber-footer .status-dot').count()

console.log(JSON.stringify({
  rumDashboard, rumToggle, footerRum, footerPresent, statusDot,
  consoleErrors: errors,
}, null, 2))

// Full page + footer-only screenshot (after state).
await page.screenshot({ path: 'tickets/240/evidence/after-home-full.png', fullPage: false })
await footer.screenshot({ path: 'tickets/240/evidence/after-footer.png' })

// Programmatic assertion (mirror of the unit live-DOM test, but on the REAL build).
const ok = rumDashboard === 0 && rumToggle === 0 && footerRum === 0 && footerPresent === 1 && statusDot === 1
console.log('SHIPPED_APP_GATE:', ok ? 'PASS' : 'FAIL')
await browser.close()
process.exit(ok ? 0 : 1)
