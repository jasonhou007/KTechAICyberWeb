<template>
  <div class="skeleton-honors" :class="{ 'skeleton-loading': isLoading }">
    <div
      v-for="i in count"
      :key="i"
      class="skeleton-badge"
      :style="{ animationDelay: `${i * 50}ms` }"
    >
      <div class="skeleton-badge-inner">
        <div class="skeleton-icon"></div>
        <div class="skeleton-text">
          <div class="skeleton-line"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isLoading: {
    type: Boolean,
    default: true
  },
  count: {
    type: Number,
    default: 6
  }
})
</script>

<style scoped>
.skeleton-honors {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  padding: 2rem;
}

.skeleton-badge {
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
  flex: 0 0 calc(33.333% - 1rem);
  max-width: calc(33.333% - 1rem);
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.skeleton-badge-inner {
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 80px;
}

.skeleton-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-text {
  flex: 1;
}

/* Skeleton elements with shimmer animation */
.skeleton-icon,
.skeleton-line {
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

.skeleton-line {
  height: 1rem;
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
.skeleton-honors:not(.skeleton-loading) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .skeleton-badge {
    flex: 0 0 calc(50% - 0.75rem);
    max-width: calc(50% - 0.75rem);
  }
}
</style>
