/**
 * @file useTerminal.test.ts
 * @description Unit tests for the useTerminal composable (#161).
 *
 * These tests drive the PURE LOGIC of the terminal: command parsing, output
 * accumulation, history navigation, autocomplete, clear, and the easter-egg
 * burst flag. They do NOT mount NeuralTerminal.vue (that has its own suite) —
 * they host the composable inside a trivial defineComponent so the reactive
 * refs are exercised through real Vue reactivity.
 *
 * Why a host component and not a bare call: useTerminal registers a Konami
 * keydown listener + a prefers-reduced-motion matchMedia listener on mount /
 * cleanup. Calling it as a function outside setup() would skip that wiring
 * (and leak listeners). Mounting the host exercises onMounted/onUnmounted for
 * real, mirroring production.
 *
 * @ticket #161
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { useTerminal } from '../../composables/useTerminal.js'

// ---------------------------------------------------------------------------
// matchMedia stub: happy-dom does not implement matchMedia. useTerminal reads
// prefers-reduced-motion from it, so we install a controllable impl.
// ---------------------------------------------------------------------------
function installMatchMedia(reduce: boolean) {
  const listeners: ((e: { matches: boolean }) => void)[] = []
  const mq = {
    matches: reduce,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_t: string, cb: (e: { matches: boolean }) => void) =>
      listeners.push(cb),
    removeEventListener: (
      _t: string,
      cb: (e: { matches: boolean }) => void,
    ) => {
      const i = listeners.indexOf(cb)
      if (i >= 0) listeners.splice(i, 1)
    },
    addListener: (cb: (e: { matches: boolean }) => void) => listeners.push(cb),
    removeListener: (cb: (e: { matches: boolean }) => void) => {
      const i = listeners.indexOf(cb)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  vi.stubGlobal('matchMedia', () => mq)
  return {
    mq,
    fire: (matches: boolean) => {
      mq.matches = matches
      listeners.forEach((cb) => cb({ matches }))
    },
  }
}

// ---------------------------------------------------------------------------
// Host helper: hosts the composable in a real component so lifecycle hooks run.
// ---------------------------------------------------------------------------
interface TerminalHandle {
  [key: string]: any
}
function mountTerminal(): { handle: TerminalHandle; unmount: () => void } {
  const captured: { handle: TerminalHandle | null } = { handle: null }
  const Host = defineComponent({
    name: 'TerminalHost',
    setup() {
      const handle = useTerminal() as TerminalHandle
      captured.handle = handle
      return () => h('div')
    },
  })
  const wrapper = mount(Host)
  return { handle: captured.handle as TerminalHandle, unmount: () => wrapper.unmount() }
}

describe('useTerminal composable (#161)', () => {
  let reduce: boolean
  beforeEach(() => {
    reduce = false
    installMatchMedia(reduce)
  })

  // ============================================
  // Command parsing / output
  // ============================================
  describe('runCommand — output lines', () => {
    it("runCommand('help') pushes an input echo + a response with i18nKey 'terminal.commands.help.response'", async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'help'
      handle.runCommand()
      await nextTick()

      const responses = handle.output.value.filter(
        (o: any) => o.type === 'response',
      )
      expect(responses.length).toBeGreaterThanOrEqual(1)
      const help = responses[responses.length - 1]
      expect(help.i18nKey).toBe('terminal.commands.help.response')
      unmount()
    })

    const expected: Array<[string, string]> = [
      ['about', 'terminal.commands.about.response'],
      ['services', 'terminal.commands.services.response'],
      ['ai', 'terminal.commands.ai.response'],
      ['news', 'terminal.commands.news.response'],
      ['contact', 'terminal.commands.contact.response'],
    ]
    expected.forEach(([cmd, key]) => {
      it(`runCommand('${cmd}') pushes a response with i18nKey '${key}'`, async () => {
        const { handle, unmount } = mountTerminal()
        handle.input.value = cmd
        handle.runCommand()
        await nextTick()

        const responses = handle.output.value.filter(
          (o: any) => o.type === 'response',
        )
        expect(responses.length).toBeGreaterThanOrEqual(1)
        expect(responses[responses.length - 1].i18nKey).toBe(key)
        unmount()
      })
    })

    it("runCommand('clear') empties the output buffer", async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'help'
      handle.runCommand()
      await nextTick()
      expect(handle.output.value.length).toBeGreaterThan(0)

      handle.input.value = 'clear'
      handle.runCommand()
      await nextTick()
      expect(handle.output.value.length).toBe(0)
      unmount()
    })

    it("runCommand('sudo') sets the easter-egg burst flag", async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'sudo'
      handle.runCommand()
      await nextTick()
      expect(handle.burst.value).toBe(true)
      unmount()
    })

    it("runCommand('coffee') sets the easter-egg burst flag", async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'coffee'
      handle.runCommand()
      await nextTick()
      expect(handle.burst.value).toBe(true)
      unmount()
    })

    it('runCommand with unknown text pushes terminal.errors.unknown (interpolated)', async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'nonexistent'
      handle.runCommand()
      await nextTick()
      const responses = handle.output.value.filter(
        (o: any) => o.type === 'response',
      )
      expect(responses.length).toBeGreaterThanOrEqual(1)
      expect(responses[responses.length - 1].i18nKey).toBe(
        'terminal.errors.unknown',
      )
      // The raw typed command is carried so the view can interpolate {cmd}.
      expect(responses[responses.length - 1].raw).toContain('nonexistent')
      unmount()
    })

    it('runCommand with empty/whitespace input does nothing (no echo, no output)', async () => {
      const { handle, unmount } = mountTerminal()
      const before = handle.output.value.length
      handle.input.value = '   '
      handle.runCommand()
      await nextTick()
      expect(handle.output.value.length).toBe(before)
      unmount()
    })

    it('runCommand resets the input field to empty after executing', async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'help'
      handle.runCommand()
      await nextTick()
      expect(handle.input.value).toBe('')
      unmount()
    })
  })

  // ============================================
  // History
  // ============================================
  describe('history', () => {
    it('raw input is pushed onto the history stack after a run', async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'about'
      handle.runCommand()
      handle.input.value = 'news'
      handle.runCommand()
      await nextTick()
      expect(handle.history.value).toEqual(['about', 'news'])
      unmount()
    })

    it('empty/whitespace runs are NOT pushed to history', async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = '   '
      handle.runCommand()
      handle.input.value = 'help'
      handle.runCommand()
      await nextTick()
      expect(handle.history.value).toEqual(['help'])
      unmount()
    })

    it('navigateHistory up cycles backward through past commands', async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'about'
      handle.runCommand()
      handle.input.value = 'news'
      handle.runCommand()
      handle.input.value = 'ai'
      handle.runCommand()
      await nextTick()

      // ↑ -> most recent (ai), ↑ -> news, ↑ -> about
      expect(handle.navigateHistory('up')).toBe('ai')
      expect(handle.navigateHistory('up')).toBe('news')
      expect(handle.navigateHistory('up')).toBe('about')
      unmount()
    })

    it('navigateHistory up stops at the oldest entry (no wraparound past it)', async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'about'
      handle.runCommand()
      await nextTick()
      expect(handle.navigateHistory('up')).toBe('about')
      // Second up stays clamped at oldest.
      expect(handle.navigateHistory('up')).toBe('about')
      unmount()
    })

    it('navigateHistory down moves forward and returns to empty at the end', async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'about'
      handle.runCommand()
      handle.input.value = 'news'
      handle.runCommand()
      await nextTick()

      // Walk all the way up, then back down.
      handle.navigateHistory('up') // -> news
      handle.navigateHistory('up') // -> about
      expect(handle.navigateHistory('down')).toBe('news')
      // One more down returns to empty input.
      expect(handle.navigateHistory('down')).toBe('')
      unmount()
    })

    it('navigateHistory with empty history is a no-op (returns empty)', () => {
      const { handle, unmount } = mountTerminal()
      expect(handle.navigateHistory('up')).toBe('')
      expect(handle.navigateHistory('down')).toBe('')
      unmount()
    })
  })

  // ============================================
  // Autocomplete
  // ============================================
  describe('autocomplete', () => {
    it('unique prefix completes to the full command name', () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'ab'
      const filled = handle.autocomplete()
      expect(filled).toBe('about')
      expect(handle.input.value).toBe('about')
      unmount()
    })

    it('exact match of an existing command stays put', () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'help'
      const filled = handle.autocomplete()
      expect(filled).toBe('help')
      unmount()
    })

    it('ambiguous prefix (matches multiple) is a no-op', () => {
      // 's' matches both 'services' and 'sudo' -> ambiguous, no fill.
      const { handle, unmount } = mountTerminal()
      handle.input.value = 's'
      const before = handle.input.value
      const filled = handle.autocomplete()
      expect(filled).toBe(before)
      expect(handle.input.value).toBe(before)
      unmount()
    })

    it('no matching prefix is a no-op', () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'zzz'
      const filled = handle.autocomplete()
      expect(filled).toBe('zzz')
      unmount()
    })

    it('empty input is a no-op for autocomplete', () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = ''
      const filled = handle.autocomplete()
      expect(filled).toBe('')
      unmount()
    })
  })

  // ============================================
  // clearOutput / open / close / toggle
  // ============================================
  describe('open / close / toggle / clearOutput', () => {
    it('isOpen starts false, open() flips it true, close() flips it false', async () => {
      const { handle, unmount } = mountTerminal()
      expect(handle.isOpen.value).toBe(false)
      handle.open()
      await nextTick()
      expect(handle.isOpen.value).toBe(true)
      handle.close()
      await nextTick()
      expect(handle.isOpen.value).toBe(false)
      unmount()
    })

    it('toggle() flips isOpen each call', async () => {
      const { handle, unmount } = mountTerminal()
      handle.toggle()
      await nextTick()
      expect(handle.isOpen.value).toBe(true)
      handle.toggle()
      await nextTick()
      expect(handle.isOpen.value).toBe(false)
      unmount()
    })

    it('clearOutput() empties the output buffer directly', async () => {
      const { handle, unmount } = mountTerminal()
      handle.input.value = 'help'
      handle.runCommand()
      await nextTick()
      expect(handle.output.value.length).toBeGreaterThan(0)
      handle.clearOutput()
      await nextTick()
      expect(handle.output.value.length).toBe(0)
      unmount()
    })
  })

  // ============================================
  // reduced motion + activity
  // ============================================
  describe('reduced motion + activity', () => {
    it('prefersReducedMotion reflects the matchMedia result at mount', () => {
      installMatchMedia(true) // reduce: true
      const { handle, unmount } = mountTerminal()
      expect(handle.prefersReducedMotion.value).toBe(true)
      unmount()
    })

    it('prefersReducedMotion is false when matchMedia says no reduce', () => {
      installMatchMedia(false)
      const { handle, unmount } = mountTerminal()
      expect(handle.prefersReducedMotion.value).toBe(false)
      unmount()
    })

    it('bumpActivity() raises the activity level', () => {
      const { handle, unmount } = mountTerminal()
      const before = handle.activity.value
      handle.bumpActivity()
      expect(handle.activity.value).toBeGreaterThan(before)
      unmount()
    })
  })

  // ============================================
  // visibleCommands (help enumeration source)
  // ============================================
  describe('visibleCommands', () => {
    it('lists every public (non-hidden) command name', () => {
      const { handle, unmount } = mountTerminal()
      const names = handle.visibleCommands.value.map((c: any) => c.name)
      // The 7 public commands, registry order.
      expect(names).toEqual([
        'help',
        'about',
        'services',
        'ai',
        'news',
        'contact',
        'clear',
      ])
      // Easter eggs must NOT be enumerated.
      expect(names).not.toContain('sudo')
      expect(names).not.toContain('coffee')
      expect(names).not.toContain('konami')
      unmount()
    })
  })
})
