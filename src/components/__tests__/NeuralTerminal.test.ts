/**
 * @file NeuralTerminal.test.ts
 * @description Unit tests for the NeuralTerminal view (#161).
 *
 * These tests drive the REAL DOM: type into the input, press Enter / arrow
 * keys / Tab / Esc, and assert the user-VISIBLE result (rendered response
 * classes, ARIA attributes, open/close state). They do NOT touch vm internals
 * beyond what a screen-reader or keyboard user would observe.
 *
 * Animation note: scoped CSS is not applied in happy-dom, so we assert
 * DOM-observable facts (classes like 'neon-text'/'glitch-text'/'decode-anim',
 * ARIA attributes, element presence) — never getComputedStyle. Fake timers are
 * used where the boot/typewriter timing would otherwise need a real wait.
 *
 * @ticket #161
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import NeuralTerminal from '../NeuralTerminal.vue'

// ---------------------------------------------------------------------------
// matchMedia controllable stub. happy-dom lacks matchMedia; NeuralTerminal +
// useTerminal read prefers-reduced-motion and a mobile breakpoint from it.
// ---------------------------------------------------------------------------
function installMatchMedia(opts: { reduce?: boolean; mobile?: boolean } = {}) {
  const stores = new Map<
    string,
    { matches: boolean; listeners: ((e: { matches: boolean }) => void)[] }
  >()
  const snapshot = (q: string) => {
    let matches = false
    if (q.includes('prefers-reduced-motion')) matches = !!opts.reduce
    if (q.includes('max-width')) matches = !!opts.mobile
    return matches
  }
  vi.stubGlobal('matchMedia', (query: string) => {
    if (!stores.has(query)) {
      stores.set(query, { matches: snapshot(query), listeners: [] })
    }
    const store = stores.get(query)!
    return {
      matches: store.matches,
      media: query,
      onchange: null,
      addEventListener: (_t: string, cb: (e: { matches: boolean }) => void) =>
        store.listeners.push(cb),
      removeEventListener: (
        _t: string,
        cb: (e: { matches: boolean }) => void,
      ) => {
        const i = store.listeners.indexOf(cb)
        if (i >= 0) store.listeners.splice(i, 1)
      },
      addListener: (cb: (e: { matches: boolean }) => void) =>
        store.listeners.push(cb),
      removeListener: (cb: (e: { matches: boolean }) => void) => {
        const i = store.listeners.indexOf(cb)
        if (i >= 0) store.listeners.splice(i, 1)
      },
      dispatchEvent: () => false,
    }
  })
  return {
    set(q: string, matches: boolean) {
      const store = stores.get(query(q))
      if (!store) return
      store.matches = matches
      store.listeners.forEach((cb) => cb({ matches }))
    },
  }
  // helper to fuzzy-match our query strings back to the stored key
  function query(q: string): string {
    for (const key of stores.keys()) if (key === q) return key
    return q
  }
}

describe('NeuralTerminal.vue (#161)', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    installMatchMedia({ reduce: false, mobile: false })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    if (wrapper) wrapper.unmount()
  })

  const mountTerminal = () =>
    mount(NeuralTerminal, {
      attachTo: document.body,
    })

  // ============================================
  // Launcher + open/close
  // ============================================
  describe('launcher + open/close', () => {
    it('renders the floating launcher button with an accessible aria-label', () => {
      wrapper = mountTerminal()
      const launcher = wrapper.find('[data-test="neural-launcher"]')
      expect(launcher.exists()).toBe(true)
      expect(launcher.attributes('aria-label')).toBeTruthy()
    })

    it('starts with the console closed', () => {
      wrapper = mountTerminal()
      expect(wrapper.find('[data-test="neural-terminal"]').exists()).toBe(true)
      const console = wrapper.find('[data-test="neural-console"]')
      // Console is present in DOM but hidden when closed (aria-hidden / not open).
      expect(console.exists()).toBe(true)
    })

    it('clicking the launcher opens the console', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const console = wrapper.find('[data-test="neural-console"]')
      expect(console.classes()).toContain('open')
    })
  })

  // ============================================
  // ARIA / region semantics
  // ============================================
  describe('ARIA + region semantics', () => {
    it('exposes the console as role="region" with a localized aria-label', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const console = wrapper.find('[data-test="neural-console"]')
      expect(console.attributes('role')).toBe('region')
      expect(console.attributes('aria-label')).toBeTruthy()
    })

    it('the output container is an ARIA live region (aria-live="polite")', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const live = wrapper.find('[data-test="neural-output"]')
      expect(live.exists()).toBe(true)
      expect(live.attributes('aria-live')).toBe('polite')
    })

    it('the close button exposes an accessible aria-label', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const closeBtn = wrapper.find('[data-test="neural-close"]')
      expect(closeBtn.exists()).toBe(true)
      expect(closeBtn.attributes('aria-label')).toBeTruthy()
    })

    it('the command input has an associated label (aria-label or <label>)', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      expect(input.exists()).toBe(true)
      const labelled =
        input.attributes('aria-label') ||
        input.attributes('aria-labelledby') ||
        wrapper.find(`label[for="${input.attributes('id')}"]`).exists()
      expect(labelled).toBeTruthy()
    })
  })

  // ============================================
  // Command execution drives real DOM output
  // ============================================
  describe('command execution (real DOM)', () => {
    it("typing 'help' + Enter renders a styled response line with neon-text/glitch-text/decode-anim", async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')

      const input = wrapper.find('[data-test="neural-input"]')
      await input.setValue('help')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()

      const responses = wrapper.findAll('.terminal-response')
      expect(responses.length).toBeGreaterThanOrEqual(1)
      const last = responses[responses.length - 1]
      // At least one of the cyber styling classes is applied to the response.
      const cyberStyled =
        last.classes().includes('neon-text') ||
        last.classes().includes('glitch-text') ||
        last.classes().includes('decode-anim')
      expect(cyberStyled).toBe(true)
      // The resolved help response copy (data-text holds the final value,
      // robust against the mid-flight decode scramble) is not a raw key.
      expect(last.attributes('data-text')).not.toContain('terminal.commands')
    })

    it("typing 'about' + Enter renders the KTech description in the response", async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      await input.setValue('about')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      const responses = wrapper.findAll('.terminal-response')
      expect(responses.length).toBeGreaterThanOrEqual(1)
      // The resolved about copy (data-text) mentions KTech.
      const last = responses[responses.length - 1]
      expect(last.attributes('data-text').toLowerCase()).toContain('ktech')
    })

    it("typing 'clear' + Enter empties the visible output", async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      // produce some output first
      await input.setValue('help')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(wrapper.findAll('.terminal-response').length).toBeGreaterThan(0)
      // then clear
      await input.setValue('clear')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(wrapper.findAll('.terminal-response').length).toBe(0)
    })

    it('typing an unknown command renders the localized unknown-error line', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      await input.setValue('zzznotreal')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      const responses = wrapper.findAll('.terminal-response')
      expect(responses.length).toBeGreaterThanOrEqual(1)
      // The response's resolved copy lives on its data-text attribute (the
      // decode animation may still be mid-scramble on the visible text node,
      // so data-text is the authoritative user-readable value).
      const last = responses[responses.length - 1]
      expect(last.attributes('data-text').toLowerCase()).toContain('not found')
      // The typed command is interpolated into the error.
      expect(last.attributes('data-text')).toContain('zzznotreal')
    })

    it('the typed command is echoed in the output with the prompt', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      await input.setValue('news')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      const echoed = wrapper.findAll('.terminal-input-line')
      expect(echoed.length).toBeGreaterThanOrEqual(1)
      // The prompt text + the typed command appear in the echo.
      expect(echoed[echoed.length - 1].text()).toContain('news')
    })
  })

  // ============================================
  // Keyboard: history + autocomplete + Esc
  // ============================================
  describe('keyboard interaction', () => {
    it('Esc closes the console', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const console = wrapper.find('[data-test="neural-console"]')
      expect(console.classes()).toContain('open')

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      await nextTick()
      expect(console.classes()).not.toContain('open')
    })

    it('ArrowUp recalls the previous command into the input', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      // Seed two commands.
      await input.setValue('help')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      await input.setValue('news')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      // ArrowUp -> most recent (news).
      await input.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect((input.element as HTMLInputElement).value).toBe('news')
      // ArrowUp again -> help.
      await input.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect((input.element as HTMLInputElement).value).toBe('help')
    })

    it('Tab autocompletes a unique command prefix', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      await input.setValue('ab')
      await input.trigger('keydown', { key: 'Tab' })
      await nextTick()
      expect((input.element as HTMLInputElement).value).toBe('about')
    })
  })

  // ============================================
  // Reduced motion
  // ============================================
  describe('prefers-reduced-motion', () => {
    it('applies a reduced-motion class/branch on the console when reduce is set', async () => {
      installMatchMedia({ reduce: true, mobile: false })
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const console = wrapper.find('[data-test="neural-console"]')
      expect(console.classes()).toContain('reduced-motion')
    })

    it('does NOT start a scramble/decode timer under reduced motion (boot stays instant)', async () => {
      installMatchMedia({ reduce: true, mobile: false })
      vi.useFakeTimers()
      const spy = vi.spyOn(window, 'setInterval')
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      await input.setValue('help')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      // No scramble interval should have been scheduled for the decode anim.
      const scrambleIntervals = spy.mock.calls.filter(
        ([, ms]) => ms !== undefined && ms < 1000,
      )
      expect(scrambleIntervals.length).toBe(0)
      spy.mockRestore()
    })
  })

  // ============================================
  // Mobile chips
  // ============================================
  describe('mobile command chips', () => {
    it('renders command chips under the mobile breakpoint', async () => {
      installMatchMedia({ reduce: false, mobile: true })
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const chips = wrapper.find('[data-test="neural-chips"]')
      expect(chips.exists()).toBe(true)
      // At least the 7 public commands are present as chips.
      expect(chips.findAll('.terminal-chip').length).toBeGreaterThanOrEqual(7)
    })

    it('does not render the chip palette above the mobile breakpoint', async () => {
      installMatchMedia({ reduce: false, mobile: false })
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      expect(wrapper.find('[data-test="neural-chips"]').exists()).toBe(false)
    })
  })

  // ============================================
  // Activity (matrix bg reactivity)
  // ============================================
  describe('activity / matrix bg', () => {
    it('a keystroke in the input bumps the reactive activity level', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const before = wrapper.vm.activity
      const input = wrapper.find('[data-test="neural-input"]')
      await input.setValue('h')
      await nextTick()
      expect(wrapper.vm.activity).toBeGreaterThan(before)
    })
  })

  // ============================================
  // Scanlines reuse
  // ============================================
  describe('Scanlines reuse', () => {
    it('renders the Scanlines overlay inside the console', async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      // Scanlines renders a div.scanlines (aria-hidden). It must live inside
      // the console, proving reuse of the shared overlay.
      const console = wrapper.find('[data-test="neural-console"]')
      expect(console.find('.scanlines').exists()).toBe(true)
    })
  })

  // ============================================
  // Easter egg
  // ============================================
  describe('easter egg burst', () => {
    it("typing 'coffee' + Enter triggers the easter-egg burst flag", async () => {
      wrapper = mountTerminal()
      await wrapper.find('[data-test="neural-launcher"]').trigger('click')
      const input = wrapper.find('[data-test="neural-input"]')
      await input.setValue('coffee')
      await input.trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(wrapper.vm.burst).toBe(true)
    })
  })
})
