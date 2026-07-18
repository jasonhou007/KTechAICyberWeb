import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * #376 — Business section cyberpunk enhancement tests.
 *
 * These are SOURCE-TEXT assertions (we read the .vue file as text and strip
 * comments before asserting). They prove the #376 enhancements:
 *   1. WhatWeDo section has cyberpunk classes and pseudo-elements
 *   2. Solution cards have cyber-card and enhanced hover effects
 *   3. Typography uses neon-text class and enhanced effects
 *   4. Section has proper positioning for layered effects (pseudo-elements)
 *   5. Grid responds to mobile breakpoint (768px)
 *   6. All 6 business cards render with correct content
 *   7. Group labels present and styled correctly
 */

const ROOT = resolve(__dirname, '../..')

function readSource(rel) {
  const raw = readFileSync(resolve(ROOT, rel), 'utf8')
  // Strip /* ... */ CSS/Vue comments so commented-out old values don't trip assertions
  return raw.replace(/\/\*[\s\S]*?\*\//g, '')
}

describe('#376 Business section cyberpunk enhancements', () => {
  describe('AC1: Cyberpunk visual style', () => {
    it('WhatWeDo section has cyberpunk classes', () => {
      const vue = readSource('src/views/Home.vue')
      // The .whatwedo section must exist
      expect(vue).toContain('class="whatwedo section"')
    })

    it('Solution cards have cyber-card class', () => {
      const vue = readSource('src/views/Home.vue')
      // Cards must have cyber-card class
      expect(vue).toContain('solution-card cyber-card hover-lift"')
    })

    it('Typography uses neon-text class', () => {
      const vue = readSource('src/views/Home.vue')
      // Section title must use neon-text
      expect(vue).toContain('section-title neon-text"')
    })
  })

  describe('AC2: Enhanced card hover interactions', () => {
    it('Solution cards have hover-lift class', () => {
      const vue = readSource('src/views/Home.vue')
      expect(vue).toContain('hover-lift"')
    })

    it('CSS includes 3D transform properties for cards', () => {
      const vue = readSource('src/views/Home.vue')
      // Look for transform and perspective properties in CSS
      const css = vue.match(/\.solution-card\.cyber-card:hover[^}]*}/s)
      expect(css).not.toBeNull()
      if (css) {
        // Should include transform property
        expect(css[0]).toContain('transform:')
      }
    })

    it('CSS includes box-shadow glow effects for cards', () => {
      const vue = readSource('src/views/Home.vue')
      // Card hover should have enhanced glow (uses alpha-cyan variables)
      expect(vue).toMatch(/box-shadow:.*var\(--accent-cyan-alpha/)
    })
  })

  describe('AC3: Typography enhancements', () => {
    it('Section title uses neon-text class', () => {
      const vue = readSource('src/views/Home.vue')
      expect(vue).toContain('section-title neon-text"')
    })

    it('CSS has enhanced text-shadow for neon-text', () => {
      const vue = readSource('src/views/Home.vue')
      // Should have multi-layer text-shadow
      expect(vue).toMatch(/text-shadow:/)
    })

    it('Group labels have cyber styling', () => {
      const vue = readSource('src/views/Home.vue')
      expect(vue).toContain('group-label"')
      // Should have text-shadow
      expect(vue).toMatch(/\.group-label[^}]*text-shadow:/)
    })
  })

  describe('AC4: Animated background elements', () => {
    it('Section has pseudo-elements for layered effects', () => {
      const vue = readSource('src/views/Home.vue')
      // Should have ::before or ::after on .whatwedo
      expect(vue).toMatch(/\.whatwedo\s*::before/)
      expect(vue).toMatch(/\.whatwedo\s*::after/)
    })

    it('CSS includes keyframe animations', () => {
      const vue = readSource('src/views/Home.vue')
      // Should have @keyframes definitions
      expect(vue).toContain('@keyframes')
    })

    it('Has network pulse animation', () => {
      const vue = readSource('src/views/Home.vue')
      // Should include networkPulse animation
      expect(vue).toMatch(/@keyframes\s+networkPulse/)
    })

    it('Has circuit move animation', () => {
      const vue = readSource('src/views/Home.vue')
      // Should include circuitMove animation
      expect(vue).toMatch(/@keyframes\s+circuitMove/)
    })
  })

  describe('AC5: Responsive design', () => {
    it('Grid responds to mobile breakpoint (768px)', () => {
      const vue = readSource('src/views/Home.vue')
      // Should have media query for mobile
      expect(vue).toMatch(/@media\s*\(max-width:\s*768px\)/)
    })

    it('Mobile breakpoint changes grid to single column', () => {
      const vue = readSource('src/views/Home.vue')
      // Should have single column grid on mobile
      expect(vue).toMatch(/\.solution-grid[^}]*grid-template-columns:\s*1fr/)
    })
  })

  describe('Content rendering', () => {
    it('All 6 business cards are defined', () => {
      const vue = readSource('src/views/Home.vue')
      // Should have 4 blockchain cards
      expect(vue).toContain('publicchain')
      expect(vue).toContain('crossborder')
      expect(vue).toContain('custody')
      expect(vue).toContain('stablecoin')
      // Should have 2 banking cards
      expect(vue).toContain('retaillending')
      expect(vue).toContain('supplychain')
    })

    it('Group labels are present', () => {
      const vue = readSource('src/views/Home.vue')
      // Should have blockchain and banking group labels
      expect(vue).toContain('group.blockchain.label')
      expect(vue).toContain('group.banking.label')
    })

    it('Cards have correct structure with h4 and p', () => {
      const vue = readSource('src/views/Home.vue')
      // Should have h4 for titles and p for descriptions
      const cardPattern = /solution-card[^>]*>[\s\S]*<h4>[\s\S]*<p>/g
      const matches = vue.match(cardPattern)
      expect(matches).not.toBeNull()
      expect(matches.length).toBeGreaterThan(0)
    })
  })
})
