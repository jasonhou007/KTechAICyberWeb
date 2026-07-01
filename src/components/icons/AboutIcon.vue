<script setup>
/**
 * AboutIcon.vue — original cyberpunk inline-SVG icons for the About page.
 *
 * Originally shipped by #198 (Who We Are section, 5 motifs) as a follow-up to
 * #165. #273 extends the component with 8 additional motifs covering the
 * remaining About emoji: Vision / Mission / Culture (4 values) / Achievements
 * (2 milestones).
 *
 * IP NOTE (the whole reason this component exists): the official site's
 * `about1-5.svg` icons embed the parent company's wordmark and are trademarked,
 * so they are deliberately NOT used. All 13 motifs below are ORIGINAL
 * royalty-free geometric line-art — no wordmarks, no logos, no map landmasses,
 * no currency symbols, no rocket / trophy-cup likeness. See
 * public/ASSETS_NOTICE.md for the full attestation.
 *
 * Single shared <svg viewBox="0 0 64 64"> with one <g v-if="name==='...'"> per
 * motif, so only the requested geometry is rendered into the DOM.
 *
 * Props:
 *   name  — one of 'company' | 'parentRegion' | 'capital' | 'established' |
 *           'services' | 'vision' | 'mission' | 'customer' | 'collaboration' |
 *           'agile' | 'professional' | 'firstMnc' | 'firstFintech'
 *   label — string; becomes the svg aria-label (informative branch).
 *   size  — number; the rendered px width/height. Defaults to 48 so the 5 #198
 *           Who We Are icons render exactly as before (non-regression). The 8
 *           #273 motifs pass an explicit size (32 or 48) from About.vue.
 */
defineProps({
  name: {
    type: String,
    required: true,
    validator: (v) =>
      [
        'company',
        'parentRegion',
        'capital',
        'established',
        'services',
        'vision',
        'mission',
        'customer',
        'collaboration',
        'agile',
        'professional',
        'firstMnc',
        'firstFintech',
      ].includes(v),
  },
  label: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 48,
  },
})
</script>

<template>
  <svg
    class="about-icon"
    viewBox="0 0 64 64"
    :width="size"
    :height="size"
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

    <!--
      #273 motifs below — original geometric line-art for the remaining About
      emoji (Vision / Mission / Culture / Achievements). Same viewBox, same
      fill:none / stroke:currentColor treatment as the #198 motifs.
    -->

    <!-- vision: scope / long-range vision — 3 nested circles + horizontal sightline -->
    <g v-else-if="name === 'vision'" aria-hidden="true">
      <circle cx="32" cy="32" r="24" />
      <circle cx="32" cy="32" r="14" />
      <circle cx="32" cy="32" r="6" />
      <!-- horizontal sightline crossing the scope -->
      <line x1="6" y1="32" x2="58" y2="32" />
    </g>

    <!-- mission: reticle / target — 3 concentric circles + 4 crosshair ticks (N/S/E/W) -->
    <g v-else-if="name === 'mission'" aria-hidden="true">
      <circle cx="32" cy="32" r="24" />
      <circle cx="32" cy="32" r="16" />
      <circle cx="32" cy="32" r="8" />
      <!-- 4 short crosshair ticks just outside the outer ring -->
      <line x1="32" y1="2" x2="32" y2="8" />
      <line x1="32" y1="56" x2="32" y2="62" />
      <line x1="2" y1="32" x2="8" y2="32" />
      <line x1="56" y1="32" x2="62" y2="32" />
    </g>

    <!-- customer: two abstract busts — 2 head circles + 2 shallow shoulder arcs -->
    <g v-else-if="name === 'customer'" aria-hidden="true">
      <!-- heads -->
      <circle cx="24" cy="22" r="8" />
      <circle cx="44" cy="22" r="8" />
      <!-- shoulder arcs (quarter-ellipse paths beneath each head) -->
      <path d="M 10 48 A 14 14 0 0 1 38 48" />
      <path d="M 30 48 A 14 14 0 0 1 58 48" />
    </g>

    <!-- collaboration: two interlocking hexagons — linkage / partnership -->
    <g v-else-if="name === 'collaboration'" aria-hidden="true">
      <polygon points="24,20 34.4,26 34.4,38 24,44 13.6,38 13.6,26" />
      <polygon points="40,20 50.4,26 50.4,38 40,44 29.6,38 29.6,26" />
    </g>

    <!-- agile: speed / energy — outer circle + 4-segment rising zigzag inside -->
    <g v-else-if="name === 'agile'" aria-hidden="true">
      <circle cx="32" cy="32" r="26" />
      <!-- rising zigzag: bottom-left stepping up to top-right -->
      <polyline points="12,48 24,38 36,28 48,14" />
    </g>

    <!-- professional: briefcase wireframe — body rect + handle + divider + latch -->
    <g v-else-if="name === 'professional'" aria-hidden="true">
      <!-- body -->
      <rect x="10" y="24" width="44" height="30" />
      <!-- top handle (semicircle path) -->
      <path d="M 24 24 V 18 A 8 8 0 0 1 40 18 V 24" />
      <!-- center divider -->
      <line x1="10" y1="38" x2="54" y2="38" />
      <!-- small latch on the divider -->
      <rect x="29" y="35" width="6" height="6" />
    </g>

    <!-- firstMnc: award / achievement — 5-pointed star + 2 laurel arcs (NOT a trophy cup) -->
    <g v-else-if="name === 'firstMnc'" aria-hidden="true">
      <!-- 5-pointed star, outer r=14, centered (32,32) -->
      <polygon points="32,18 35.1,27.7 45.3,27.7 37.1,33.7 40.2,43.3 32,37.3 23.8,43.3 26.9,33.7 18.7,27.7 28.9,27.7" />
      <!-- left laurel arc -->
      <path d="M 16 46 A 10 14 0 0 1 16 18" />
      <!-- right laurel arc -->
      <path d="M 48 46 A 10 14 0 0 0 48 18" />
    </g>

    <!-- firstFintech: medal — circle + centered star + 2 short ribbon tails -->
    <g v-else-if="name === 'firstFintech'" aria-hidden="true">
      <!-- medal rim -->
      <circle cx="32" cy="38" r="16" />
      <!-- centered 5-pointed star inside the medal (outer r=8, centered 32,38) -->
      <polygon points="32,30 33.8,35.5 39.5,35.5 34.9,38.9 36.7,44.4 32,41 27.3,44.4 29.1,38.9 24.5,35.5 30.2,35.5" />
      <!-- two short ribbon tails descending from the top of the medal -->
      <polyline points="22,4 26,22" />
      <polyline points="42,4 38,22" />
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
  filter: drop-shadow(0 0 6px var(--accent-cyan-alpha-60));
  transition: filter 0.3s ease;
}

.about-icon:hover {
  filter: drop-shadow(0 0 10px rgba(0, 255, 204, 0.85));
  animation: about-icon-pulse 1.6s ease-in-out infinite;
}

@keyframes about-icon-pulse {
  0%, 100% { filter: drop-shadow(0 0 6px var(--accent-cyan-alpha-60)); }
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
