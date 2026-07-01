<template>
  <div
    class="skeleton-card"
    :class="{ 'skeleton-loading': isLoading }"
    :style="{ animationDelay: `${index * 100}ms` }"
  >
    <!-- Skeleton for icon -->
    <div class="skeleton-icon">
      <div class="skeleton-circle"></div>
    </div>

    <!-- Skeleton for heading -->
    <div class="skeleton-heading">
      <div class="skeleton-line"></div>
    </div>

    <!-- Skeleton for description lines -->
    <div class="skeleton-content">
      <div class="skeleton-line skeleton-line-short"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line skeleton-line-medium"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isLoading: {
    type: Boolean,
    default: true
  },
  index: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.skeleton-card {
  background: var(--surface-elevated);
  border: 1px solid var(--accent-cyan-alpha-20);
  border-radius: var(--radius-lg);
  padding: 2rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.skeleton-icon {
  margin-bottom: 1.5rem;
}

.skeleton-heading {
  margin-bottom: 1rem;
  width: 100%;
}

.skeleton-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Skeleton elements with shimmer animation */
.skeleton-line,
.skeleton-circle {
  background: linear-gradient(
    90deg,
    var(--accent-cyan-alpha-10) 0%,
    var(--accent-cyan-alpha-20) 50%,
    var(--accent-cyan-alpha-10) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.skeleton-line {
  height: 1rem;
  width: 100%;
}

.skeleton-line-short {
  width: 60%;
}

.skeleton-line-medium {
  width: 80%;
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
.skeleton-card:not(.skeleton-loading) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
</style>
