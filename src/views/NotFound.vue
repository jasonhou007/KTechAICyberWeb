<template>
  <section class="not-found" role="main" aria-labelledby="not-found-title">
    <div class="grid-bg"></div>
    <div class="content">
      <p class="code neon-text glitch-text" :data-text="t('notFound.code')">
        {{ t('notFound.code') }}
      </p>
      <h1 id="not-found-title" class="title">{{ t('notFound.title') }}</h1>
      <p class="message">{{ t('notFound.message') }}</p>
      <router-link to="/" class="home-link cyber-button neon-border">
        {{ t('notFound.home') }}
      </router-link>
    </div>
  </section>
</template>

<script>
import { useLanguage } from '../i18n'

export default {
  name: 'NotFound',
  setup() {
    const { t } = useLanguage()
    return { t }
  }
}
</script>

<style scoped>
.not-found {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 4rem 2rem;
}

.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.code {
  font-family: 'Orbitron', monospace;
  font-size: clamp(5rem, 18vw, 12rem);
  font-weight: 700;
  line-height: 1;
  margin: 0 0 1rem 0;
  letter-spacing: 0.1em;
}

.title {
  font-family: 'Orbitron', monospace;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  color: #e0e0e0;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.message {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.2rem;
  color: #b0b0b0;
  margin: 0 0 2.5rem 0;
}

.home-link {
  display: inline-block;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  text-decoration: none;
  color: #00f0ff;
  padding: 0.75rem 2rem;
  border: 1px solid rgba(0, 240, 255, 0.5);
  background: rgba(0, 240, 255, 0.05);
  transition: all 0.3s ease;
}

.home-link:hover,
.home-link:focus-visible {
  background: rgba(0, 240, 255, 0.15);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
  outline: none;
}
</style>
