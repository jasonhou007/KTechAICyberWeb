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

      <!-- AI Neural Terminal command console (#161) — lazy-mounted (#224) -->
      <LazySection class="neural-terminal-section" data-test="lazy-neural-terminal">
        <NeuralTerminal />
      </LazySection>

      <!-- AI Core neural-network visualizer (#179) — lazy-mounted (#224) -->
      <LazySection class="neural-core-section" data-test="lazy-neural-core">
        <NeuralCore />
      </LazySection>

      <!-- AI Solution Forge configurator (#180) — lazy-mounted (#224) -->
      <LazySection class="solution-forge-section" data-test="lazy-solution-forge">
        <SolutionForge />
      </LazySection>

      <!-- Cyber Ops HUD interactive mission-control dashboard (#182) — lazy (#224) -->
      <LazySection class="cyber-ops-hud-section" data-test="lazy-cyber-ops-hud">
        <CyberOpsHud data-test="cyber-ops-hud" />
      </LazySection>

      <!-- Neon Pulse audio-reactive visualizer (#186) — lazy-mounted (#224) -->
      <LazySection class="neon-pulse-section" data-test="lazy-neon-pulse">
        <NeonPulse data-test="neon-pulse" />
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

// #224 perf: lazy-mount the 5 heavy below-the-fold modules. Previously these
// were statically imported and mounted eagerly on initial paint, spinning up
// ~4 simultaneous rAF loops + ~43 CSS animations + 2 intervals despite being
// below the fold — the runtime lag source ("太卡了"). defineAsyncComponent
// yields a code-split chunk AND defers module evaluation until first render;
// wrapping each in <LazySection> further defers the mount until the section
// scrolls into view (IntersectionObserver, rootMargin 200px for early mount).
const NeuralTerminal = defineAsyncComponent(() => import('../components/NeuralTerminal.vue'))
const NeuralCore = defineAsyncComponent(() => import('../components/NeuralCore.vue'))
const SolutionForge = defineAsyncComponent(() => import('../components/SolutionForge.vue'))
const CyberOpsHud = defineAsyncComponent(() => import('../components/CyberOpsHud.vue'))
const NeonPulse = defineAsyncComponent(() => import('../components/NeonPulse.vue'))
// #206: ambient Settlement Stream — lazy chunk, same pattern as the 5 modules.
const SettlementStream = defineAsyncComponent(() => import('../components/SettlementStream.vue'))

const { t } = useLanguage()

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
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #00ffcc;
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
  padding: 4rem 1rem 3rem;
  margin-bottom: 2rem;
}

.cyber-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(0, 255, 204, 0.1) 0%, transparent 70%);
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
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin: 0;
  color: #ffffff;
  text-shadow:
    0 0 10px #00ffcc,
    0 0 20px #00ffcc,
    0 0 30px #00ffcc,
    0 0 40px #00ffcc;
  animation: neonPulse 2s ease-in-out infinite alternate;
}

.subtitle {
  position: relative;
  z-index: 1;
  font-family: var(--font-body);
  font-size: 1.5rem;
  color: #00ffcc;
  margin-top: 1rem;
  text-shadow: 0 0 10px rgba(0, 255, 204, 0.6);
}

/* #224: glitch-text + @keyframes glitch REMOVED (the neon flicker / strobe).
   The calm neonPulse text-glow (2s alternate = 0.5Hz, well under the 3Hz
   seizure threshold) stays. The cyber palette is unchanged. */

/* Neon pulse animation */
@keyframes neonPulse {
  from {
    text-shadow:
      0 0 10px #00ffcc,
      0 0 20px #00ffcc,
      0 0 30px #00ffcc;
  }
  to {
    text-shadow:
      0 0 20px #00ffcc,
      0 0 30px #00ffcc,
      0 0 40px #00ffcc,
      0 0 50px #00ffcc,
      0 0 60px #00ffcc;
  }
}

/* Section rhythm (About's .section pattern) */
.section {
  position: relative;
  padding: 4rem 5%;
  z-index: 1;
}

.section-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: #00ffcc;
  letter-spacing: 0.15em;
  text-align: center;
  margin-bottom: 3rem;
  text-transform: uppercase;
}

/* Hero section */
.hero {
  position: relative;
  z-index: 1;
  padding: 2rem 5%;
}

/* Cyber Card (About's design language) */
.cyber-card {
  background: rgba(10, 15, 28, 0.8);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.cyber-card:hover {
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
}

.hover-lift:hover {
  transform: translateY(-10px);
}

/* Hero card sizing */
.hero .cyber-card {
  padding: 3rem;
  margin-bottom: 1rem;
  text-align: left;
}

.hero .cyber-card p {
  font-family: var(--font-body);
  font-size: 1.2rem;
  color: #b8b8b8;
  line-height: 1.8;
  margin: 0 0 1rem 0;
}

.hero .cyber-card p:last-child {
  margin-bottom: 0;
}

/* What We Do */
.whatwedo {
  text-align: left;
}

.solution-group {
  margin-bottom: 2rem;
}

.group-label {
  font-family: var(--font-display);
  color: #00ffcc;
  text-shadow: 0 0 10px rgba(0, 255, 204, 0.6);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.solution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.solution-card {
  padding: 2rem;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
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

.solution-card h4 {
  font-family: var(--font-display);
  color: #00ffcc;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.solution-card p {
  font-family: var(--font-body);
  color: #b8b8b8;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.6;
}

/* CTA */
.cta {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem 5%;
}

.cyber-button {
  display: inline-block;
  background: rgba(0, 255, 204, 0.1);
  color: #00ffcc;
  border: 2px solid #00ffcc;
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
  background: rgba(0, 255, 204, 0.2);
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.5);
  transform: scale(1.05);
}

/* Neon border effect */
.neon-border {
  box-shadow:
    0 0 5px #00ffcc,
    0 0 10px #00ffcc,
    inset 0 0 5px rgba(0, 255, 204, 0.2);
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
}

/* AI Core neural-network visualizer section (#179) — mirrors the
   .neural-terminal-section rhythm so the two interactive AI modules read
   as a coordinated pair on the homepage. */
.neural-core-section {
  position: relative;
  z-index: 1;
  margin-top: 3rem;
}

/* AI Solution Forge configurator section (#180) — same rhythm as the AI Core
   section so the three interactive modules stack consistently. */
.solution-forge-section {
  position: relative;
  z-index: 1;
  margin-top: 3rem;
}

/* Cyber Ops HUD section (#182) — same rhythm as the AI modules above so the
   interactive HUD stacks consistently on the homepage. */
.cyber-ops-hud-section {
  position: relative;
  z-index: 1;
  margin-top: 3rem;
}

/* Neon Pulse section (#186) — same rhythm as the interactive modules above so
   the audio-reactive visualizer stacks consistently on the homepage. */
.neon-pulse-section {
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
}

/* Responsive */
@media (max-width: 768px) {
  h1 { font-size: 2.5rem; }
  .solution-grid { grid-template-columns: 1fr; }
  .section { padding: 3rem 5%; }
}
</style>
