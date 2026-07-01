<template>
  <Transition name="loading-fade">
    <div v-if="isLoading" class="loading-screen" role="status" aria-live="polite" aria-label="Loading">
      <div class="loading-content">
        <!-- Logo animation -->
        <div class="loading-logo">
          <div class="logo-text">KTECH<span class="logo-accent">.AI</span></div>
          <div class="logo-pulse"></div>
        </div>

        <!-- Progress bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <div class="progress-text">{{ Math.round(progress) }}%</div>
        </div>

        <!-- Loading text with animation -->
        <div class="loading-text">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isLoading: {
    type: Boolean,
    required: true
  },
  progress: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-mid) 50%, var(--bg-gradient-end) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  width: 100%;
  max-width: 400px;
  padding: 2rem;
}

/* Logo animation */
.loading-logo {
  position: relative;
  margin-bottom: 3rem;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.2em;
  position: relative;
  z-index: 1;
}

.logo-accent {
  color: var(--cyan);
  text-shadow:
    0 0 10px var(--cyan),
    0 0 20px var(--cyan),
    0 0 30px var(--cyan);
  animation: neonPulse 1.5s ease-in-out infinite alternate;
}

@keyframes neonPulse {
  from {
    text-shadow:
      0 0 10px var(--cyan),
      0 0 20px var(--cyan);
  }
  to {
    text-shadow:
      0 0 20px var(--cyan),
      0 0 30px var(--cyan),
      0 0 40px var(--cyan),
      0 0 50px var(--cyan);
  }
}

.logo-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--accent-cyan-alpha-30) 0%, transparent 70%);
  animation: pulseRing 2s ease-out infinite;
  z-index: 0;
}

@keyframes pulseRing {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* Progress bar */
.progress-container {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--accent-cyan-alpha-20);
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cyan), var(--cyan), var(--cyan));
  background-size: 200% 100%;
  animation: progressShimmer 1s linear infinite;
  border-radius: var(--radius-sm);
  transition: width 0.1s linear;
  box-shadow: 0 0 10px var(--accent-cyan-alpha-50);
}

@keyframes progressShimmer {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 0%;
  }
}

.progress-text {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--cyan);
  text-align: right;
  letter-spacing: 0.1em;
}

/* Loading dots animation */
.loading-text {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background: var(--cyan);
  border-radius: 50%;
  animation: loadingDot 1.4s ease-in-out infinite;
  box-shadow: 0 0 10px var(--accent-cyan-alpha-50);
}

.loading-dot:nth-child(1) {
  animation-delay: 0s;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loadingDot {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Fade transition for loading screen */
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.6s ease;
}

.loading-fade-enter-from {
  opacity: 0;
}

.loading-fade-leave-to {
  opacity: 0;
}

.loading-fade-enter-to,
.loading-fade-leave-from {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .logo-text {
    font-size: 2rem;
  }
}
</style>
