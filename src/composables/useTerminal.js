/**
 * @file useTerminal.js
 * @description Reactive brain for the AI Neural Terminal (#161).
 *
 * Owns all terminal state and logic: the command parser, output buffer,
 * history navigation, autocomplete, clear, the open/close lifecycle, the
 * matrix-reactive `activity` level, the easter-egg `burst` flag, and the
 * prefers-reduced-motion signal. The NeuralTerminal.vue view is a thin
 * presentation layer over this composable — it has no business logic of its
 * own.
 *
 * Output lines are tagged records so the view can render each kind distinctly:
 *   { id, type: 'input'|'response'|'system', i18nKey?, raw? }
 * - 'input'    : echoes what the user typed (rendered with the prompt)
 * - 'response' : the localized result of a command (i18nKey resolved by t())
 * - 'system'   : boot lines / status messages
 *
 * @ticket #161
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  terminalCommands,
  findCommand,
  visibleCommands as registryVisible,
} from '../data/terminalCommands.js'

let _id = 0
function nextId() {
  _id += 1
  return _id
}

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

export function useTerminal() {
  // --- core state ---------------------------------------------------------
  const input = ref('')
  const output = ref([])
  const history = ref([])
  // historyIndex points into history during navigation. -1 = not navigating
  // (fresh input). Walking up sets it to history.length-1 and decrements;
  // walking down increments; reaching length returns to -1 (empty input).
  const historyIndex = ref(-1)

  const isOpen = ref(false)

  // Reactive matrix background intensity. Each keystroke bumps it; it decays
  // on an interval set up by the view (the composable just exposes the value).
  const activity = ref(0)
  // Burst flag — set when an easter-egg fires, cleared by the view after the
  // burst animation plays out.
  const burst = ref(false)

  const prefersReducedMotion = ref(false)

  // --- prefers-reduced-motion wiring -------------------------------------
  // Match the actual user setting via matchMedia; react if it changes. We
  // guard for environments without matchMedia (SSR / very old happy-dom).
  let motionMq = null
  const onMotionChange = (e) => {
    prefersReducedMotion.value = !!(e && e.matches)
  }

  // --- Konami listener (scoped to when the console is open) ---------------
  // The Konami sequence is captured here so the component doesn't have to. It
  // only fires while the terminal is open (listener added on open, removed on
  // close) so it can't leak across the rest of the app.
  let konamiBuffer = []
  let konamiHandler = null
  function attachKonami() {
    if (konamiHandler) return
    konamiHandler = (e) => {
      konamiBuffer.push(e.key)
      if (konamiBuffer.length > KONAMI.length) {
        konamiBuffer = konamiBuffer.slice(-KONAMI.length)
      }
      if (KONAMI.every((k, i) => konamiBuffer[i] === k)) {
        runCommandText('konami')
        konamiBuffer = []
      }
    }
    window.addEventListener('keydown', konamiHandler)
  }
  function detachKonami() {
    if (konamiHandler) {
      window.removeEventListener('keydown', konamiHandler)
      konamiHandler = null
      konamiBuffer = []
    }
  }

  // --- lifecycle ----------------------------------------------------------
  onMounted(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotion.value = !!motionMq.matches
      if (motionMq.addEventListener) {
        motionMq.addEventListener('change', onMotionChange)
      } else if (motionMq.addListener) {
        motionMq.addListener(onMotionChange)
      }
    }
  })

  onUnmounted(() => {
    if (motionMq) {
      if (motionMq.removeEventListener) {
        motionMq.removeEventListener('change', onMotionChange)
      } else if (motionMq.removeListener) {
        motionMq.removeListener(onMotionChange)
      }
    }
    detachKonami()
  })

  // --- derived ------------------------------------------------------------
  const visibleCommands = computed(() => registryVisible())

  // --- output helpers -----------------------------------------------------
  function pushInput(text) {
    output.value.push({
      id: nextId(),
      type: 'input',
      raw: text,
    })
  }
  function pushResponse(i18nKey, raw) {
    output.value.push({ id: nextId(), type: 'response', i18nKey, raw })
  }
  function pushSystem(i18nKey) {
    output.value.push({ id: nextId(), type: 'system', i18nKey })
  }

  // --- command execution --------------------------------------------------
  function runCommandText(rawText) {
    const text = String(rawText ?? '').trim()
    if (text === '') return

    pushInput(text)

    const cmd = findCommand(text)
    if (!cmd) {
      // Unknown — interpolate the typed command into the localized error.
      pushResponse('terminal.errors.unknown', text)
    } else if (cmd.isClear) {
      output.value = []
    } else {
      pushResponse(cmd.i18nKey)
      if (cmd.easterEgg) {
        burst.value = true
      }
    }

    // Record raw history (dedupe consecutive duplicates so the buffer stays
    // navigable) and reset navigation state.
    if (history.value[history.value.length - 1] !== text) {
      history.value.push(text)
    }
    historyIndex.value = -1
    input.value = ''
  }

  function runCommand() {
    runCommandText(input.value)
  }

  function clearOutput() {
    output.value = []
  }

  // --- history navigation -------------------------------------------------
  // Returns the value the input should take. Caller binds it to input.value.
  function navigateHistory(direction) {
    if (history.value.length === 0) return ''

    if (direction === 'up') {
      // First press starts at the most recent entry.
      if (historyIndex.value === -1) {
        historyIndex.value = history.value.length - 1
      } else if (historyIndex.value > 0) {
        historyIndex.value -= 1
      }
      return history.value[historyIndex.value]
    }

    if (direction === 'down') {
      if (historyIndex.value === -1) return ''
      historyIndex.value += 1
      if (historyIndex.value >= history.value.length) {
        historyIndex.value = -1
        return ''
      }
      return history.value[historyIndex.value]
    }

    return input.value
  }

  // --- autocomplete -------------------------------------------------------
  // Fill the input from a unique prefix among ALL commands (including hidden
  // easter eggs — finding them is the game). Returns the filled value or, on
  // ambiguity / no match, the unchanged input.
  function autocomplete() {
    const value = String(input.value ?? '')
    if (value === '') return ''

    const lower = value.toLowerCase()
    const matches = terminalCommands.filter((cmd) =>
      cmd.name.toLowerCase().startsWith(lower),
    )
    if (matches.length === 1) {
      input.value = matches[0].name
      return matches[0].name
    }
    // 0 matches OR >1 matches (ambiguous) -> no-op.
    return input.value
  }

  // --- open / close -------------------------------------------------------
  function open() {
    isOpen.value = true
    attachKonami()
  }
  function close() {
    isOpen.value = false
    detachKonami()
  }
  function toggle() {
    if (isOpen.value) close()
    else open()
  }

  // --- activity (matrix intensity) ---------------------------------------
  function bumpActivity() {
    activity.value += 1
  }

  return {
    // state
    input,
    output,
    history,
    historyIndex,
    isOpen,
    activity,
    burst,
    prefersReducedMotion,
    // derived
    visibleCommands,
    // methods
    runCommand,
    autocomplete,
    navigateHistory,
    clearOutput,
    open,
    close,
    toggle,
    bumpActivity,
    // output helpers (view uses pushSystem for boot/intro lines; pushResponse
    // is internal-only, used by runCommandText, so it is NOT exported).
    pushSystem,
  }
}
