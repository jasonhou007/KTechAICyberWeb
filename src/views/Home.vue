<template>
  <div class="home" ref="rootRef" :data-parallax="enabled ? 'on' : null">
    <!-- Animated background grid -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Main content -->
    <div class="content">
      <!-- Header with neon glow (#224: glitch-text + :data-text removed —
           the neon flicker animation is gone, the calm neonPulse glow stays) -->
      <header class="cyber-header">
        <h1 class="neon-text">
          {{ t('home.title') }}
        </h1>
        <p class="subtitle">{{ t('home.subtitle') }}</p>
      </header>

      <!-- Self-Driving dev pipeline flagship demo (#203). Auto-plays the full
           INTAKE -> ... -> RESOLVED loop with zero interaction. Mounted IN-FLOW
           as the FIRST content block after the page title (not as a global fixed
           background) so the pipeline rail, streaming code feed, and status
           readout are visible page content — the product demos itself (AC1). -->
      <section class="self-driving-section">
        <SelfDrivingDemo />
      </section>

      <!-- Hero section -->
      <section class="hero">
        <div class="cyber-card hover-lift">
          <p class="hero-description">{{ t('home.hero.description') }}</p>
          <p class="hero-description2">{{ t('home.hero.description2') }}</p>
        </div>
      </section>

      <!-- What We Do -->
      <section class="whatwedo section">
        <h2 class="section-title neon-text">{{ t('home.whatwedo.heading') }}</h2>

        <div class="solution-group">
          <h3 class="group-label">{{ t('home.whatwedo.group.blockchain.label') }}</h3>
          <div class="solution-grid">
            <div class="solution-card cyber-card hover-lift" v-for="item in blockchainCards" :key="item.key">
              <h4>{{ t(`home.whatwedo.group.blockchain.${item.key}.title`) }}</h4>
              <p>{{ t(`home.whatwedo.group.blockchain.${item.key}.description`) }}</p>
            </div>
          </div>
        </div>

        <div class="solution-group">
          <h3 class="group-label">{{ t('home.whatwedo.group.banking.label') }}</h3>
          <div class="solution-grid">
            <div class="solution-card cyber-card hover-lift" v-for="item in bankingCards" :key="item.key">
              <h4>{{ t(`home.whatwedo.group.banking.${item.key}.title`) }}</h4>
              <p>{{ t(`home.whatwedo.group.banking.${item.key}.description`) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <div class="cta">
        <router-link to="/about" class="cyber-button neon-border">
          <span>{{ t('home.cta') }}</span>
        </router-link>
      </div>

      <!-- AI Neural Terminal command console (#161) — lazy-mounted (#224).
           #232: :key + @retry back the user-facing Reload path — a click on the
           AsyncLoadError affordance bumps retryKeys.neuralTerminal, remounting
           the async boundary so the chunk loader re-runs (attempts reset). -->
      <LazySection class="neural-terminal-section" data-test="lazy-neural-terminal">
        <NeuralTerminal
          :key="`neural-terminal-${retryKeys.neuralTerminal}`"
          @retry="bumpRetry('neuralTerminal')"
        />
      </LazySection>

      <!-- AI Core neural-network visualizer (#179) — lazy-mounted (#224, #232) -->
      <LazySection class="neural-core-section" data-test="lazy-neural-core">
        <NeuralCore
          :key="`neural-core-${retryKeys.neuralCore}`"
          @retry="bumpRetry('neuralCore')"
        />
      </LazySection>

      <!-- AI Solution Forge configurator (#180) — lazy-mounted (#224, #232) -->
      <LazySection class="solution-forge-section" data-test="lazy-solution-forge">
        <SolutionForge
          :key="`solution-forge-${retryKeys.solutionForge}`"
          @retry="bumpRetry('solutionForge')"
        />
      </LazySection>

      <!-- Cyber Ops HUD interactive mission-control dashboard (#182) — lazy (#224, #232) -->
      <LazySection class="cyber-ops-hud-section" data-test="lazy-cyber-ops-hud">
        <CyberOpsHud
          :key="`cyber-ops-hud-${retryKeys.cyberOpsHud}`"
          data-test="cyber-ops-hud"
          @retry="bumpRetry('cyberOpsHud')"
        />
      </LazySection>

      <!-- Ambient "Settlement Stream" — always-on cross-border payment &
           blockchain settlement cinematic BACKGROUND (#206). Lazy-mounted via
           the same LazySection + defineAsyncComponent pattern as the 5 heavy
           modules above (so its rAF/interval never spin before the user
           scrolls near it). It sits as the last child but is positioned
           absolutely behind the foreground (z-index:0, pointer-events:none)
           so the rails/readouts read as a backdrop, not a section. -->
      <LazySection class="settlement-stream-section" data-test="lazy-settlement-stream">
        <SettlementStream data-test="settlement-stream" />
      </LazySection>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, defineAsyncComponent } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useParallax } from '../composables/useParallax'
import LazySection from '../components/LazySection.vue'
// #232: shared chunk-load error affordance (localized, a11y role=alert, Retry
// button). Statically imported — it must be tiny so it stays in the entry chunk
// and is available the moment a lazy section fails to load.
import AsyncLoadError from '../components/AsyncLoadError.vue'

// #232: retry a failed chunk fetch up to 2 times (deploy skew / CDN drop /
// ad-blocker on a hashed asset). After 2 failures, give up -> errorComponent.
const retryChunkLoad = (err, retry, fail, attempts) => {
  if (attempts <= 2) retry()
  else fail()
}

// #224 perf: lazy-mount the 5 heavy below-the-fold modules. Previously these
// were statically imported and mounted eagerly on initial paint, spinning up
// ~4 simultaneous rAF loops + ~43 CSS animations + 2 intervals despite being
// below the fold — the runtime lag source ("太卡了"). defineAsyncComponent
// yields a code-split chunk AND defers module evaluation until first render;
// wrapping each in <LazySection> further defers the mount until the section
// scrolls into view (IntersectionObserver, rootMargin 200px for early mount).
// #232: each loader now carries an errorComponent + onError retry (<=2) +
// timeout: 8000 so a chunk-fetch failure surfaces a localized, a11y-announced
// Reload affordance instead of a silent blank section.
const NeuralTerminal = defineAsyncComponent({
  loader: () => import('../components/NeuralTerminal.vue'),
  errorComponent: AsyncLoadError,
  timeout: 8000,
  onError: retryChunkLoad,
})
const NeuralCore = defineAsyncComponent({
  loader: () => import('../components/NeuralCore.vue'),
  errorComponent: AsyncLoadError,
  timeout: 8000,
  onError: retryChunkLoad,
})
const SolutionForge = defineAsyncComponent({
  loader: () => import('../components/SolutionForge.vue'),
  errorComponent: AsyncLoadError,
  timeout: 8000,
  onError: retryChunkLoad,
})
const CyberOpsHud = defineAsyncComponent({
  loader: () => import('../components/CyberOpsHud.vue'),
  errorComponent: AsyncLoadError,
  timeout: 8000,
  onError: retryChunkLoad,
})
// #206: ambient Settlement Stream — lazy chunk, same pattern as the 5 modules.
// #232: out of scope — left in simple form (no errorComponent hardening).
const SettlementStream = defineAsyncComponent(() => import('../components/SettlementStream.vue'))
// #203: Self-Driving dev pipeline flagship demo. Lazy-imported (code-split
// into its own chunk, consistent with the #224 pattern) but NOT wrapped in
// <LazySection> because it is the FIRST above-the-fold content block — its
// AC1 ("auto-plays on load, zero interaction") requires it to mount eagerly.
// The composable's own IntersectionObserver + visibilitychange + reduced-motion
// guards throttle its rAF loop when appropriate.
const SelfDrivingDemo = defineAsyncComponent(() => import('../components/SelfDrivingDemo.vue'))

const { t } = useLanguage()

// #232: per-section retry-key counters. Bumping one forces a remount of that
// section's async boundary (the :key on the async component changes), which
// re-runs the chunk loader with a fresh attempt counter. Invoked by the
// AsyncLoadError affordance's Reload button via the @retry fallthrough
// listener on each lazy component.
const retryKeys = ref({
  neuralTerminal: 0,
  neuralCore: 0,
  solutionForge: 0,
  cyberOpsHud: 0,
})
const bumpRetry = (key) => {
  retryKeys.value[key]++
}

// Root scope ref for the reduced-motion-safe mouse-move parallax (#177).
const rootRef = ref(null)
const { enabled } = useParallax({
  rootRef,
  layers: [
    { selector: '.grid-bg', intensity: 12 },
    { selector: '.grid-bg-2', intensity: 6 },
    { selector: '.cyber-header', intensity: 20 },
  ],
})

// Static card catalogs. Keys map to home.whatwedo.group.{group}.{key}.{title|description}.
const blockchainCards = [
  { key: 'publicchain' },
  { key: 'crossborder' },
  { key: 'custody' },
  { key: 'stablecoin' },
]

const bankingCards = [
  { key: 'retaillending' },
  { key: 'supplychain' },
]

onMounted(() => {
  // Staggered entrance animation for the solution cards.
  document.querySelectorAll('.solution-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`
  })
})
</script>

<style scoped>
/* #313 (follow-up to #265) — Home above-the-fold rhythm tightening.
 *
 * Scope decision (2026-07-02): the literal #265 AC1 ("entire Home visible
 * without scrolling @1920x1080") is geometrically IMPOSSIBLE without breaking
 * #203 AC1 (SelfDrivingDemo mounted IN-FLOW as the FIRST content block, also
 * on About.vue). The full eager stack overflows 1080p by 402px and 1440p by
 * 128px (live-DOM measured 2026-07-02):
 *   @1920x1080: header=466 selfdriving=844 hero=1014 whatwedo=1390 cta=1482 (OVER by 402)
 *   @2560x1440: header=484 selfdriving=866 hero=1057 whatwedo=1469 cta=1568 (OVER by 128)
 *   @3840x2160: header=484 selfdriving=866 hero=1083 whatwedo=1557 cta=1667 (UNDER by 493)
 *
 * The lever is vertical RHYTHM (section padding, group/label margins, grid
 * gaps) expressed as clamp() so the stack compresses on shorter viewports and
 * breathes on 4K. Tightening the vh middle arms + selected upper bounds flips
 * 2560x1440 from FAIL (128px over) to PASS while 3840x2160 stays UNDER. At
 * 1920x1080 the header + Self-driving + hero already fit (hero.bottom=1014 <=
 * 1080) and stay fitting; the full .whatwedo+.cta is reachable within one
 * screen-height of scroll (revised honest AC wording).
 *
 * UNTOUCHED (HARD CONSTRAINTS):
 *   - SelfDrivingDemo.vue min-height clamp(280px, 38vh, 360px) — #203 flagship.
 *   - .solution-card padding floor 0.45rem — iter-13 readability floor.
 *   - .solution-card h4/p font-size clamps + .hero .cyber-card p font-size.
 *   - variables.css — NO new --home-* tokens (rhythm stays scoped, not
 *     over-tokenized; avoids cross-page blast on About.vue).
 *   - .whatwedo stays EAGERLY rendered (NOT <LazySection>) — Option 2 rejected.
 */

.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-mid) 50%, var(--bg-gradient-end) 100%);
  color: var(--cyan);
  font-family: var(--font-body);
  position: relative;
  overflow: hidden;
}

/* Two-layer animated grid background (About's pattern: static base + animated overlay) */
.grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.01) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.01) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  padding: 2rem;
  text-align: center;
}

/* Header — radial-pulse carrier (About's hero ::before pattern) */
.cyber-header {
  position: relative;
  overflow: hidden;
  padding: clamp(1.5rem, 2vh, 2rem) 1rem;
  margin-bottom: clamp(0.5rem, 1vh, 1rem);
}

.cyber-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, var(--accent-cyan-alpha-10) 0%, transparent 70%);
  animation: pulse 10s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

/* Parallax (#177): additive perf hints. No existing rule is restyled — only
   will-change and, for the hero layer only, a short eased transition. The grid
   layers deliberately get NO transform transition because gridMove already
   animates .grid-bg-2's transform and a transition would fight the keyframe. */
.grid-bg,
.grid-bg-2 {
  will-change: transform;
}

.cyber-header {
  will-change: transform;
  transition: transform 0.15s ease-out;
}

h1 {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  font-size: var(--home-h1);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin: 0;
  color: var(--text-primary);
  text-shadow:
    0 0 10px var(--cyan),
    0 0 20px var(--cyan),
    0 0 30px var(--cyan),
    0 0 40px var(--cyan);
  animation: neonPulse 2s ease-in-out infinite alternate;
}

.subtitle {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: var(--home-subtitle);
  color: var(--cyan);
  margin-top: clamp(0.25rem, 0.8vh, 0.75rem);
  text-shadow: 0 0 10px var(--accent-cyan-alpha-60);
}

/* #224: glitch-text + @keyframes glitch REMOVED (the neon flicker / strobe).
   The calm neonPulse text-glow (2s alternate = 0.5Hz, well under the 3Hz
   seizure threshold) stays. The cyber palette is unchanged. */

/* Neon pulse animation */
@keyframes neonPulse {
  from {
    text-shadow:
      0 0 10px var(--cyan),
      0 0 20px var(--cyan),
      0 0 30px var(--cyan);
  }
  to {
    text-shadow:
      0 0 20px var(--cyan),
      0 0 30px var(--cyan),
      0 0 40px var(--cyan),
      0 0 50px var(--cyan),
      0 0 60px var(--cyan);
  }
}

/* Section rhythm (About's .section pattern) */
.section {
  position: relative;
  padding: clamp(1.5rem, 3vh, 2.5rem) 5%;
  z-index: 1;
}

.section-title {
  font-family: var(--font-display);
  font-size: var(--home-section-title);
  font-weight: 700;
  color: var(--cyan);
  letter-spacing: 0.15em;
  text-align: center;
  margin-bottom: clamp(1rem, 1.5vh, 1.5rem);
  text-transform: uppercase;
  /* #376: Enhanced neon glow effect (AC1, AC3) */
  text-shadow:
    0 0 10px var(--cyan),
    0 0 20px var(--cyan),
    0 0 30px var(--cyan),
    0 0 40px var(--accent-cyan-alpha-60);
  animation: neonPulseEnhanced 2s ease-in-out infinite alternate;
}

/* Hero section */
.hero {
  position: relative;
  z-index: 1;
  padding: clamp(0.75rem, 1vh, 1rem) 5%;
}

/* Cyber Card (About's design language) */
.cyber-card {
  background: var(--surface-card);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.cyber-card:hover {
  border-color: var(--accent-cyan-alpha-50);
  box-shadow: 0 0 30px var(--accent-cyan-alpha-20);
}

.hover-lift:hover {
  transform: translateY(-10px);
}

/* Hero card sizing */
.hero .cyber-card {
  padding: clamp(0.6rem, 1vh, 1.5rem);
  margin-bottom: clamp(0.2rem, 0.3vh, 0.6rem);
  text-align: left;
}

.hero .cyber-card p {
  font-family: var(--font-body);
  font-size: clamp(0.95rem, 1.1vw, 1.05rem);
  color: var(--text-card-meta);
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.hero .cyber-card p:last-child {
  margin-bottom: 0;
}

/* What We Do */
/* #265 review(AC#1): .whatwedo is eagerly rendered (NOT LazySection), so it IS
 * part of the above-the-fold flagship stack. Tightened via clamp() so the whole
 * stack (header -> Self-driving -> hero -> .whatwedo 6 cards -> .cta) fits at
 * 1920x1080. The cards themselves are short (3-col grid = 2 rows of ~86px), so
 * the lever is vertical RHYTHM: section padding, group margins, label margins,
 * grid gaps. clamp() lower bounds are reached on short desktop viewports so the
 * stack compresses on 1080p and breathes on 4K. The card grid stays 3-col
 * (tightest 2-row packing of 6 cards). */
.whatwedo {
  position: relative;
  text-align: left;
  padding: clamp(0.3rem, 0.3vh, 0.75rem) 5%;
  /* #335: isolate layout shifts (font reflow, card stagger) so they cannot
   * propagate CLS to ancestor scoring. Named as the biggest Home shifter
   * (section.whatwedo 0.1116) in the saved Lighthouse layout-shifts audit. */
  contain: layout;
  /* #376: Position relative for pseudo-element background layers */
  overflow: hidden;
}

/* #376: Network/circuit background animation layers (AC1, AC4) */
.whatwedo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(0, 255, 204, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(255, 0, 255, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(0, 255, 204, 0.02) 0%, transparent 50%);
  background-size: 200% 200%;
  animation: networkPulse 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

/* #376: Animated circuit lines (AC4) */
.whatwedo::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background-image:
    linear-gradient(90deg, transparent 49.5%, rgba(0, 255, 204, 0.05) 49.5%, rgba(0, 255, 204, 0.05) 50.5%, transparent 50.5%),
    linear-gradient(0deg, transparent 49.5%, rgba(0, 255, 204, 0.05) 49.5%, rgba(0, 255, 204, 0.05) 50.5%, transparent 50.5%);
  background-size: 60px 60px;
  animation: circuitMove 12s linear infinite;
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}

.solution-group {
  margin-bottom: clamp(0.3rem, 0.4vh, 1rem);
}

.group-label {
  position: relative;
  font-family: var(--font-display);
  color: var(--cyan);
  text-shadow: 0 0 10px var(--accent-cyan-alpha-60);
  margin-bottom: clamp(0.25rem, 0.4vh, 0.6rem);
  font-size: var(--home-group-label);
  /* #376: Enhanced cyber styling (AC3) */
}

/* #376: Group label underline glow effect (AC3) */
.group-label::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  animation: lineGlow 2s ease-in-out infinite;
}

.solution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(0.3rem, 0.3vh, 0.6rem);
}

.solution-card {
  position: relative;
  padding: clamp(0.45rem, 0.5vh, 1rem);
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
  /* #376: Setup for 3D transforms (AC2) */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  z-index: 1;
}

/* #376: Enhanced 3D card hover effects (AC2) */
.solution-card.cyber-card:hover {
  transform: translateY(-12px) rotateX(5deg) scale(1.02);
  box-shadow:
    0 0 20px var(--accent-cyan-alpha-30),
    0 0 40px var(--accent-cyan-alpha-20),
    0 12px 24px rgba(0, 0, 0, 0.4);
  border-color: var(--accent-cyan-alpha-50);
}

/* #376: Animated gradient border on hover (AC2) */
.solution-card.cyber-card:hover::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, var(--cyan), transparent, var(--cyan));
  background-size: 400% 400%;
  animation: borderRotate 3s linear infinite;
  border-radius: var(--radius-lg);
  z-index: -1;
  opacity: 0.8;
}

/* #376: Holographic shimmer effect (AC2) */
.solution-card.cyber-card:hover::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* #376: Network pulse animation for background (AC4) */
@keyframes networkPulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* #376: Circuit move animation for background lines (AC4) */
@keyframes circuitMove {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(30px, 30px);
  }
  50% {
    transform: translate(0, 60px);
  }
  75% {
    transform: translate(-30px, 30px);
  }
  100% {
    transform: translate(0, 0);
  }
}

/* #376: Border rotate animation for card hover (AC2) */
@keyframes borderRotate {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* #376: Shimmer animation for holographic effect (AC2) */
@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* #376: Line glow animation for group labels (AC3) */
@keyframes lineGlow {
  0%, 100% {
    opacity: 0.4;
    width: 80%;
    left: 10%;
  }
  50% {
    opacity: 1;
    width: 100%;
    left: 0%;
  }
}

/* #376: Enhanced neon pulse for stronger glow (AC1, AC3) */
@keyframes neonPulseEnhanced {
  from {
    text-shadow:
      0 0 10px var(--cyan),
      0 0 20px var(--cyan),
      0 0 30px var(--cyan),
      0 0 40px var(--accent-cyan-alpha-60);
  }
  to {
    text-shadow:
      0 0 20px var(--cyan),
      0 0 30px var(--cyan),
      0 0 40px var(--cyan),
      0 0 50px var(--cyan),
      0 0 60px var(--accent-cyan-alpha-60);
  }
}

.solution-card h4 {
  font-family: var(--font-display);
  color: var(--cyan);
  margin: 0 0 0.25rem 0;
  font-size: var(--home-card-title);
  /* #376: Enhanced hover effect (AC3) */
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

/* #376: Card title hover enhancement (AC3) */
.solution-card.cyber-card:hover h4 {
  color: var(--cyan);
  text-shadow:
    0 0 10px var(--cyan),
    0 0 20px var(--accent-cyan-alpha-60),
    0 0 30px var(--accent-cyan-alpha-40);
}

.solution-card p {
  font-family: var(--font-body);
  color: var(--text-card-meta);
  font-size: var(--home-card-body);
  margin: 0;
  line-height: 1.4;
}

/* Self-Driving demo flagship section (#203). The demo component owns its own
   background + min-height; this wrapper just gives it vertical breathing room
   in the page flow and a relative positioning context above the grid-bg. */
.self-driving-section {
  position: relative;
  z-index: 1;
  width: 100%;
  margin: clamp(0.5rem, 1vh, 1rem) 0;
  border: 1px solid var(--accent-cyan-alpha-15);
  border-radius: var(--radius-sm);
  overflow: hidden;
  /* #335: SelfDrivingDemo is loaded via defineAsyncComponent, so before its
   * chunk arrives this wrapper occupies ~0px and every section below it
   * (.hero, .whatwedo, .cta) is positioned too high — then shifts down
   * ~280-360px when the chunk renders. Reserving the demo's own min-height
   * HERE (on the eagerly-rendered wrapper) means the below-the-demo layout
   * is correct from first paint, killing the .whatwedo 0.1116 CLS hit. The
   * value matches SelfDrivingDemo.vue's .self-driving-demo min-height. */
  min-height: clamp(280px, 38vh, 360px);
  /* scroll-margin-top: when an E2E/user scrollIntoView()'s the demo, leave
     head-room for the fixed Header so the StatusReadout at the top of the
     stage is NOT occluded by the nav (mobile Chrome E2E occlusion gate). */
  scroll-margin-top: 6rem;
}

/* CTA */
.cta {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: clamp(0.3rem, 0.3vh, 0.75rem) 5%;
}

.cyber-button {
  display: inline-block;
  background: var(--accent-cyan-alpha-10);
  color: var(--cyan);
  border: 2px solid var(--cyan);
  padding: 1rem 3rem;
  font-family: var(--font-display);
  font-size: 1.2rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  text-decoration: none;
}

.cyber-button:hover {
  background: var(--accent-cyan-alpha-20);
  box-shadow: 0 0 30px var(--accent-cyan-alpha-50);
  transform: scale(1.05);
}

/* Neon border effect */
.neon-border {
  box-shadow:
    0 0 5px var(--cyan),
    0 0 10px var(--cyan),
    inset 0 0 5px var(--accent-cyan-alpha-20);
}

.neon-text {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor;
}

/* Neural Terminal section */
.neural-terminal-section {
  position: relative;
  z-index: 1;
  margin-top: 3rem;
  /* NOTE: content-visibility:auto is intentionally NOT applied here. This is
     an INTERACTIVE module (the console launcher + activityDecay animation the
     user clicks/reads). content-visibility:auto skips render/layout/paint of
     offscreen subtrees and delays the first paint after scroll-into-view by a
     frame or two — on click-driven components that delay is exactly the
     "visible lag" this ticket eliminates, and on slower mobile engines it
     flipped neural-core.spec.ts's forceClick "effect not observed" gate red
     (the pulse the test watches for did not paint within the retry budget).
     content-visibility:auto is reserved for PASSIVE below-the-fold content
     (Home .settlement-stream-section, About .achievements/.vision-mission/
     .service-provider/.stats-section) where no click→paint latency contract
     exists. The paint skip this section still benefits from is delivered by
     the IntersectionObserver-backed useAnimationThrottle (pauses the
     activityDecay interval when offscreen), without delaying scroll-in paint. */
}

/* AI Core neural-network visualizer section (#179) — mirrors the
   .neural-terminal-section rhythm so the two interactive AI modules read
   as a coordinated pair on the homepage. Interactive → no
   content-visibility:auto (see .neural-terminal-section note above). */
.neural-core-section {
  position: relative;
  z-index: 1;
  margin-top: 3rem;
}

/* AI Solution Forge configurator section (#180) — same rhythm as the AI Core
   section so the three interactive modules stack consistently. Interactive →
   no content-visibility:auto (see .neural-terminal-section note above). */
.solution-forge-section {
  position: relative;
  z-index: 1;
  margin-top: 3rem;
}

/* Cyber Ops HUD section (#182) — same rhythm as the AI modules above so the
   interactive HUD stacks consistently on the homepage. Interactive → no
   content-visibility:auto (see .neural-terminal-section note above). */
.cyber-ops-hud-section {
  position: relative;
  z-index: 1;
  margin-top: 3rem;
}

/* Ambient Settlement Stream section (#206). The stream itself is positioned
   absolutely inside (z-index:0, pointer-events:none) so it reads as a
   background backdrop spanning the section; the LazySection wrapper just
   reserves the layout slot. min-height keeps the backdrop tall enough that the
   rails + readout columns are visible. */
.settlement-stream-section {
  position: relative;
  z-index: 0;
  min-height: 320px;
  margin-top: 3rem;
  /* #258: establish a fresh stacking context so the stream's absolute
     children (rails + readouts) paint ONLY within this section, never onto the
     footer or sibling sections. overflow:hidden crops any child that still
     exceeds the section box (the readouts clip at their own surface too). This
     is the load-bearing containment primitive — do NOT raise the section's own
     z-index (would race with .content's z-index:1 siblings). */
  isolation: isolate;
  overflow: hidden;
  /* #253 perf: skip rendering/layout/paint of this offscreen PASSIVE subtree
     until it scrolls near the viewport (the stream is a background backdrop,
     not interactive — safe for content-visibility:auto). contain-intrinsic-size
     reserves the box height BEFORE first render so the browser does not reflow
     (CLS guard — AC #3). */
  content-visibility: auto;
  contain-intrinsic-size: 320px;
}

/* #376: Reduced motion support for accessibility */
@media (prefers-reduced-motion: reduce) {
  .whatwedo::before,
  .whatwedo::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .solution-card.cyber-card:hover::before,
  .solution-card.cyber-card:hover::after {
    animation-duration: 0.01ms !important;
  }
  .group-label::after {
    animation-duration: 0.01ms !important;
  }
  .section-title {
    animation-duration: 0.01ms !important;
  }
}

/* Responsive */
@media (max-width: 768px) {
  h1 { font-size: var(--home-h1); }
  .solution-grid { grid-template-columns: 1fr; }
  .section { padding: 3rem 5%; }
  /* #258: on mobile the readouts collapse to a single stacked 1fr column. The
     realistic max content height (6 block rows = the composable's slice(0,6)
     cap + fx + liquidity, measured at 425px on Pixel 5) exceeds the desktop
     320px floor, so give the stacked layout vertical room. 480px = measured
     425px + ~55px headroom; the section's overflow:hidden is the backstop. */
  .settlement-stream-section { min-height: 480px; }
}
</style>
