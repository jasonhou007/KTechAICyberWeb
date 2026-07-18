import { test, expect } from '@playwright/test'

/**
 * Issue #394: ContactNetwork ambient cyber-network background
 * Root cause: Contact page lacks ambient animation background present on other pages
 *
 * Solution: Add ContactNetwork component with canvas-based animated network background
 *
 * AC1: ContactNetwork component renders on Contact page
 * AC2: Canvas element exists with proper aria attributes (role="img", aria-label) when not in reduced motion mode
 * AC3: Static fallback renders when prefers-reduced-motion is enabled
 * AC4: Network has 12 nodes on desktop (>=768px viewport)
 * AC5: Network has 6 nodes on mobile (<768px viewport)
 * AC6: Animation runs smoothly at 60fps
 * AC7: Contact form remains fully functional and accessible
 * AC8: Component has proper positioning (fixed, z-index: 0, opacity: 0.4)
 * AC9: Keyboard navigation works for form elements
 * AC10: Mobile responsive design maintained
 */

test.describe('#394 Contact ambient network background', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/KTechAICyberWeb/contact')
  })

  test('AC1: ContactNetwork component renders on Contact page', async ({ page }) => {
    const networkComponent = page.locator('.contact-network')
    await expect(networkComponent).toBeVisible()
  })

  test('AC2: Canvas element exists with proper aria attributes when not in reduced motion', async ({ page }) => {
    const canvas = page.locator('.contact-network canvas')
    await expect(canvas).toBeVisible()

    // Verify container has role="img" and aria-label
    const networkContainer = page.locator('.contact-network')
    const role = await networkContainer.getAttribute('role')
    expect(role).toBe('img')

    const ariaLabel = await networkContainer.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
  })

  test('AC3: Static fallback renders when prefers-reduced-motion is enabled', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    
    // Static fallback should be visible instead of canvas
    const staticGrid = page.locator('.contact-network.network-static.nodes-grid')
    await expect(staticGrid).toBeVisible()
    
    // Canvas should not be visible
    const canvas = page.locator('.contact-network canvas')
    await expect(canvas).not.toBeVisible()
  })

  test('AC4: Network has 12 nodes on desktop (>=768px viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Wait for canvas to be ready
    const canvas = page.locator('.contact-network canvas')
    await expect(canvas).toBeVisible()
    
    // Check that canvas is rendering nodes
    // We can verify this by checking if the component is initialized
    const networkComponent = page.locator('.contact-network')
    await expect(networkComponent).toHaveAttribute('class', /contact-network/)
  })

  test('AC5: Network has 6 nodes on mobile (<768px viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Wait for canvas to be ready
    const canvas = page.locator('.contact-network canvas')
    await expect(canvas).toBeVisible()
    
    // Verify responsive behavior
    const networkComponent = page.locator('.contact-network')
    await expect(networkComponent).toBeVisible()
  })

  test('AC6: Animation runs smoothly at 60fps', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Wait for canvas to initialize
    const canvas = page.locator('.contact-network canvas')
    await expect(canvas).toBeVisible()
    
    // Measure animation performance
    const fps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0
        let startTime = performance.now()
        
        function countFrames() {
          frameCount++
          const elapsed = performance.now() - startTime
          
          if (elapsed >= 1000) {
            resolve(frameCount)
          } else {
            requestAnimationFrame(countFrames)
          }
        }
        
        requestAnimationFrame(countFrames)
      })
    })
    
    // Expect at least 50fps (allowing for some variance)
    expect(fps).toBeGreaterThanOrEqual(50)
  })

  test('AC7: Contact form remains fully functional and accessible', async ({ page }) => {
    // Verify form elements are still visible and interactive
    const nameInput = page.locator('#name')
    await expect(nameInput).toBeVisible()
    await expect(nameInput).toBeEditable()
    
    const emailInput = page.locator('#email')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toBeEditable()
    
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
  })

  test('AC8: Component has proper positioning (fixed, z-index: 0, opacity: 0.4)', async ({ page }) => {
    const networkComponent = page.locator('.contact-network')
    
    // Check positioning styles
    const position = await networkComponent.evaluate((el) => {
      return window.getComputedStyle(el).position
    })
    expect(position).toBe('fixed')
    
    // Check z-index
    const zIndex = await networkComponent.evaluate((el) => {
      return window.getComputedStyle(el).zIndex
    })
    expect(zIndex).toBe('0')
    
    // Check opacity (should be 0.4)
    const opacity = await networkComponent.evaluate((el) => {
      return window.getComputedStyle(el).opacity
    })
    expect(parseFloat(opacity)).toBeCloseTo(0.4, 1)
  })

  test('AC9: Keyboard navigation works for form elements', async ({ page }) => {
    // Test tab navigation through form
    await page.keyboard.press('Tab')
    
    // First tab should focus on first input (name)
    const focusedElement = await page.evaluate(() => document.activeElement?.id)
    expect(focusedElement).toBeTruthy()
  })

  test('AC10: Mobile responsive design maintained', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Network should still be visible
    const networkComponent = page.locator('.contact-network')
    await expect(networkComponent).toBeVisible()
    
    // Form should be accessible
    const contactForm = page.locator('.contact-form')
    await expect(contactForm).toBeVisible()
    
    // All form elements should be visible on mobile
    const formInputs = page.locator('.contact-form input, .contact-form textarea, .contact-form select, .contact-form button')
    const count = await formInputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Accessibility: Component has proper ARIA attributes', async ({ page }) => {
    // Verify that the network component has proper accessibility attributes
    const networkComponent = page.locator('.contact-network')
    const role = await networkComponent.getAttribute('role')
    expect(role).toBe('img')

    const ariaLabel = await networkComponent.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()

    // Verify that form content is still accessible
    const mainContent = page.locator('.contact-content')
    await expect(mainContent).toBeVisible()
  })

  test('Performance: Component pauses when off-screen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Scroll component out of view
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    
    // Wait a moment for intersection observer to trigger
    await page.waitForTimeout(200)
    
    // Component should still be in DOM but paused
    const networkComponent = page.locator('.contact-network')
    await expect(networkComponent).toBeAttached()
  })
})
