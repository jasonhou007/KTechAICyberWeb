<template>
  <div class="scanlines" aria-hidden="true"></div>
</template>

<script setup>
/**
 * @component Scanlines
 * @description CRT scanlines overlay effect for cyberpunk aesthetic
 *
 * @example
 * <Scanlines />
 */
</script>

<style scoped>
.scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: var(--z-scanlines);
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 255, 204, 0.01) 2px,
    rgba(0, 255, 204, 0.01) 4px
  );
  opacity: 0.3;
}
</style>
