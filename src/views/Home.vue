<template>
  <div class="home">
    <!-- Animated background grid -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Main content -->
    <div class="content">
      <!-- Header with neon glow -->
      <header class="cyber-header">
        <h1 class="neon-text glitch-text" :data-text="t('home.title')">
          {{ t('home.title') }}
        </h1>
        <p class="subtitle">{{ t('home.subtitle') }}</p>
      </header>

      <!-- Hero section -->
      <section class="hero">
        <div class="cyber-card">
          <p class="hero-description">{{ t('home.hero.description') }}</p>
          <p class="hero-description2">{{ t('home.hero.description2') }}</p>
        </div>
      </section>

      <!-- What We Do -->
      <section class="whatwedo">
        <h2 class="section-heading">{{ t('home.whatwedo.heading') }}</h2>

        <div class="solution-group">
          <h3 class="group-label">{{ t('home.whatwedo.group.blockchain.label') }}</h3>
          <div class="solution-grid">
            <div class="solution-card" v-for="item in blockchainCards" :key="item.key">
              <h4>{{ t(`home.whatwedo.group.blockchain.${item.key}.title`) }}</h4>
              <p>{{ t(`home.whatwedo.group.blockchain.${item.key}.description`) }}</p>
            </div>
          </div>
        </div>

        <div class="solution-group">
          <h3 class="group-label">{{ t('home.whatwedo.group.banking.label') }}</h3>
          <div class="solution-grid">
            <div class="solution-card" v-for="item in bankingCards" :key="item.key">
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
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLanguage } from '../composables/useLanguage'

const { t } = useLanguage()

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
  color: #00ff88;
  font-family: 'Courier New', monospace;
  position: relative;
  overflow: hidden;
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
  text-align: left;
}

.cyber-card p {
  font-size: 1.2rem;
  color: #00ffff;
  line-height: 1.8;
  margin: 0 0 1rem 0;
}

.cyber-card p:last-child {
  margin-bottom: 0;
}

/* What We Do */
.whatwedo {
  margin-bottom: 3rem;
  text-align: left;
}

.section-heading {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #00ff88;
  text-shadow: 0 0 10px #00ff88;
  text-align: center;
}

.solution-group {
  margin-bottom: 2rem;
}

.group-label {
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.solution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.solution-card {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid #00ff88;
  border-radius: 10px;
  padding: 2rem;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

.solution-card:hover {
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

.solution-card h4 {
  color: #00ff88;
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.solution-card p {
  color: #00ffff;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

/* Button */
.cyber-button {
  display: inline-block;
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
  text-decoration: none;
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
  .solution-grid { grid-template-columns: 1fr; }
}
</style>
