<script setup>
/**
 * PacketRoute.vue — Packet Route cyber puzzle mini-game (#184).
 *
 * Thin presentation layer over usePacketRoute. Renders the neon grid, the
 * tile visuals (open sides depicted as glowing conduits), the source/target
 * endpoints, the packet-travel orb animation, and the win/lose feedback. Every
 * usePacketRoute ref is bound to a template consumer here (dead-reactive-state
 * gate). Reuses the existing cyber palette via CSS vars (no new colors).
 *
 * @ticket #184
 */
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { usePacketRoute, tileOpenSides } from '../composables/usePacketRoute'
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

const {
  levelIndex,
  grid,
  moves,
  elapsedMs,
  status,
  hintCell,
  prefersReducedMotion,
  packetPath,
  packetProgress,
  cursor,
  currentLevel,
  bestScore,
  levels,
  rotateTile,
  cursorRotate,
  moveCursor,
  transmit,
  reset,
  nextLevel,
  replay,
  requestHint,
} = usePacketRoute()

// ---------- grid geometry ----------
const rows = computed(() => currentLevel.value.rows)
const cols = computed(() => currentLevel.value.cols)

/** Build the (r,c) iteration order for the CSS grid (row-major). */
const cells = computed(() => {
  const out = []
  for (let r = 0; r < rows.value; r++) {
    for (let c = 0; c < cols.value; c++) {
      const cell = grid.value.get(`${r},${c}`) || { r, c, type: 'empty', rotation: 0 }
      out.push(cell)
    }
  }
  return out
})

// ---------- source/target endpoints ----------
const source = computed(() => currentLevel.value.source)
const target = computed(() => currentLevel.value.target)

/** True if a cell at (r,c) is the source endpoint position. */
function isSource(r, c) {
  return source.value.r === r && source.value.c === c
}
function isTarget(r, c) {
  return target.value.r === r && target.value.c === c
}

// ---------- tile visual model ----------
// Each tile type renders a conduit shape via 4 directional segments reflecting
// open sides. We compute the open-side set per cell to drive both rendering
// + sr-labels.
function openSides(cell) {
  if (cell.type === 'empty' || cell.type === 'firewall') return []
  return [...tileOpenSides(cell.type, cell.rotation)]
}

function tileLabelKey(type) {
  return `packetRoute.tiles.${type}`
}

// ---------- packet orb ----------
// The orb position is derived from packetProgress (a float cell-index along
// the path). We translate the orb to the path cell at floor(progress).
const orbCell = computed(() => {
  const idx = Math.min(packetPath.value.length - 1, Math.floor(packetProgress.value))
  return packetPath.value[idx] || null
})

// ---------- scoring readout ----------
const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))
const statusKey = computed(() => {
  if (status.value === 'won') return 'packetRoute.status.won'
  if (status.value === 'lost') return 'packetRoute.status.lost'
  if (status.value === 'transmitting') return 'packetRoute.status.transmitting'
  return 'packetRoute.status.idle'
})
const statusMeaningKey = computed(() => {
  if (status.value === 'won') return 'packetRoute.status.wonMeaning'
  if (status.value === 'lost') return 'packetRoute.status.lostMeaning'
  return null
})

// ---------- ARIA live region message ----------
const liveMessage = computed(() => {
  if (status.value === 'won') return t('packetRoute.aria.winAnnounce')
  if (status.value === 'lost') return t('packetRoute.aria.loseAnnounce')
  if (hintCell.value) {
    return t('packetRoute.aria.hintAnnounce', { row: hintCell.value.r + 1, column: hintCell.value.c + 1 })
  }
  return t('packetRoute.aria.liveRegion', {
    level: levelIndex.value + 1,
    moves: moves.value,
    seconds: elapsedSeconds.value,
    status: t(statusKey.value),
  })
})

// ---------- actions ----------
function onCellClick(cell) {
  if (cell.type === 'firewall' || cell.type === 'empty') return
  if (isSource(cell.r, cell.c) || isTarget(cell.r, cell.c)) return
  cursor.value = { r: cell.r, c: cell.c }
  rotateTile(cell.r, cell.c)
}

function onKeydown(e) {
  const k = e.key
  if (k === 'ArrowUp') { e.preventDefault(); moveCursor('up') }
  else if (k === 'ArrowDown') { e.preventDefault(); moveCursor('down') }
  else if (k === 'ArrowLeft') { e.preventDefault(); moveCursor('left') }
  else if (k === 'ArrowRight') { e.preventDefault(); moveCursor('right') }
  else if (k === ' ' || k === 'Enter') { e.preventDefault(); cursorRotate() }
  else if (k === 't' || k === 'T') { e.preventDefault(); transmit() }
  else if (k === 'h' || k === 'H') { e.preventDefault(); requestHint() }
  else return
}

const gridRef = ref(null)
onMounted(() => {
  // Focus the grid container so keyboard control works without an extra tab.
  if (gridRef.value && typeof gridRef.value.focus === 'function') {
    // Do NOT steal focus on mount; let the user focus it via tabindex.
  }
})
onBeforeUnmount(() => {
  // Composable cleans up its own rAF/observers in onUnmounted.
})
</script>

<template>
  <section
    class="packet-route"
    :class="{ 'reduced-motion': prefersReducedMotion, 'is-won': status === 'won', 'is-lost': status === 'lost' }"
    data-test="packet-route"
    :aria-label="t('packetRoute.aria.regionLabel')"
  >
    <!-- Scoped scanline strip (NOT the global position:fixed Scanlines.vue). -->
    <div class="packet-scanlines" aria-hidden="true"></div>

    <header class="packet-header">
      <h2 class="packet-title neon-text">{{ t('packetRoute.title') }}</h2>
      <p class="packet-subtitle">{{ t('packetRoute.subtitle') }}</p>
      <p class="packet-instructions">{{ t('packetRoute.instructions') }}</p>
    </header>

    <!-- Scoring readout -->
    <div class="packet-readout" data-test="packet-readout">
      <span class="readout-chip">{{ t('packetRoute.scoring.level') }} {{ levelIndex + 1 }}/{{ levels.length }}</span>
      <span class="readout-chip">{{ t('packetRoute.scoring.moves') }}: {{ moves }}</span>
      <span class="readout-chip">{{ t('packetRoute.scoring.time') }}: {{ elapsedSeconds }}s</span>
      <span class="readout-chip" data-test="packet-best">
        {{ t('packetRoute.scoring.best') }}: {{ bestScore === null ? '—' : bestScore }}
      </span>
    </div>

    <!-- Puzzle grid -->
    <div
      ref="gridRef"
      class="packet-grid"
      data-test="packet-grid"
      tabindex="0"
      role="grid"
      :aria-label="t('packetRoute.aria.gridLabel')"
      :style="{ '--cols': cols, '--rows': rows }"
      @keydown="onKeydown"
    >
      <template v-for="cell in cells" :key="`${cell.r},${cell.c}`">
        <div
          v-if="isSource(cell.r, cell.c) || isTarget(cell.r, cell.c)"
          class="packet-cell packet-endpoint"
          :class="isSource(cell.r, cell.c) ? 'is-source' : 'is-target'"
          :data-test="isSource(cell.r, cell.c) ? 'packet-source' : 'packet-target'"
        >
          <span class="endpoint-label">
            {{ isSource(cell.r, cell.c) ? t('packetRoute.tiles.source') : t('packetRoute.tiles.target') }}
          </span>
        </div>
        <button
          v-else
          type="button"
          class="packet-cell packet-tile"
          :class="[
            `tile-${cell.type}`,
            `rot-${cell.rotation}`,
            {
              'is-cursor': cursor.r === cell.r && cursor.c === cell.c,
              'is-hint': hintCell && hintCell.r === cell.r && hintCell.c === cell.c,
              'is-firewall': cell.type === 'firewall',
            },
          ]"
          :data-test="`packet-tile-${cell.r}-${cell.c}`"
          :data-type="cell.type"
          :aria-label="t('packetRoute.aria.tileLabel', {
            type: t(tileLabelKey(cell.type)),
            row: cell.r + 1,
            column: cell.c + 1,
            rotation: cell.rotation,
          })"
          @click="onCellClick(cell)"
        >
          <!-- Conduit shape: 4 directional segments, lit if open. -->
          <span class="conduit conduit-n" :class="{ lit: openSides(cell).includes('N') }"></span>
          <span class="conduit conduit-e" :class="{ lit: openSides(cell).includes('E') }"></span>
          <span class="conduit conduit-s" :class="{ lit: openSides(cell).includes('S') }"></span>
          <span class="conduit conduit-w" :class="{ lit: openSides(cell).includes('W') }"></span>
          <span class="hub"></span>
          <span v-if="cell.type === 'firewall'" class="firewall-mark" aria-hidden="true">▓</span>
        </button>
      </template>

      <!-- Packet orb (only during transmitting / won) -->
      <div
        v-if="(status === 'transmitting' || status === 'won') && orbCell"
        class="packet-orb"
        data-test="packet-orb"
        :style="{
          left: `calc((100% / ${cols}) * ${orbCell.c} + (100% / ${cols}) / 2)`,
          top: `calc((100% / ${rows}) * ${orbCell.r} + (100% / ${rows}) / 2)`,
        }"
        aria-hidden="true"
      ></div>
    </div>

    <!-- Controls -->
    <div class="packet-controls" data-test="packet-controls">
      <button
        type="button"
        class="packet-btn primary"
        data-test="packet-transmit"
        :aria-label="t('packetRoute.aria.transmitButton')"
        :disabled="status === 'transmitting' || status === 'won'"
        @click="transmit"
      >⚡ {{ t('packetRoute.buttons.transmit') }}</button>
      <button
        type="button"
        class="packet-btn"
        data-test="packet-reset"
        :aria-label="t('packetRoute.aria.resetButton')"
        @click="reset"
      >↺ {{ t('packetRoute.buttons.reset') }}</button>
      <button
        type="button"
        class="packet-btn"
        data-test="packet-hint"
        :aria-label="t('packetRoute.aria.hintButton')"
        @click="requestHint"
      >? {{ t('packetRoute.buttons.hint') }}</button>
      <button
        v-if="status === 'won'"
        type="button"
        class="packet-btn primary"
        data-test="packet-next"
        :aria-label="t('packetRoute.aria.nextButton')"
        @click="nextLevel"
      >▶ {{ t('packetRoute.buttons.next') }}</button>
      <button
        v-if="status === 'won' || status === 'lost'"
        type="button"
        class="packet-btn"
        data-test="packet-replay"
        :aria-label="t('packetRoute.aria.replayButton')"
        @click="replay"
      >↻ {{ t('packetRoute.buttons.replay') }}</button>
    </div>

    <!-- How-to -->
    <ul class="packet-howto">
      <li>{{ t('packetRoute.howTo.rotate') }}</li>
      <li>{{ t('packetRoute.howTo.transmit') }}</li>
      <li>{{ t('packetRoute.howTo.hint') }}</li>
    </ul>

    <!-- Win / lose feedback -->
    <div
      v-if="status === 'won' || status === 'lost'"
      class="packet-feedback"
      :class="status === 'won' ? 'feedback-won' : 'feedback-lost'"
      data-test="packet-feedback"
    >
      <span
        class="feedback-text glitch-text"
        :data-text="status === 'won' ? t('packetRoute.status.won') : t('packetRoute.status.lost')"
      >{{ status === 'won' ? t('packetRoute.status.won') : t('packetRoute.status.lost') }}</span>
      <span v-if="statusMeaningKey" class="feedback-meaning">{{ t(statusMeaningKey) }}</span>
    </div>

    <p v-if="prefersReducedMotion" class="packet-reduced-note">{{ t('packetRoute.reducedMotion') }}</p>

    <!-- ARIA live region (polite) announcing win/lose/cursor state -->
    <p class="visually-hidden" role="status" aria-live="polite" data-test="packet-live">{{ liveMessage }}</p>
  </section>
</template>

<style scoped>
.packet-route {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  padding: 1.5rem;
  margin: 2rem auto;
  max-width: 1000px;
  box-shadow: 0 0 10px var(--glow-color), inset 0 0 20px rgba(0, 0, 0, 0.4);
}

/* Scoped scanline strip — repeating-linear-gradient, position:absolute WITHIN
   the frame (NOT the global position:fixed Scanlines.vue). */
@keyframes packet-scanline {
  0% { background-position: 0 0; }
  100% { background-position: 0 100%; }
}

.packet-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(0, 255, 136, 0.03) 0px,
    rgba(0, 255, 136, 0.03) 1px,
    transparent 1px,
    transparent 3px
  );
  background-size: 100% 6px;
  animation: packet-scanline 8s linear infinite;
  z-index: 0;
}

.packet-header {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 1rem;
}

.packet-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.6rem;
  color: var(--neon-green);
  margin: 0;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.packet-subtitle {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0.3rem 0;
  letter-spacing: 0.06em;
}

.packet-instructions {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0.3rem 0 0 0;
  opacity: 0.85;
}

/* Scoring readout */
.packet-readout {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.readout-chip {
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  color: var(--neon-green);
  border: 1px solid var(--card-border);
  padding: 0.2rem 0.6rem;
  background: rgba(0, 0, 0, 0.3);
  letter-spacing: 0.08em;
}

/* Puzzle grid */
.packet-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 2px;
  /* Grid scales to viewport via clamp — mobile responsive. */
  width: min(100%, clamp(240px, 60vw, 480px));
  aspect-ratio: var(--cols) / var(--rows);
  margin: 0 auto;
  background:
    linear-gradient(rgba(0, 255, 136, 0.15) 1px, transparent 1px) 0 0 / 100% calc(100% / var(--rows)),
    linear-gradient(90deg, rgba(0, 255, 136, 0.15) 1px, transparent 1px) 0 0 / calc(100% / var(--cols)) 100%,
    rgba(0, 0, 0, 0.5);
  border: 1px solid var(--neon-green);
  box-shadow: 0 0 12px var(--glow-color), inset 0 0 12px rgba(0, 0, 0, 0.6);
}

.packet-grid:focus-visible {
  outline: 2px solid var(--neon-green);
  outline-offset: 2px;
}

.packet-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.packet-tile {
  color: var(--neon-green);
}

.packet-tile:focus-visible {
  outline: 2px solid var(--neon-pink);
  outline-offset: -2px;
}

.packet-tile.is-cursor {
  box-shadow: inset 0 0 0 2px var(--neon-pink);
}

.packet-tile.is-hint {
  animation: packet-hint-pulse 1s ease-in-out infinite;
}

@keyframes packet-hint-pulse {
  0%, 100% { box-shadow: inset 0 0 6px var(--neon-green); }
  50% { box-shadow: inset 0 0 16px var(--neon-green); }
}

/* Conduits — four directional segments from the cell center. Only `.lit`
   segments render a glowing neon line; unlit are invisible. */
.conduit {
  position: absolute;
  background: var(--neon-green);
  box-shadow: 0 0 4px var(--neon-green), 0 0 8px var(--neon-green);
  opacity: 0;
  transition: opacity 0.12s ease;
}
.conduit.lit { opacity: 1; }

.conduit-n, .conduit-s {
  left: 50%;
  width: 14%;
  height: 50%;
  transform: translateX(-50%);
}
.conduit-n { top: 0; }
.conduit-s { bottom: 0; }

.conduit-e, .conduit-w {
  top: 50%;
  height: 14%;
  width: 50%;
  transform: translateY(-50%);
}
.conduit-e { right: 0; }
.conduit-w { left: 0; }

.hub {
  position: absolute;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background: var(--neon-green);
  box-shadow: 0 0 6px var(--neon-green);
}

.firewall-mark {
  position: relative;
  z-index: 1;
  font-family: 'Orbitron', monospace;
  color: var(--neon-pink);
  text-shadow: 0 0 6px var(--neon-pink);
  font-size: 1.2rem;
  letter-spacing: 0.1em;
}

.packet-tile.is-firewall {
  cursor: not-allowed;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 0, 255, 0.12) 0px,
    rgba(255, 0, 255, 0.12) 4px,
    transparent 4px,
    transparent 8px
  );
}

/* Endpoint cells (source/target) — fixed, glowing. */
.packet-endpoint {
  background: rgba(0, 255, 136, 0.08);
  font-family: 'Orbitron', monospace;
  font-size: 0.55rem;
  color: var(--neon-green);
  text-shadow: 0 0 4px var(--neon-green);
  letter-spacing: 0.05em;
  text-align: center;
}
.packet-endpoint.is-target {
  background: rgba(255, 0, 255, 0.08);
  color: var(--neon-pink);
  text-shadow: 0 0 4px var(--neon-pink);
}
.endpoint-label {
  position: relative;
  z-index: 1;
  line-height: 1.1;
}

/* Packet orb — glowing, transform/opacity only animation. */
@keyframes packet-orb-glow {
  0%, 100% { box-shadow: 0 0 8px var(--neon-green), 0 0 16px var(--neon-green); opacity: 1; }
  50% { box-shadow: 0 0 14px var(--neon-green), 0 0 28px var(--neon-green); opacity: 0.85; }
}

.packet-orb {
  position: absolute;
  width: 14%;
  height: 14%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--neon-green);
  pointer-events: none;
  z-index: 5;
  animation: packet-orb-glow 0.4s ease-in-out infinite;
}

/* Controls */
.packet-controls {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.packet-btn {
  font-family: 'Orbitron', monospace;
  font-size: 0.85rem;
  color: var(--neon-green);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--card-border);
  padding: 0.5rem 1rem;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.packet-btn:hover:not(:disabled),
.packet-btn:focus-visible {
  border-color: var(--neon-green);
  box-shadow: 0 0 8px var(--glow-color);
  outline: none;
}

.packet-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.packet-btn.primary {
  border-color: var(--neon-green);
  box-shadow: 0 0 6px var(--glow-color);
}

/* How-to list */
.packet-howto {
  position: relative;
  z-index: 1;
  list-style: none;
  margin: 1rem 0 0 0;
  padding: 0;
  text-align: center;
}
.packet-howto li {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.8;
  line-height: 1.5;
}

/* Win / lose feedback */
.packet-feedback {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: 1rem;
}

.feedback-text {
  display: block;
  font-family: 'Orbitron', monospace;
  font-size: 1.4rem;
  letter-spacing: 0.15em;
}

.feedback-won .feedback-text {
  color: var(--neon-green);
  text-shadow: 0 0 8px var(--neon-green), 0 0 16px var(--neon-green);
  animation: packet-glitch-win 0.4s infinite;
}

.feedback-lost .feedback-text {
  color: var(--neon-pink);
  text-shadow: 0 0 8px var(--neon-pink), 0 0 16px var(--neon-pink);
  animation: packet-shake 0.4s ease-in-out infinite;
}

@keyframes packet-glitch-win {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
  100% { transform: translate(0); }
}

@keyframes packet-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.feedback-meaning {
  display: block;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.3rem;
}

.packet-reduced-note {
  position: relative;
  z-index: 1;
  text-align: center;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0.8rem 0 0 0;
  opacity: 0.7;
}

/* Visually-hidden but available to AT. */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Glitch-text pseudo layers (reuse the home glitch-text pattern). */
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
  opacity: 0.8;
}
.feedback-won .glitch-text::before {
  color: var(--neon-pink);
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}
.feedback-won .glitch-text::after {
  color: var(--neon-blue);
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
}

/* ---- reduced motion: kill every animation (seizure-safe, AC 3.2) --------- */
.reduced-motion .packet-scanlines,
.reduced-motion .packet-orb,
.reduced-motion .feedback-won .feedback-text,
.reduced-motion .feedback-lost .feedback-text,
.reduced-motion .packet-tile.is-hint,
.reduced-motion * {
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  .packet-route .packet-scanlines,
  .packet-route .packet-orb,
  .packet-route .feedback-text,
  .packet-route * {
    animation: none !important;
  }
}

/* ---- mobile ------------------------------------------------------------- */
@media (max-width: 768px) {
  .packet-title { font-size: 1.3rem; }
  .packet-grid {
    width: min(100%, 90vw);
  }
  .endpoint-label { font-size: 0.45rem; }
  .feedback-text { font-size: 1.1rem; }
}
</style>
