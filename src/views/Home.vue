<template>
  <div class="home">
    <!-- Animated background grid -->
    <div class="grid-bg" aria-hidden="true"></div>
    <div class="grid-bg grid-bg-2" aria-hidden="true"></div>

    <!-- Main content -->
    <main class="content">
      <!-- Header with neon glow -->
      <header class="cyber-header">
        <h1 class="neon-text glitch-text" :data-text="t('home.title')">
          {{ t('home.title') }}
        </h1>
        <p class="subtitle">{{ t('home.subtitle') }}</p>
      </header>

      <!-- Hero section -->
      <section class="hero" aria-labelledby="hero-heading">
        <div class="cyber-card">
          <h2 id="hero-heading">{{ t('home.hero.heading') }}</h2>
          <p>{{ t('home.hero.description') }}</p>
          <dl class="stats">
            <div class="stat">
              <dt class="sr-only">{{ t('home.stats.uptime.label') }}</dt>
              <dd>
                <span class="stat-value neon-text">{{ t('home.stats.uptime.value') }}</span>
                <span class="stat-label">{{ t('home.stats.uptime.label') }}</span>
              </dd>
            </div>
            <div class="stat">
              <dt class="sr-only">{{ t('home.stats.requests.label') }}</dt>
              <dd>
                <span class="stat-value neon-text">{{ t('home.stats.requests.value') }}</span>
                <span class="stat-label">{{ t('home.stats.requests.label') }}</span>
              </dd>
            </div>
            <div class="stat">
              <dt class="sr-only">{{ t('home.stats.latency.label') }}</dt>
              <dd>
                <span class="stat-value neon-text">{{ t('home.stats.latency.value') }}</span>
                <span class="stat-label">{{ t('home.stats.latency.label') }}</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <!-- Features grid -->
      <section class="features" aria-labelledby="features-heading">
        <h2 id="features-heading" class="sr-only">{{ t('home.features.heading') }}</h2>
        <article class="feature-card">
          <div class="feature-icon neon-border" role="img" aria-label="AI Robot Icon">🤖</div>
          <h3>{{ t('home.features.ai.title') }}</h3>
          <p>{{ t('home.features.ai.description') }}</p>
        </article>
        <article class="feature-card">
          <div class="feature-icon neon-border" role="img" aria-label="Lightning Bolt Icon">⚡</div>
          <h3>{{ t('home.features.realtime.title') }}</h3>
          <p>{{ t('home.features.realtime.description') }}</p>
        </article>
        <article class="feature-card">
          <div class="feature-icon neon-border" role="img" aria-label="Lock Icon">🔒</div>
          <h3>{{ t('home.features.secure.title') }}</h3>
          <p>{{ t('home.features.secure.description') }}</p>
        </article>
      </section>

      <!-- CTA Button -->
      <nav class="cta" aria-label="Call to action">
        <button class="cyber-button neon-border" :aria-label="t('home.cta.ariaLabel')">
          <span>{{ t('home.cta.button') }}</span>
        </button>
      </nav>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLanguage, initLanguage } from '../i18n'

// Initialize language on component mount
onMounted(() => {
  initLanguage()
})

const { t, loadCurrentTranslations } = useLanguage()

// Load translations
onMounted(async () => {
  await loadCurrentTranslations()

  // Add entrance animations
  document.querySelectorAll('.feature-card').forEach((card, index) => {
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
  color: #00ff88;
  font-family: 'Courier New', monospace;
  position: relative;
  overflow: hidden;
}

/* Screen reader only content */
.sr-only {
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

/* Animated grid background */
.grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: gridMove 30s linear infinite reverse;
}

@keyframes gridMove {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
}

.content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  padding: 2rem;
  text-align: center;
}

/* Header styles */
.cyber-header {
  margin-bottom: 4rem;
}

h1 {
  font-size: 5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5rem;
  margin: 0;
  text-shadow:
    0 0 10px #00ff88,
    0 0 20px #00ff88,
    0 0 30px #00ff88,
    0 0 40px #00ff88;
  animation: neonPulse 2s ease-in-out infinite alternate;
}

.subtitle {
  font-size: 1.5rem;
  color: #00ffff;
  margin-top: 1rem;
  text-shadow: 0 0 10px #00ffff;
}

/* Glitch effect */
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

.glitch-text::before {
  color: #ff00ff;
  animation: glitch 0.3s infinite;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}

.glitch-text::after {
  color: #00ffff;
  animation: glitch 0.3s infinite reverse;
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
}

@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

/* Neon pulse animation */
@keyframes neonPulse {
  from {
    text-shadow:
      0 0 10px #00ff88,
      0 0 20px #00ff88,
      0 0 30px #00ff88;
  }
  to {
    text-shadow:
      0 0 20px #00ff88,
      0 0 30px #00ff88,
      0 0 40px #00ff88,
      0 0 50px #00ff88,
      0 0 60px #00ff88;
  }
}

/* Card styles */
.cyber-card {
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid #00ff88;
  border-radius: 10px;
  padding: 3rem;
  box-shadow:
    0 0 20px rgba(0, 255, 136, 0.3),
    inset 0 0 20px rgba(0, 255, 136, 0.1);
  margin-bottom: 3rem;
}

.cyber-card h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #00ff88;
  text-shadow: 0 0 10px #00ff88;
}

.cyber-card p {
  font-size: 1.2rem;
  color: #00ffff;
  line-height: 1.8;
}

/* Stats */
.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 2rem;
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: #00ffff;
}

/* Features */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid #00ff88;
  border-radius: 10px;
  padding: 2rem;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
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

.feature-icon {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  line-height: 80px;
  margin: 0 auto 1rem;
  border-radius: 50%;
}

.feature-card h3 {
  color: #00ff88;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #00ffff;
  font-size: 0.9rem;
}

/* Button */
.cyber-button {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border: 2px solid #00ff88;
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-family: inherit;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cyber-button:hover {
  background: rgba(0, 255, 136, 0.2);
  box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
  transform: scale(1.05);
}

/* Neon border effect */
.neon-border {
  box-shadow:
    0 0 5px #00ff88,
    0 0 10px #00ff88,
    inset 0 0 5px rgba(0, 255, 136, 0.2);
}

.neon-text {
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor;
}

/* Responsive */
@media (max-width: 768px) {
  h1 { font-size: 3rem; }
  .stats { flex-direction: column; }
  .features { grid-template-columns: 1fr; }
}
</style>
