<template>
  <div class="skeleton-contact" :class="{ 'skeleton-loading': isLoading }">
    <div
      v-for="i in count"
      :key="i"
      class="skeleton-item"
      :style="{ animationDelay: `${i * 80}ms` }"
    >
      <div class="skeleton-item-icon">
        <div class="skeleton-circle"></div>
      </div>
      <div class="skeleton-item-content">
        <div class="skeleton-line skeleton-line-title"></div>
        <div class="skeleton-line skeleton-line-text"></div>
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
    default: 4
  }
})
</script>

<style scoped>
.skeleton-contact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.skeleton-item {
  opacity: 0;
  animation: fadeIn 0.4s ease forwards;
  background: var(--surface-elevated);
  border: 1px solid rgba(0, 240, 255, 0.2);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 80px;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.skeleton-item-icon {
  flex-shrink: 0;
}

.skeleton-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Skeleton elements with shimmer animation */
.skeleton-circle,
.skeleton-line {
  background: linear-gradient(
    90deg,
    rgba(0, 240, 255, 0.1) 0%,
    rgba(0, 240, 255, 0.2) 50%,
    rgba(0, 240, 255, 0.1) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.skeleton-line-title {
  height: 1.2rem;
  width: 60%;
}

.skeleton-line-text {
  height: 0.9rem;
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
.skeleton-contact:not(.skeleton-loading) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .skeleton-contact {
    grid-template-columns: 1fr;
  }
}
</style>
