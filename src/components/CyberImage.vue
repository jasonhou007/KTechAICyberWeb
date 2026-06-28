<template>
  <figure :class="['cyber-image', className]">
    <img
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      class="cyber-image__img"
    />
    <!-- Local scanline overlay (NOT the global Scanlines.vue, which is
         position:fixed and covers the whole viewport). This overlay is
         absolutely positioned over the image and clipped to the figure. -->
    <div class="cyber-image__scanlines" aria-hidden="true"></div>
  </figure>
</template>

<script setup>
/**
 * @component CyberImage
 * @description A cyberpunk-treated image wrapper: neon border, glow filter,
 * local scanline overlay, grayscale->color hover decode, and a glitch keyframe
 * guarded by prefers-reduced-motion. Used by the About and News sections to
 * present the official-site imagery extracted for AC #165.
 *
 * @example
 * <!-- Lazy by default -->
 * <CyberImage src="/images/about/about-who-we-are.webp" :alt="t('about.hero.imageAlt')" />
 * <!-- Eager (above-the-fold hero) -->
 * <CyberImage src="/x.webp" :alt="t('about.hero.imageAlt')" eager />
 * <!-- With a layout class -->
 * <CyberImage src="/x.webp" :alt="..." className="about-hero__figure" />
 */

defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
  eager: {
    type: Boolean,
    default: false,
  },
  className: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.cyber-image {
  position: relative;
  margin: 0;
  overflow: hidden;
  border-radius: 8px;
  /* Neon border + glow */
  border: 1px solid rgba(0, 255, 204, 0.4);
  box-shadow: 0 0 12px rgba(0, 255, 204, 0.25),
    inset 0 0 8px rgba(0, 255, 204, 0.1);
  background: rgba(10, 15, 28, 0.6);
}

.cyber-image__img {
  display: block;
  width: 100%;
  height: auto;
  /* Grayscale by default — "decodes" to full color on hover (cyberpunk effect) */
  filter: grayscale(0.6) contrast(1.05);
  transition: filter 0.4s ease, transform 0.4s ease;
}

.cyber-image:hover .cyber-image__img,
.cyber-image:focus-within .cyber-image__img {
  filter: grayscale(0) contrast(1.05);
  transform: scale(1.02);
}

/* Local scanline overlay — absolutely positioned over the image, non-interactive.
   Deliberately distinct from the global Scanlines.vue overlay (position:fixed). */
.cyber-image__scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 255, 204, 0.04) 2px,
    rgba(0, 255, 204, 0.04) 3px
  );
  opacity: 0.5;
  mix-blend-mode: screen;
}

/* Cyberpunk glitch keyframe on hover — a subtle horizontal skew/translate.
   Guarded by prefers-reduced-motion below so motion-sensitive users get a
   static image. */
.cyber-image:hover .cyber-image__img {
  animation: cyber-glitch 0.6s steps(2, end) 1;
}

@keyframes cyber-glitch {
  0% {
    transform: translateX(0) scale(1.02);
    filter: grayscale(0) contrast(1.05);
  }
  25% {
    transform: translateX(-2px) scale(1.02);
    filter: grayscale(0) contrast(1.1) hue-rotate(15deg);
  }
  50% {
    transform: translateX(2px) scale(1.02);
    filter: grayscale(0) contrast(1.05);
  }
  75% {
    transform: translateX(-1px) scale(1.02);
    filter: grayscale(0) contrast(1.1) hue-rotate(-10deg);
  }
  100% {
    transform: translateX(0) scale(1.02);
    filter: grayscale(0) contrast(1.05);
  }
}

/* Respect motion sensitivity: disable the glitch keyframe entirely. */
@media (prefers-reduced-motion: reduce) {
  .cyber-image:hover .cyber-image__img {
    animation: none;
    transform: none;
  }
  .cyber-image__img {
    transition: none;
  }
}
</style>
