<template>
  <div ref="observerTarget" class="fade-in" :class="{ 'visible': isVisible }">
    <slot />
  </div>
</template>

<script setup>
/**
 * @component FadeIn
 * @description Wrapper component for fade-in animation on scroll
 *
 * @example
 * <FadeIn>
 *   <h2>Title</h2>
 * </FadeIn>
 */

import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  threshold: {
    type: Number,
    default: 0.1
  }
})

const observerTarget = ref(null)
const isVisible = ref(false)
let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: props.threshold,
      rootMargin: '0px 0px -50px 0px'
    }
  )

  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
