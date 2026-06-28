<template>
  <div class="neural-terminal-root" data-test="neural-terminal">
    <!-- Easter-egg burst overlay: a transient full-screen glitch/particle
         burst fired when a hidden command runs (sudo/coffee/hackplanet/konami).
         Purely decorative — aria-hidden so AT ignores it. Honors
         prefers-reduced-motion by rendering a static (non-animated) flash. -->
    <div
      v-if="burst"
      class="terminal-burst"
      :class="{ 'reduced-motion': prefersReducedMotion }"
      aria-hidden="true"
    >
      <span class="terminal-burst-scan"></span>
      <span class="terminal-burst-particle" v-for="n in 12" :key="n"></span>
    </div>

    <!-- Floating launcher: opens the console -->
    <button
      type="button"
      class="neural-launcher neon-text"
      data-test="neural-launcher"
      :aria-label="t('terminal.launcher.ariaLabel')"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span class="neural-launcher-glyph" aria-hidden="true">&gt;_</span>
      <span class="neural-launcher-label">{{ t('terminal.launcher.label') }}</span>
    </button>

    <!-- The console itself. Stays in the DOM (so it can animate in/out) and is
         hidden via the .open class + aria-hidden when closed. -->
    <section
      ref="consoleEl"
      class="neural-console"
      :class="{ open: isOpen, 'reduced-motion': prefersReducedMotion }"
      data-test="neural-console"
      role="region"
      :aria-label="t('terminal.aria.consoleLabel')"
      :aria-hidden="!isOpen"
    >
      <div
        class="neural-matrix"
        :class="{ active: activity > 0, idle: activity === 0 }"
        :style="{ opacity: matrixOpacity }"
        aria-hidden="true"
      ></div>
      <Scanlines />

      <header class="neural-console-bar">
        <span class="neural-console-title neon-text">{{ t('terminal.launcher.label') }}</span>
        <button
          type="button"
          class="neural-close"
          data-test="neural-close"
          :aria-label="t('terminal.aria.closeButton')"
          @click="close"
        >
          ×
        </button>
      </header>

      <!-- Output: ARIA live region so screen readers announce each response. -->
      <div
        class="neural-output"
        data-test="neural-output"
        role="status"
        aria-live="polite"
        :aria-label="t('terminal.aria.outputLive')"
        ref="outputEl"
      >
        <div
          v-for="line in output"
          :key="line.id"
          class="terminal-line"
          :class="lineClass(line)"
        >
          <!-- echoed user input: prompt + raw text -->
          <template v-if="line.type === 'input'">
            <span class="terminal-prompt neon-text">{{ t('terminal.prompt') }}</span>
            <span class="terminal-input-text">{{ line.raw }}</span>
          </template>

          <!-- boot / system line -->
          <template v-else-if="line.type === 'system'">
            <span class="terminal-system neon-text">{{ resolveSystem(line) }}</span>
          </template>

          <!-- response line: cyberpunk styled + decode animation -->
          <template v-else>
            <span
              class="terminal-response neon-text glitch-text"
              :data-text="resolveResponse(line)"
              :class="{ 'decode-anim': !prefersReducedMotion }"
            >{{ decodeText(line) }}</span>
          </template>
        </div>

        <!-- "AI thinking" beat before longer responses -->
        <div v-if="thinking" class="terminal-thinking" :aria-label="t('terminal.aria.thinking')">
          <span class="terminal-thinking-dot"></span>
          <span class="terminal-thinking-dot"></span>
          <span class="terminal-thinking-dot"></span>
        </div>
      </div>

      <!-- Input row -->
      <div class="neural-input-row">
        <span class="terminal-prompt neon-text" aria-hidden="true">{{ t('terminal.prompt') }}</span>
        <input
          :id="inputId"
          ref="inputEl"
          v-model="input"
          class="neural-input"
          data-test="neural-input"
          type="text"
          :placeholder="t('terminal.placeholder')"
          :aria-label="t('terminal.aria.inputLabel')"
          autocomplete="off"
          spellcheck="false"
          @keydown="onInputKeydown"
          @input="bumpActivity"
        />
        <span
          class="terminal-cursor"
          :class="{ blink: !prefersReducedMotion }"
          aria-hidden="true"
        >{{ t('terminal.cursor') }}</span>
      </div>

      <!-- Mobile command chips: tap-driven palette under the mobile breakpoint -->
      <div
        v-if="isMobile"
        class="neural-chips"
        data-test="neural-chips"
        :aria-label="t('terminal.mobile.paletteTitle')"
      >
        <span class="neural-chips-title">{{ t('terminal.mobile.paletteTitle') }}</span>
        <div class="neural-chips-list">
          <button
            v-for="cmd in chipCommands"
            :key="cmd.name"
            type="button"
            class="terminal-chip cyber-button"
            @click="runChip(cmd.name)"
          >
            {{ chipLabel(cmd.name) }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import Scanlines from './Scanlines.vue'
import { useLanguage } from '../composables/useLanguage'
import { useTerminal } from '../composables/useTerminal.js'

const { t } = useLanguage()

// --- terminal brain ---------------------------------------------------------
const {
  input,
  output,
  isOpen,
  activity,
  burst,
  prefersReducedMotion,
  visibleCommands,
  runCommand,
  autocomplete,
  navigateHistory,
  clearOutput,
  open,
  close,
  toggle,
  bumpActivity,
  pushSystem,
} = useTerminal()

// Stable id for the input's <label> association (we use aria-label too, but
// keep the id available for an explicit label if the markup grows).
const inputId = 'neural-terminal-input'

// --- refs -------------------------------------------------------------------
const consoleEl = ref(null)
const inputEl = ref(null)
const outputEl = ref(null)

// --- mobile breakpoint ------------------------------------------------------
// Matches the scoped @media query below. Driven by matchMedia so the chips
// palette appears/disappears reactively without a resize listener.
const isMobile = ref(false)
let mobileMq = null
const onMobileChange = (e) => {
  isMobile.value = !!(e && e.matches)
}

// --- "AI thinking" beat -----------------------------------------------------
// Insert a brief thinking indicator before pushing a longer response so the
// console reads like a real neural link. Cleared as soon as the response is in
// the output buffer.
const thinking = ref(false)

// --- matrix reactivity (AC 1.6) ---------------------------------------------
// Each keystroke bumps `activity` (in the composable); here we (a) bind the
// matrix opacity to it so more keystrokes = more intense, and (b) DECAY it on
// an interval so the matrix relaxes back to idle when the user stops. The
// decay lives in the view (the composable just exposes the raw level).
const MATRIX_BASE_OPACITY = 0.12
const MATRIX_STEP = 0.02 // extra opacity per keystroke
const ACTIVITY_DECAY_MS = 150
let activityDecayTimer = null

const matrixOpacity = computed(() => {
  // More keystrokes = brighter matrix, capped so it never washes out.
  return MATRIX_BASE_OPACITY + Math.min(activity.value, 20) * MATRIX_STEP
})

// --- decode / scramble animation -------------------------------------------
// Per-line scramble state. We track a map of lineId -> currently-displayed
// (possibly scrambled) string so the decode animation can mutate one line
// without disturbing others. Under prefers-reduced-motion we render the final
// text immediately and never schedule a timer.
const decodeState = ref(new Map())
// Track EVERY outstanding decode-chain timer id in a Set (not a single shared
// id) so rapid typing — which fires several decode chains in parallel — can't
// orphan the earlier chains. On unmount we clear them all. (S-3: the old
// single-id scheme overwrote the id each tick, leaving earlier chains leaked.)
const decodeTimers = new Set()

const SCRAMBLE_CHARS = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEF'

function resolveResponse(line) {
  // The unknown-error response interpolates the typed command.
  if (line.i18nKey === 'terminal.errors.unknown' && line.raw) {
    return t('terminal.errors.unknown').replace('{cmd}', line.raw)
  }
  return t(line.i18nKey)
}

function resolveSystem(line) {
  return t(line.i18nKey)
}

function decodeText(line) {
  // Under reduced motion OR if no decode state exists yet, show the final text.
  const final = resolveResponse(line)
  if (prefersReducedMotion.value) return final
  const shown = decodeState.value.get(line.id)
  return shown !== undefined ? shown : final
}

function startDecodeFor(line) {
  if (prefersReducedMotion.value) return
  const target = resolveResponse(line)
  if (!target) return
  // Scramble for a handful of frames, then settle on the final text.
  let frame = 0
  const totalFrames = Math.min(12, Math.max(4, Math.ceil(target.length / 2)))
  const tick = () => {
    let out = ''
    for (let i = 0; i < target.length; i++) {
      const settled = i < (frame / totalFrames) * target.length
      out += settled
        ? target[i]
        : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
    }
    decodeState.value.set(line.id, out)
    // Force reactivity on the Map.
    decodeState.value = new Map(decodeState.value)
    frame++
    if (frame <= totalFrames) {
      // Track this timer id so it can be cleared on unmount (and self-removes
      // from the Set when it fires, so the Set only ever holds PENDING timers).
      const id = setTimeout(() => {
        decodeTimers.delete(id)
        tick()
      }, 28)
      decodeTimers.add(id)
    } else {
      decodeState.value.set(line.id, target)
      decodeState.value = new Map(decodeState.value)
    }
  }
  tick()
}

// --- output line styling ----------------------------------------------------
function lineClass(line) {
  if (line.type === 'input') return 'terminal-input-line'
  if (line.type === 'system') return 'terminal-system-line'
  return 'terminal-response-line'
}

// --- watch new responses: trigger decode + auto-scroll ----------------------
watch(
  () => output.value.length,
  async (count, prev) => {
    if (count <= prev) return
    const last = output.value[count - 1]
    if (last && last.type === 'response') {
      // Defer the decode slightly so the line mounts first.
      await nextTick()
      startDecodeFor(last)
    }
    await nextTick()
    if (outputEl.value) outputEl.value.scrollTop = outputEl.value.scrollHeight
  },
)

// --- "thinking" beat: show the indicator briefly before longer responses ---
// We watch for new input echoes; if a response is likely "longer" (the known
// content commands), we flash the indicator for a beat. This is cosmetic and
// is skipped under reduced motion to avoid a flashing element.
watch(
  () => output.value.length,
  async (count, prev) => {
    if (count <= prev || prefersReducedMotion.value) {
      thinking.value = false
      return
    }
    const last = output.value[count - 1]
    if (!last) return
    if (last.type === 'input') {
      const longer = ['about', 'services', 'ai', 'news', 'contact']
      if (longer.includes(String(last.raw).toLowerCase())) {
        thinking.value = true
        setTimeout(() => {
          thinking.value = false
        }, 220)
      }
    }
  },
)

// --- input key handling -----------------------------------------------------
function onInputKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    runCommand()
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    input.value = navigateHistory('up')
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    input.value = navigateHistory('down')
    return
  }
  if (e.key === 'Tab') {
    e.preventDefault()
    const filled = autocomplete()
    input.value = filled
    return
  }
}

// --- mobile chips -----------------------------------------------------------
// All public commands are surfaced as chips on mobile (including clear, so a
// mobile user can reset the buffer without a keyboard).
const chipCommands = computed(() => visibleCommands.value)

function chipLabel(name) {
  // The chip DISPLAY label is localized user-facing UI text (AC: UI text must be
  // localized). Clicking the chip still runs the canonical English command name
  // (the protocol), so runChip receives cmd.name, not the localized label.
  return t('terminal.mobile.chips.' + name)
}

function runChip(name) {
  input.value = name
  // small visual beat then execute
  runCommand()
  bumpActivity()
}

// --- focus management + Esc-to-close (scoped to when open) ------------------
function onDocKeydown(e) {
  if (!isOpen.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  // Focus trap: when Tabbing past the last focusable element inside the
  // console, wrap back to the input.
  if (e.key === 'Tab' && consoleEl.value) {
    const focusables = consoleEl.value.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

// --- boot sequence ----------------------------------------------------------
let bootTimers = []
function runBootSequence() {
  if (prefersReducedMotion.value) {
    // Under reduced motion, push the boot lines instantly and move on.
    pushSystem('terminal.boot.line1')
    pushSystem('terminal.boot.line2')
    pushSystem('terminal.boot.line3')
    pushSystem('terminal.boot.line4')
    pushSystem('terminal.intro')
    return
  }
  const lines = [
    'terminal.boot.line1',
    'terminal.boot.line2',
    'terminal.boot.line3',
    'terminal.boot.line4',
    'terminal.intro',
  ]
  lines.forEach((key, i) => {
    const id = setTimeout(() => {
      pushSystem(key)
    }, 180 * (i + 1))
    bootTimers.push(id)
  })
}

// --- when the console opens: focus input + boot if fresh -------------------
watch(isOpen, async (openState) => {
  if (openState) {
    await nextTick()
    if (inputEl.value) inputEl.value.focus()
    // Boot only once per session (when output is empty).
    if (output.value.length === 0) {
      runBootSequence()
    }
  }
})

// --- burst visual: clear after a beat so it can re-fire --------------------
watch(burst, (v) => {
  if (v) {
    setTimeout(() => {
      burst.value = false
    }, 1200)
  }
})

// --- lifecycle --------------------------------------------------------------
onMounted(() => {
  // prefers-reduced-motion + mobile matchMedia are wired in useTerminal for
  // motion; the mobile breakpoint is read here (the composable doesn't know
  // about the chip palette's breakpoint).
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mobileMq = window.matchMedia('(max-width: 768px)')
    isMobile.value = !!mobileMq.matches
    if (mobileMq.addEventListener) {
      mobileMq.addEventListener('change', onMobileChange)
    } else if (mobileMq.addListener) {
      mobileMq.addListener(onMobileChange)
    }
  }
  document.addEventListener('keydown', onDocKeydown)
  // AC 1.6: decay the activity level so the matrix relaxes back to idle when
  // the user stops typing. The composable only exposes `activity`; the view
  // owns the decay cadence (per the composable's JSDoc).
  activityDecayTimer = setInterval(() => {
    if (activity.value > 0) {
      activity.value = Math.max(0, activity.value - 1)
    }
  }, ACTIVITY_DECAY_MS)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onDocKeydown)
  if (activityDecayTimer) {
    clearInterval(activityDecayTimer)
    activityDecayTimer = null
  }
  // Clear EVERY outstanding decode-chain timer (rapid typing can leave several
  // chains in flight; the Set tracks them all so none leak on unmount). S-3.
  decodeTimers.forEach((id) => clearTimeout(id))
  decodeTimers.clear()
  bootTimers.forEach((id) => clearTimeout(id))
  if (mobileMq) {
    if (mobileMq.removeEventListener) {
      mobileMq.removeEventListener('change', onMobileChange)
    } else if (mobileMq.removeListener) {
      mobileMq.removeListener(onMobileChange)
    }
  }
})
</script>

<style scoped>
.neural-terminal-root {
  font-family: 'Courier New', 'Consolas', monospace;
}

/* ---- launcher -------------------------------------------------------------*/
.neural-launcher {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 9000;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.1rem;
  background: rgba(10, 10, 20, 0.85);
  color: #00ffff;
  border: 1px solid #00ffff;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  box-shadow:
    0 0 8px rgba(0, 255, 255, 0.4),
    inset 0 0 6px rgba(0, 255, 255, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.neural-launcher:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 18px rgba(0, 255, 255, 0.7),
    inset 0 0 10px rgba(0, 255, 255, 0.25);
}

.neural-launcher-glyph {
  font-weight: bold;
  color: #ff00ff;
  text-shadow: 0 0 8px #ff00ff;
}

.neural-launcher-label {
  color: #00ffff;
}

/* ---- console shell --------------------------------------------------------*/
.neural-console {
  position: fixed;
  right: 1.5rem;
  bottom: 5rem;
  width: min(640px, calc(100vw - 3rem));
  max-height: min(70vh, 560px);
  display: none;
  flex-direction: column;
  background: rgba(5, 8, 14, 0.96);
  border: 1px solid #00ffff;
  border-radius: 8px;
  overflow: hidden;
  z-index: 9001;
  box-shadow:
    0 0 24px rgba(0, 255, 255, 0.35),
    0 0 60px rgba(255, 0, 255, 0.15);
  font-family: inherit;
  color: #c8ffe8;
}

.neural-console.open {
  display: flex;
}

/* ---- matrix bg ------------------------------------------------------------*/
/* Opacity is driven by the bound inline style (matrixOpacity), so the class
   rules here only carry the grid-spacing + idle-pulse state effects. AC 1.6:
   more keystrokes => brighter (inline opacity) + tighter grid (.active); idle
   => relaxed grid (.idle) with a slow neural pulse. */
.neural-matrix {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.18) 1px, transparent 1px);
  background-size: 24px 24px;
  transition: opacity 0.4s ease, background-size 0.4s ease;
}

.neural-matrix.active {
  background-size: 18px 18px;
}

.neural-matrix.idle {
  animation: terminal-matrix-pulse 4s ease-in-out infinite;
}

@keyframes terminal-matrix-pulse {
  0%, 100% { filter: brightness(0.9); }
  50% { filter: brightness(1.15); }
}

/* ---- console bar ----------------------------------------------------------*/
.neural-console-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.85rem;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 255, 0.12),
    rgba(255, 0, 255, 0.08)
  );
  border-bottom: 1px solid rgba(0, 255, 255, 0.35);
}

.neural-console-title {
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #00ffff;
}

.neural-close {
  background: transparent;
  border: 1px solid rgba(255, 0, 255, 0.5);
  color: #ff66ff;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 4px;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.neural-close:hover {
  box-shadow: 0 0 8px rgba(255, 0, 255, 0.6);
}

/* ---- output ---------------------------------------------------------------*/
.neural-output {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.85rem 1rem;
  font-size: 0.92rem;
  line-height: 1.55;
}

.terminal-line {
  margin-bottom: 0.35rem;
  word-break: break-word;
}

.terminal-prompt {
  margin-right: 0.4rem;
  color: #00ff88;
  text-shadow: 0 0 6px rgba(0, 255, 136, 0.6);
}

.terminal-input-text {
  color: #ffffff;
}

.terminal-system {
  color: #ffcc00;
  text-shadow: 0 0 6px rgba(255, 204, 0, 0.5);
}

.terminal-response {
  display: inline-block;
  color: #c8ffe8;
  position: relative;
}

/* neon-text (shared convention from Home.vue) -------------------------------*/
.neon-text {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor;
}

/* glitch-text pseudo layers -------------------------------------------------*/
.glitch-text {
  position: relative;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  pointer-events: none;
}

.glitch-text::before {
  color: #ff00ff;
  transform: translate(-1px, 0);
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}

.glitch-text::after {
  color: #00ffff;
  transform: translate(1px, 0);
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
}

/* decode animation toggles the glitch layers via the .decode-anim class ----*/
.decode-anim::before,
.decode-anim::after {
  animation: terminal-glitch 0.35s steps(2) infinite;
}

@keyframes terminal-glitch {
  0% { transform: translate(0, 0); }
  50% { transform: translate(-2px, 1px); }
  100% { transform: translate(2px, -1px); }
}

/* ---- thinking dots --------------------------------------------------------*/
.terminal-thinking {
  display: inline-flex;
  gap: 0.25rem;
  margin: 0.2rem 0;
}

.terminal-thinking-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ffff;
  box-shadow: 0 0 6px #00ffff;
  animation: terminal-think 1s ease-in-out infinite;
}

.terminal-thinking-dot:nth-child(2) { animation-delay: 0.15s; }
.terminal-thinking-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes terminal-think {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}

/* ---- input row ------------------------------------------------------------*/
.neural-input-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  border-top: 1px solid rgba(0, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.4);
}

.neural-input {
  flex: 1 1 auto;
  background: transparent;
  border: none;
  outline: none;
  color: #c8ffe8;
  font-family: inherit;
  font-size: 0.95rem;
  caret-color: #00ff88;
}

.neural-input::placeholder {
  color: rgba(0, 255, 255, 0.45);
}

.terminal-cursor {
  margin-left: 0.3rem;
  color: #00ff88;
}

.terminal-cursor.blink {
  animation: terminal-blink 1s steps(2) infinite;
}

@keyframes terminal-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* ---- mobile chips ---------------------------------------------------------*/
.neural-chips {
  position: relative;
  z-index: 2;
  padding: 0.5rem 0.75rem 0.75rem;
  border-top: 1px solid rgba(0, 255, 136, 0.3);
  background: rgba(0, 0, 0, 0.35);
}

.neural-chips-title {
  display: block;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #00ffff;
  margin-bottom: 0.4rem;
}

.neural-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.terminal-chip {
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
  font-family: inherit;
  color: #00ff88;
  background: rgba(0, 255, 136, 0.08);
  border: 1px solid #00ff88;
  border-radius: 4px;
  cursor: pointer;
}

.terminal-chip:hover {
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

/* ---- mobile breakpoint ----------------------------------------------------*/
@media (max-width: 768px) {
  .neural-launcher-label {
    display: none;
  }
  .neural-launcher {
    padding: 0.6rem 0.85rem;
  }
  .neural-console {
    right: 0.75rem;
    left: 0.75rem;
    width: auto;
    bottom: 4.5rem;
  }
}

/* ---- reduced motion -------------------------------------------------------*/
.neural-console.reduced-motion .decode-anim::before,
.neural-console.reduced-motion .decode-anim::after {
  animation: none;
  display: none;
}

.neural-console.reduced-motion .terminal-cursor.blink {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .neural-launcher,
  .neural-matrix {
    transition: none;
  }
  .decode-anim::before,
  .decode-anim::after {
    animation: none;
  }
}

/* ---- easter-egg burst overlay ---------------------------------------------*/
/* Fixed full-screen flash + scanline tear + radiating particles, fired when a
   hidden command runs. Animation auto-clears via the v-if (burst is reset after
   1200ms). Under prefers-reduced-motion we drop the motion but keep a static
   neon flash so the feedback is still perceivable. */
.terminal-burst {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
  animation: terminal-burst-flash 0.9s ease-out forwards;
}

.terminal-burst-scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 0, 255, 0.9),
    rgba(0, 255, 255, 0.9),
    transparent
  );
  box-shadow: 0 0 16px rgba(255, 0, 255, 0.8);
  animation: terminal-burst-scan 0.7s linear;
}

.terminal-burst-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00ffff;
  box-shadow: 0 0 8px #00ffff;
  --dx: 0px;
  --dy: 0px;
  animation: terminal-burst-particle 0.9s ease-out forwards;
}
/* Distribute the 12 particles radially via nth-child offsets. */
.terminal-burst-particle:nth-child(2)  { --dx:  40vw; --dy: -30vh; background:#ff00ff; box-shadow:0 0 8px #ff00ff; }
.terminal-burst-particle:nth-child(3)  { --dx: -40vw; --dy: -20vh; }
.terminal-burst-particle:nth-child(4)  { --dx:  30vw; --dy:  35vh; background:#ff00ff; box-shadow:0 0 8px #ff00ff; }
.terminal-burst-particle:nth-child(5)  { --dx: -35vw; --dy:  25vh; }
.terminal-burst-particle:nth-child(6)  { --dx:  50vw; --dy:   5vh; background:#00ff88; box-shadow:0 0 8px #00ff88; }
.terminal-burst-particle:nth-child(7)  { --dx: -50vw; --dy:  -5vh; }
.terminal-burst-particle:nth-child(8)  { --dx:  10vw; --dy: -45vh; background:#ff00ff; box-shadow:0 0 8px #ff00ff; }
.terminal-burst-particle:nth-child(9)  { --dx: -10vw; --dy:  45vh; }
.terminal-burst-particle:nth-child(10) { --dx:  45vw; --dy: -40vh; }
.terminal-burst-particle:nth-child(11) { --dx: -45vw; --dy:  40vh; background:#00ff88; box-shadow:0 0 8px #00ff88; }
.terminal-burst-particle:nth-child(12) { --dx:   0vw; --dy:  50vh; background:#ff00ff; box-shadow:0 0 8px #ff00ff; }
.terminal-burst-particle:nth-child(13) { --dx:   0vw; --dy: -50vh; }

@keyframes terminal-burst-flash {
  0%   { background: rgba(255, 0, 255, 0); }
  10%  { background: rgba(255, 0, 255, 0.35); }
  30%  { background: rgba(0, 255, 255, 0.25); }
  100% { background: rgba(0, 0, 0, 0); }
}

@keyframes terminal-burst-scan {
  0%   { top: 0; opacity: 1; }
  100% { top: 100%; opacity: 0.2; }
}

@keyframes terminal-burst-particle {
  0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.2); opacity: 0; }
}

/* Reduced motion: keep a perceivable static flash, drop all motion. */
.terminal-burst.reduced-motion,
.terminal-burst.reduced-motion .terminal-burst-scan,
.terminal-burst.reduced-motion .terminal-burst-particle {
  animation: none;
}
.terminal-burst.reduced-motion {
  background: rgba(0, 255, 255, 0.18);
}

@media (prefers-reduced-motion: reduce) {
  .terminal-burst,
  .terminal-burst-scan,
  .terminal-burst-particle {
    animation: none;
  }
  .terminal-burst {
    background: rgba(0, 255, 255, 0.18);
  }
}
</style>
