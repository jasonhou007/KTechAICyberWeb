<script setup>
// ========== IMPORTS ==========
import { computed, ref } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useSettlementStream } from '../composables/useSettlementStream'
import Scanlines from './Scanlines.vue'

// ========== I18N ==========
// REAL useLanguage (NOT mocked — iter-28 rule). Resolves en by default.
const { t } = useLanguage()

// ========== STREAM ROOT REF ==========
// AC 3.2: the composable observes THIS root element so its rAF loop + idle
// interval actually throttle when the stream scrolls offscreen. Without this
// binding the composable would have no element to observe (the iter-23 gap was
// observing document.body, which is always intersecting).
const rootRef = ref(null)

// ========== STREAM BRAIN ==========
// Thin presentation layer over useSettlementStream (#206). Every returned ref
// is consumed below (no dead reactive state — iter-10 gate):
//   packets -> .ss-packet translateX
//   latestBlock + recentBlocks -> .ss-block readouts
//   fxRates -> .ss-fx-row readouts
//   liquidity -> .ss-liquidity-fill height + aria-label
//   prefersReducedMotion -> static summary branch
//   rails -> node label resolution
// isVisible + isMobile are NOT destructured here — the composable consumes
// them internally (updateRunning / maxPackets / mobile-degrade) but no
// template binding reads them (iter-10 dead-export gate).
const {
  packets,
  latestBlock,
  recentBlocks,
  settledCount,
  fxRates,
  liquidity,
  reducedSummary,
  prefersReducedMotion,
  rails,
} = useSettlementStream({ rootRef })

// ========== COMPUTED ==========
// Resolve a rail's node labels via i18n (rails carry i18n keys).
const railNodes = computed(() =>
  rails.map((r) => ({
    id: r.id,
    from: t(r.fromLabel),
    to: t(r.toLabel),
    fromCurrency: r.fromCurrency,
    toCurrency: r.toCurrency,
  })),
)

// FX direction arrow (semantic, not decorative).
const fxDirSymbol = (dir) => (dir === 'up' ? '↑' : '↓')

// Liquidity readout (semantic + selectable).
const liquidityLabel = computed(() =>
  prefersReducedMotion.value && reducedSummary.value
    ? reducedSummary.value.liquidity
    : liquidity.value.toFixed(0),
)
</script>

<template>
  <div
    ref="rootRef"
    class="settlement-stream"
    data-test="settlement-stream"
    :aria-label="t('settlementStream.ariaLabel')"
    role="img"
  >
    <!-- ===== Ambient background layer =====
         The decoration layer is aria-hidden (AC 4.4); real readouts are
         semantic + selectable in the readout columns below. -->
    <div class="ss-bg" aria-hidden="true">
      <!-- Rails: China <-> ASEAN arcs with travelling packets. -->
      <div class="ss-rails" data-test="ss-rails" aria-hidden="true">
        <div
          v-for="rail in railNodes"
          :key="rail.id"
          class="ss-rail"
          :class="`ss-rail--${rail.id}`"
        >
          <span class="ss-node ss-node--from">{{ rail.from }} · {{ rail.fromCurrency }}</span>
          <span class="ss-rail-line"></span>
          <span class="ss-node ss-node--to">{{ rail.to }} · {{ rail.toCurrency }}</span>
          <!-- Packets on this rail (translateX driven by composable progress). -->
          <span
            v-for="p in packets.filter((pk) => pk.railId === rail.id)"
            :key="p.id"
            class="ss-packet"
            :style="{ transform: `translateX(${p.progress * 100}%)` }"
          ></span>
        </div>
      </div>

      <!-- Reused CRT scanline overlay (AC 2 — do not reimplement). -->
      <Scanlines />

      <!-- ===== #235 seizure-safe glitch pulse =====
           A single <=2Hz (3.2s) chromatic-aberration pulse via STATIC-tint
           ::before/::after pseudo-elements (neon-blue / neon-pink) that
           translate in opposite directions + pulse opacity during the window.
           This is NOT a continuous flicker (deferred from #206 AC 2.1 because
           #224 removed unbounded strobe as a seizure hazard). aria-hidden +
           pointer-events:none — pure decoration, never read by AT. -->
      <div
        class="ss-glitch-pulse"
        data-test="ss-glitch-pulse"
        aria-hidden="true"
      ></div>
    </div>

    <!-- ===== Readout surface (real text, semantic, selectable) =====
         These are NOT aria-hidden — the story is legible to AT. -->
    <div class="ss-readouts">
      <!-- Block settlement column -->
      <div class="ss-blocks" data-test="ss-blocks">
        <div class="ss-readout-title">{{ t('settlementStream.blocks.title') }}</div>
        <div class="ss-block-current">
          <span class="ss-block-height">#{{ latestBlock.height }}</span>
          <span class="ss-block-hash">{{ latestBlock.hash }}</span>
        </div>
        <ul class="ss-block-list">
          <li
            v-for="blk in recentBlocks"
            :key="blk.height"
            class="ss-block-row"
          >
            <span class="ss-block-row-height">#{{ blk.height }}</span>
            <span class="ss-block-row-tx">{{ blk.txCount }} tx</span>
          </li>
        </ul>
        <div class="ss-settled">
          {{ t('settlementStream.settled') }} · {{ settledCount.toLocaleString() }}
        </div>
      </div>

      <!-- FX ticker column -->
      <div class="ss-fx" data-test="ss-fx">
        <div class="ss-readout-title">{{ t('settlementStream.fx.title') }}</div>
        <div
          v-for="(rate, idx) in fxRates"
          :key="rate.pair"
          class="ss-fx-row"
          :class="`ss-fx-row--${rate.dir}`"
        >
          <span class="ss-fx-pair">{{ rate.pair }}</span>
          <span class="ss-fx-rate">{{ rate.rate.toFixed(2) }} {{ fxDirSymbol(rate.dir) }}</span>
        </div>
      </div>

      <!-- Liquidity pulse column -->
      <div class="ss-liquidity" data-test="ss-liquidity">
        <div class="ss-readout-title">{{ t('settlementStream.liquidity.title') }}</div>
        <div class="ss-liquidity-meter" aria-hidden="true">
          <div
            class="ss-liquidity-fill"
            :style="{ height: `${liquidityLabel}%` }"
          ></div>
        </div>
        <div class="ss-liquidity-readout">
          {{ t('settlementStream.liquidity.value', { value: liquidityLabel }) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ambient root: fixed behind the foreground, never intercepts interaction.
   z-index kept LOW so the Home content layers (z-index:1) sit above it. */
.settlement-stream {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  font-family: var(--font-body);
  color: var(--text-primary);
}

/* #258: declare the rails/scanlines/glitch as the explicit background layer
   so the readout surface paints above it deterministically (z-index:1 below),
   not by DOM-order accident. */
.ss-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* ===== #235 seizure-safe glitch pulse =====
   A single <=2Hz (3.2s = 0.31Hz) chromatic-aberration pulse. The RGB-split
   is delivered via STATIC-tint ::before/::after pseudo-elements (neon-blue /
   neon-pink) so the keyframes NEVER touch color/background/filter (transform +
   opacity only — AC4 perf contract, compositor-only). During the ~35% pulse
   window the two channels translate in opposite directions (+3px / -3px) and
   opacity lifts; outside the window they rest at low opacity. Pure CSS, zero
   script/composable changes (preserves the #206 rAF-throttle perf contract). */
.ss-glitch-pulse {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.18;
  animation: ss-glitch-pulse 3.2s ease-in-out infinite;
}
.ss-glitch-pulse::before,
.ss-glitch-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ss-glitch-pulse::before {
  /* STATIC neon-blue tint (the keyframes only translate/opacity this layer). */
  background: var(--neon-blue);
  mix-blend-mode: screen;
  opacity: 0.04;
}
.ss-glitch-pulse::after {
  /* STATIC neon-pink tint. */
  background: var(--neon-pink);
  mix-blend-mode: screen;
  opacity: 0.04;
}
@keyframes ss-glitch-pulse {
  /* Rest: both channels centered, low opacity. */
  0% {
    transform: translateX(0);
    opacity: 0.12;
  }
  /* Pulse window: opacity lifts + the element (and its static-tint pseudo
     children) shift slightly. transform/opacity ONLY — no paint properties. */
  15% {
    transform: translateX(-3px);
    opacity: 0.26;
  }
  30% {
    transform: translateX(3px);
    opacity: 0.26;
  }
  /* Hold/rest for the rest of the cycle so the rate stays <=2Hz. */
  100% {
    transform: translateX(0);
    opacity: 0.12;
  }
}

/* ===== Rails =====
   Three China <-> ASEAN arcs stacked vertically. Each is a flex row:
   from-node | line | to-node, with packets absolutely positioned and
   translated by the composable's progress (transform-only, AC 3.1). */
.ss-rails {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 0 2rem;
  opacity: 0.55;
}

.ss-rail {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ss-node {
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  color: var(--neon-blue);
  text-shadow: 0 0 8px var(--neon-blue);
  white-space: nowrap;
}

.ss-rail-line {
  position: relative;
  flex: 1;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--neon-blue) 0%,
    var(--neon-green) 50%,
    var(--neon-pink) 100%
  );
  box-shadow: 0 0 6px var(--neon-green);
  border-radius: var(--radius-sm);
  overflow: visible;
}

/* Packets travel left -> right along the rail line (transform-only). */
.ss-packet {
  position: absolute;
  top: 50%;
  left: 0;
  width: 10px;
  height: 10px;
  margin-top: -5px;
  border-radius: 50%;
  background: var(--neon-green);
  box-shadow:
    0 0 8px var(--neon-green),
    0 0 14px var(--neon-green);
  /* AC2 neon rails: the packet travel animation is declared + applied. The
     composable ALSO drives translateX inline (the live progress); the
     keyframe layers a subtle pulse glow on top so a packet is always alive. */
  animation: ss-packet-travel 1.4s ease-in-out infinite alternate;
}

@keyframes ss-packet-travel {
  0% {
    opacity: 0.5;
    box-shadow: 0 0 6px var(--neon-green);
  }
  100% {
    opacity: 1;
    box-shadow: 0 0 12px var(--neon-green), 0 0 18px var(--neon-pink);
  }
}

/* ===== Readout surface =====
   Three columns anchored to the corners so the ambient rails stay visible
   behind them. Real text — selectable, semantic, NOT aria-hidden. */
.ss-readouts {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: start;
  padding: 1.5rem;
  pointer-events: none;
  gap: 1rem;
  /* #258: paint above the rails (z-index:0 on .ss-bg) and CLIP any single
     column that overflows its grid track so it cannot bleed past the section
     box onto the footer. The section's isolation:isolate + overflow:hidden
     (Home.vue) is the backstop; this clips at the readout surface itself. */
  z-index: 1;
  overflow: hidden;
}

.ss-blocks {
  justify-self: start;
}
.ss-fx {
  justify-self: center;
}
.ss-liquidity {
  justify-self: end;
}

.ss-readout-title {
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
  opacity: 0.85;
}

/* Block settlement column */
.ss-block-current {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 0.4rem;
}
.ss-block-height {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--neon-green);
  text-shadow: 0 0 6px var(--neon-green);
}
.ss-block-hash {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}
.ss-block-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.ss-block-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  /* AC1.2 block settlement drop-in (declared + applied). */
  animation: ss-block-drop 0.5s ease-out;
}
.ss-block-row-height {
  color: var(--neon-blue);
}
.ss-block-row-tx {
  color: var(--text-secondary);
}
@keyframes ss-block-drop {
  0% {
    opacity: 0;
    transform: translateY(-6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.ss-settled {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--neon-green);
  font-family: var(--font-display);
  letter-spacing: 0.08em;
}

/* FX ticker column */
.ss-fx-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  /* AC1.2 FX ticker drift (declared + applied). */
  animation: ss-fx-drift 3s ease-in-out infinite alternate;
}
.ss-fx-row--up .ss-fx-rate {
  color: var(--neon-green);
}
.ss-fx-row--down .ss-fx-rate {
  color: var(--neon-pink);
}
.ss-fx-pair {
  color: var(--text-secondary);
}
@keyframes ss-fx-drift {
  0% {
    opacity: 0.6;
    transform: translateX(-2px);
  }
  100% {
    opacity: 1;
    transform: translateX(2px);
  }
}

/* Liquidity pulse column */
.ss-liquidity-meter {
  position: relative;
  width: 8px;
  height: 60px;
  margin-left: auto;
  margin-bottom: 0.4rem;
  background: rgba(0, 255, 204, 0.08);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.ss-liquidity-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, var(--neon-green), var(--neon-blue));
  box-shadow: 0 0 8px var(--neon-green);
  /* AC1.3 liquidity pulse (declared + applied). The composable ALSO sets
     height inline from the live curve; this keyframe layers a soft pulse. */
  animation: ss-liquidity-pulse 2.6s ease-in-out infinite alternate;
}
@keyframes ss-liquidity-pulse {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
.ss-liquidity-readout {
  font-size: 0.75rem;
  color: var(--neon-green);
  font-family: var(--font-mono);
  text-align: right;
}

/* ===== Reduced-motion: animation:none across the board (AC 4.1).
   The composable NEVER starts rAF under reduced motion, so the inline
   translateX/height stay static; the CSS keyframes are also killed here so
   nothing flashes. */
@media (prefers-reduced-motion: reduce) {
  .ss-packet,
  .ss-block-row,
  .ss-fx-row,
  .ss-liquidity-fill {
    animation: none;
  }
  .ss-rails {
    opacity: 0.35;
  }
  /* #235 seizure-safe glitch-pulse: CSS-authoritative defense-in-depth.
     The composable's prefersReducedMotion flag already keeps rAF from
     scheduling, but the glitch-pulse is a PURE-CSS animation (no JS), so it
     must be neutralized at the CSS level too. opacity:0 hides the static-tint
     pseudo-element layers entirely so no residual aberration shows. Mirrors
     the #234 ac02054 precedent (decode-anim / terminal-cursor guard):
     photosafety must not depend on JS alone. */
  .ss-glitch-pulse,
  .ss-glitch-pulse::before,
  .ss-glitch-pulse::after {
    animation: none;
    opacity: 0;
  }
}

/* ===== Mobile-degrade (AC 3.1): collapse to a single stacked column,
   drop the rail decoration opacity, reduce readout footprint. The
   composable ALSO caps the packet count under 768px. ===== */
@media (max-width: 768px) {
  .ss-readouts {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem;
  }
  .ss-blocks,
  .ss-fx,
  .ss-liquidity {
    justify-self: start;
  }
  .ss-rails {
    opacity: 0.3;
    gap: 1.5rem;
    padding: 0 1rem;
  }
  .ss-node {
    font-size: 0.7rem;
  }
}
</style>
