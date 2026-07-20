<script setup>
/**
 * @component PipelineCard
 * @description Single stage in the Self-Driving pipeline rail (#203).
 *
 * Pure presentation: highlights itself when current, dims when done, and
 * stays idle otherwise. All animation is transform/opacity only so the rail
 * stays GPU-cheap. The accent color comes from the EXISTING cyber palette
 * (passed in as a CSS-variable name) — no new palette invented here.
 *
 * @ticket #203
 */
import { useLanguage } from '../../composables/useLanguage'

const { t } = useLanguage()

const props = defineProps({
  // Phase id, e.g. 'planner'. Drives the i18n key + accent color.
  phase: { type: String, required: true },
  // Currently executing stage.
  isCurrent: { type: Boolean, default: false },
  // Already completed this cycle.
  isDone: { type: Boolean, default: false },
  // CSS variable name from the existing palette, e.g. '--cyan'.
  accentVar: { type: String, default: '--cyan' },
  // i18n prefix for services variant (default 'selfDriving')
  i18nPrefix: { type: String, default: 'selfDriving' },
})

const titleKey = `${props.i18nPrefix}.phases.${props.phase}.title`
const statusKey = `${props.i18nPrefix}.phases.${props.phase}.status`
</script>

<template>
  <li
    class="pipeline-card"
    :class="{ current: isCurrent, done: isDone }"
    :style="{ '--card-accent': `var(${accentVar})` }"
    :data-phase="phase"
    :data-current="isCurrent ? 'true' : 'false'"
    role="listitem"
  >
    <span class="pipeline-card-marker" aria-hidden="true"></span>
    <!-- The stage title is visible LABEL text, not a document heading. The 8
         stage names are data-viz labels for an auto-playing rail (the demo's
         single <h2> is the section's heading); promoting each to an <h3> would
         pollute the host page's heading outline with 8 transient entries
         between its real sections. The parent PipelineTrack is a role="list"
         and this card is a role="listitem", so screen readers still get
         structure without inflating the heading map. -->
    <!-- Host tag is native <li> (NOT <article>) per #225: a native <li>'s
         implicit role is `listitem`, so the explicit role="listitem" above is
         allowed-by-implicit-role and Lighthouse's `aria-allowed-role` audit
         passes. <article> was rejected because its implicit role (`article`)
         is incompatible with `listitem`. The .pipeline-card class still owns
         all styling (display:flex, etc.), so the swap is a visual noop. -->
    <div class="pipeline-card-header">
      <span class="pipeline-card-title">{{ t(titleKey) }}</span>
    </div>
    <p class="pipeline-card-status">{{ t(statusKey) }}</p>
  </li>
</template>

<style scoped>
.pipeline-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: clamp(0.4rem, 0.8vh, 0.6rem) 0.75rem;
  min-width: clamp(5.5rem, 7vw, 7rem);
  border: 1px solid var(--accent-cyan-alpha-15);
  background: var(--surface-card);
  border-radius: var(--radius-md);
  opacity: 0.45;
  transition:
    transform 0.45s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.45s ease,
    border-color 0.45s ease,
    box-shadow 0.45s ease;
  /* transform/opacity only — GPU-cheap, the rail animates forever (#203 AC3). */
  will-change: transform, opacity;
}
.pipeline-card.done {
  opacity: 0.7;
  border-color: rgba(0, 255, 204, 0.25);
}
.pipeline-card.current {
  opacity: 1;
  transform: translateY(-3px);
  border-color: var(--card-accent);
  box-shadow: 0 0 12px rgba(0, 255, 204, 0.25);
}
.pipeline-card-marker {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--card-accent);
  box-shadow: 0 0 6px var(--card-accent);
  opacity: 0.4;
}
.pipeline-card.current .pipeline-card-marker {
  opacity: 1;
  animation: pipeline-pulse 1.6s ease-in-out infinite;
}
.pipeline-card-title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-primary);
}
.pipeline-card.current .pipeline-card-title {
  color: var(--card-accent);
  text-shadow: 0 0 6px var(--card-accent);
}
.pipeline-card-status {
  margin: 0;
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.25;
}
.pipeline-card.current .pipeline-card-status {
  color: var(--text-primary);
}

@keyframes pipeline-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.6;
  }
}

/* Reduced motion: kill the marker pulse + lift; the card still shows current
   state via color/border so the story stays legible without animation. */
@media (prefers-reduced-motion: reduce) {
  .pipeline-card,
  .pipeline-card-marker {
    transition: none;
    animation: none;
  }
  .pipeline-card.current {
    transform: none;
  }
}
</style>
