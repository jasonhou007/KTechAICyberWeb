<script setup>
/**
 * AboutIcon.vue — original cyberpunk inline-SVG icons for the About page
 * "Who We Are" section (AC #198, follow-up to #165).
 *
 * IP NOTE (the whole reason this component exists): the official site's
 * `about1-5.svg` icons embed the parent company's wordmark and are trademarked,
 * so they are deliberately NOT used. The 5 motifs below are ORIGINAL
 * royalty-free geometric line-art — no wordmarks, no logos, no map landmasses,
 * no currency symbols, no rocket likeness. See public/ASSETS_NOTICE.md for the
 * full attestation.
 *
 * Single shared <svg viewBox="0 0 64 64"> with one <g v-if="name==='...'"> per
 * motif, so only the requested geometry is rendered into the DOM.
 *
 * Props:
 *   name  — one of 'company' | 'parentRegion' | 'capital' | 'established' |
 *           'services'
 *   label — string; becomes the svg aria-label (informative branch).
 */

defineProps({
  name: {
    type: String,
    required: true,
    validator: (v) =>
      ['company', 'parentRegion', 'capital', 'established', 'services'].includes(v),
  },
  label: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <svg
    class="about-icon"
    viewBox="0 0 64 64"
    width="48"
    height="48"
    role="img"
    :aria-label="label"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- company: geometric building — roofline triangle + 3 stacked floors + doorway -->
    <g v-if="name === 'company'" aria-hidden="true">
      <!-- roofline -->
      <polyline points="10,26 32,10 54,26" />
      <!-- three stacked floor rectangles -->
      <rect x="16" y="28" width="32" height="8" />
      <rect x="16" y="38" width="32" height="8" />
      <rect x="16" y="48" width="32" height="6" />
      <!-- doorway -->
      <rect x="28" y="48" width="8" height="6" />
    </g>

    <!-- parentRegion: wireframe globe — circle + 2 elliptical longitudes + 2 latitudes -->
    <g v-else-if="name === 'parentRegion'" aria-hidden="true">
      <circle cx="32" cy="32" r="22" />
      <!-- vertical longitudes (narrow ellipses) -->
      <ellipse cx="32" cy="32" rx="10" ry="22" />
      <ellipse cx="32" cy="32" rx="20" ry="22" />
      <!-- horizontal latitudes -->
      <line x1="10" y1="22" x2="54" y2="22" />
      <line x1="10" y1="42" x2="54" y2="42" />
    </g>

    <!-- capital: stacked coins — 3 ellipses + side connecting lines -->
    <g v-else-if="name === 'capital'" aria-hidden="true">
      <ellipse cx="32" cy="16" rx="18" ry="7" />
      <ellipse cx="32" cy="32" rx="18" ry="7" />
      <ellipse cx="32" cy="48" rx="18" ry="7" />
      <!-- left/right edges linking the coin stack into a 3D column -->
      <line x1="14" y1="16" x2="14" y2="48" />
      <line x1="50" y1="16" x2="50" y2="48" />
    </g>

    <!-- established: calendar wireframe — border + 2 binding tabs + marker dot -->
    <g v-else-if="name === 'established'" aria-hidden="true">
      <rect x="10" y="16" width="44" height="38" />
      <!-- top binding tabs -->
      <line x1="22" y1="10" x2="22" y2="20" />
      <line x1="42" y1="10" x2="42" y2="20" />
      <!-- header divider -->
      <line x1="10" y1="26" x2="54" y2="26" />
      <!-- marker dot on a date cell -->
      <circle cx="32" cy="42" r="4" />
    </g>

    <!-- services: upward trajectory — rising polyline + arrowhead + 2 nodes -->
    <g v-else-if="name === 'services'" aria-hidden="true">
      <!-- rising path -->
      <polyline points="10,50 24,38 38,28 52,12" />
      <!-- arrowhead at the top of the trajectory -->
      <polyline points="44,12 52,12 52,20" />
      <!-- two node markers on the path -->
      <circle cx="24" cy="38" r="3" />
      <circle cx="38" cy="28" r="3" />
    </g>
  </svg>
</template>

<style scoped>
/* The color derives from the site theme (--cyan) so the icon stays in lock-step
   with the rest of the cyber UI; #00ffcc is the same value the variable holds. */
.about-icon {
  color: var(--cyan, #00ffcc);
}

/* All motifs share the same line-art treatment. */
.about-icon :deep(g),
.about-icon g {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Cyberpunk glow. Guarded by prefers-reduced-motion below (the glow itself is
   static, but the wrapper also drives a subtle hover pulse that IS motion and
   must be disabled for motion-sensitive users). */
.about-icon {
  filter: drop-shadow(0 0 6px rgba(0, 255, 204, 0.6));
  transition: filter 0.3s ease;
}

.about-icon:hover {
  filter: drop-shadow(0 0 10px rgba(0, 255, 204, 0.85));
  animation: about-icon-pulse 1.6s ease-in-out infinite;
}

@keyframes about-icon-pulse {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(0, 255, 204, 0.6)); }
  50% { filter: drop-shadow(0 0 12px rgba(0, 255, 204, 0.95)); }
}

/* Respect motion sensitivity: disable the hover pulse animation entirely. The
   static drop-shadow glow is preserved so the icon is still legible. */
@media (prefers-reduced-motion: reduce) {
  .about-icon:hover {
    animation: none;
  }
  .about-icon {
    transition: none;
  }
}
</style>
