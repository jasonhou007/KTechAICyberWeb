<template>
  <figure :class="['cyber-image', className]">
    <img
      v-show="!errored"
      :src="resolvedSrc"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="fetchpriority || undefined"
      :srcset="resolvedSrcset"
      :sizes="resolvedSizes"
      class="cyber-image__img"
      @error="onError"
    />
    <!-- CSS-only cyberpunk fallback placeholder (AC #305). Shown when the inner
         <img> fails to load (404, broken src, network error) so the user never
         sees the browser's broken-image icon. role="img" + aria-label keep the
         image's purpose announced to AT (WCAG 2.1 AA — non-text content needs a
         text alternative). The placeholder is decorative CSS only — no new
         binary asset, reuses theme variables for the neon seal look. -->
    <div
      v-if="errored"
      class="cyber-image__fallback"
      role="img"
      :aria-label="alt"
    >
      <span class="cyber-image__fallback-glyph" aria-hidden="true"></span>
    </div>
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
 * <!-- Responsive (#199): srcset + sizes; URLs are rebased under BASE_URL too -->
 * <CyberImage src="/x.webp" alt="..." :srcset="'/x-400w.webp 400w, /x-800w.webp 800w'" sizes="(max-width: 600px) 100vw, 50vw" />
 */

const props = defineProps({
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
  // Fetch-priority hint (#334 LCP). HTML spec values: "high" | "low" | "auto".
  // Empty string (default) OMITS the attribute entirely (see the template
  // binding `:fetchpriority="fetchpriority || undefined"` — Vue omits an
  // attr bound to undefined), matching the "absent prop => no attribute"
  // contract CyberImage already follows for srcset/sizes. Used to promote the
  // above-the-fold LCP image (e.g. the About hero, the first News card) to a
  // high-priority fetch so the browser does not wait for SPA hydration to
  // discover it.
  fetchpriority: {
    type: String,
    default: '',
  },
  className: {
    type: String,
    default: '',
  },
  // Responsive image variants (#199). `srcset` is a comma-separated list of
  // "url Ww" descriptors (e.g. "/x-400w.webp 400w, /x-800w.webp 800w"). Each
  // URL is rebased under the Vite BASE_URL via the same resolvePath() used for
  // `src`. `sizes` is the matching sizes attribute. Both default to '' so
  // legacy callers render identical markup (the attributes are omitted when
  // empty — see resolvedSrcset).
  srcset: {
    type: String,
    default: '',
  },
  sizes: {
    type: String,
    default: '',
  },
})

import { computed, ref, watch } from 'vue'

/**
 * Reactive error flag (AC #305). Flips to true when the inner <img> fails to
 * load (404, broken src, network error). The img is hidden via v-show and the
 * CSS-only fallback placeholder is rendered in its place. A ref (not a local
 * var) so the template re-renders reactively on the error event.
 *
 * @member {import('vue').Ref<boolean>}
 */
const errored = ref(false)

/**
 * @error handler (AC #305). Hides the broken <img> and reveals the cyberpunk
 * fallback placeholder. Wired to the native img `error` event in the template.
 * Kept as a named method (not inline) so the wiring is greppable and the
 * behavior is unit-testable as a real event-driven path.
 */
const onError = () => {
  errored.value = true
}

/**
 * Reset the error flag when `src` changes (review(security) #305).
 *
 * The article-image <CyberImage> in NewsDetail.vue lives outside the v-for and
 * is reused across SPA navigation when <router-view> has no :key. If article A's
 * image 404s (errored=true) and the user navigates to article B (working image),
 * `:src` updates but `errored` would otherwise stay true → the good image stays
 * hidden behind the placeholder until a full reload. Watching the primary `src`
 * prop and resetting the flag restores correct fallback behavior on route nav.
 */
watch(
  () => props.src,
  () => {
    errored.value = false
  },
)


/**
 * Resolve a public-asset image path against the Vite base path.
 *
 * The app is deployed at the GitHub Pages subpath /KTechAICyberWeb/ (see `base`
 * in vite.config.js). Public assets live under that subpath, so a literal
 * `/images/foo.webp` would 404 (it resolves to the origin root, not the base).
 * `import.meta.env.BASE_URL` is the configured base ('/KTechAICyberWeb/'), so
 * prefixing site-relative `/images/...` paths with it yields the correct URL
 * in both dev and prod. Absolute URLs (http(s)://, data:, protocol-relative)
 * and already-prefixed paths are passed through unchanged.
 *
 * Shared by `src` and every `srcset` URL so they rebase through ONE code path
 * (no duplicated base-path logic). #199.
 */
function resolvePath(p) {
  if (!p) return p
  // Pass through URLs that already carry a scheme or start with the base.
  if (/^(https?:)?\/\//i.test(p)) return p
  if (p.startsWith('data:')) return p
  const base = import.meta.env.BASE_URL || '/'
  if (p.startsWith(base)) return p
  // Only rebase site-root-relative public paths (e.g. /images/...).
  if (p.startsWith('/')) return base.replace(/\/$/, '') + p
  return p
}

const resolvedSrc = computed(() => resolvePath(props.src))

/**
 * Pass the `sizes` prop through, but return undefined when it is empty so Vue
 * OMITS the attribute entirely (rendering sizes="" would be invalid markup and
 * would break the "absent props => no attribute" contract). #199.
 */
const resolvedSizes = computed(() => (props.sizes ? props.sizes : undefined))

/**
 * Rebase every URL token in the srcset under BASE_URL, preserving the width
 * descriptors. Returns undefined when `srcset` is empty so Vue OMITS the
 * attribute entirely (not rendered as srcset=""). Each entry is "url Ww";
 * only the URL token is rebased. #199.
 */
const resolvedSrcset = computed(() => {
  if (!props.srcset) return undefined
  const rebased = props.srcset
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [url, ...descriptor] = entry.split(/\s+/)
      const rebasedUrl = resolvePath(url)
      return descriptor.length > 0
        ? `${rebasedUrl} ${descriptor.join(' ')}`
        : rebasedUrl
    })
    .join(', ')
  return rebased || undefined
})
</script>

<style scoped>
.cyber-image {
  position: relative;
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-md);
  /* Neon border + glow */
  border: 1px solid var(--accent-cyan-alpha-40);
  box-shadow: 0 0 12px rgba(0, 255, 204, 0.25),
    inset 0 0 8px var(--accent-cyan-alpha-10);
  background: var(--surface-card);
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

/* ============================================
 * CSS-only cyberpunk fallback placeholder (AC #305)
 * ============================================
 * Shown when the inner <img> fails to load (404, broken src). The figure's
 * box is preserved by the parent's height/object-fit rule, so this placeholder
 * fills the same box the image would have occupied. No new binary asset — the
 * neon seal glyph is a ::before content char, and every color uses existing
 * theme variables so dark/light theme variants stay consistent.
 */
.cyber-image__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Inherit the figure's background so the placeholder blends, then layer a
     subtle cyan tint to signal "image area, intentionally empty". */
  background:
    repeating-linear-gradient(
      45deg,
      var(--accent-cyan-alpha-05),
      var(--accent-cyan-alpha-05) 12px,
      transparent 12px,
      transparent 24px
    ),
    var(--surface-card);
  border-radius: inherit;
}

/* The neon seal glyph — a centered content char on a glowing cyan ring.
   aria-hidden on the parent span keeps it out of the a11y tree (the label
   comes from the wrapper's aria-label). */
.cyber-image__fallback-glyph {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 2px solid var(--accent-cyan-alpha-50);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--accent-cyan-alpha-30),
    inset 0 0 8px var(--accent-cyan-alpha-20);
  color: var(--cyan);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 0 8px var(--accent-cyan-alpha-60);
}

/* A cyber sigil inside the ring — pure decoration; the aria-label carries the
   meaningful text. */
.cyber-image__fallback-glyph::before {
  content: '\25C8'; /* diamond glyph as placeholder sigil */
}
</style>
