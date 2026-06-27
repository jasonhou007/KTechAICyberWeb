<template>
  <div class="skeleton-hero" :class="{ 'skeleton-loading': isLoading }">
    <!-- Skeleton for title -->
    <div class="skeleton-title">
      <div class="skeleton-line skeleton-line-lg"></div>
      <div class="skeleton-line skeleton-line-md"></div>
    </div>

    <!-- Skeleton for stats -->
    <dl class="skeleton-stats">
      <div v-for="i in 3" :key="i" class="skeleton-stat">
        <div class="skeleton-circle"></div>
        <div class="skeleton-line skeleton-line-sm"></div>
      </div>
    </dl>
  </div>
</template>

<script setup>
defineProps({
  isLoading: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.skeleton-hero {
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(0, 240, 255, 0.2);
  border-radius: 10px;
  padding: 3rem;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);
  margin-bottom: 3rem;
  min-height: 200px;
}

.skeleton-title {
  margin-bottom: 2rem;
}

.skeleton-stats {
  display: flex;
  justify-content: space-around;
  gap: 2rem;
}

.skeleton-stat {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* Skeleton elements with shimmer animation */
.skeleton-line,
.skeleton-circle {
  background: linear-gradient(
    90deg,
    rgba(0, 240, 255, 0.1) 0%,
    rgba(0, 240, 255, 0.2) 50%,
    rgba(0, 240, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton-line-lg {
  height: 3rem;
  width: 60%;
  margin: 0 auto 1rem;
}

.skeleton-line-md {
  height: 1.5rem;
  width: 40%;
  margin: 0 auto;
}

.skeleton-line-sm {
  height: 1rem;
  width: 80px;
}

.skeleton-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Fade out transition */
.skeleton-hero:not(.skeleton-loading) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
</style>
