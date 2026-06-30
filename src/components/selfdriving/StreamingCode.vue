<script setup>
/**
 * @component StreamingCode
 * @description Auto-typing terminal feed for the Self-Driving demo (#203).
 *
 * Reveals lines one-by-one based on a 0..1 `progress` value driven by the
 * parent composable. Pure transform/opacity reveal (clip + translate) so it
 * stays GPU-cheap. Copy is fully i18n'd — no hardcoded English.
 *
 * @ticket #203
 */
import { computed } from 'vue'
import { useLanguage } from '../../composables/useLanguage'

const { t } = useLanguage()

const props = defineProps({
  // Pre-translated lines to stream (caller passes t()-resolved strings).
  lines: { type: Array, default: () => [] },
  // 0..1 — how much of the feed is revealed.
  progress: { type: Number, default: 0 },
})

// How many lines are fully + partially visible at the current progress.
const visibleCount = computed(() => {
  const total = props.lines.length || 1
  return Math.max(1, Math.round(props.progress * total))
})
</script>

<template>
  <div class="streaming-code" aria-hidden="true">
    <pre class="streaming-code-pre"><code><span
  v-for="(line, i) in lines"
  :key="i"
  class="streaming-code-line"
  :class="{ revealed: i < visibleCount }"
>{{ line }}
</span></code></pre>
  </div>
</template>

<style scoped>
.streaming-code {
  width: 100%;
  font-family: 'Fira Code', 'Courier New', monospace;
}
.streaming-code-pre {
  margin: 0;
  padding: 0.6rem 0.8rem;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(0, 255, 204, 0.12);
  border-radius: 4px;
  overflow: hidden;
  color: var(--neon-green, #00ff88);
}
.streaming-code-line {
  display: block;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  font-size: 0.72rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}
.streaming-code-line.revealed {
  opacity: 0.85;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .streaming-code-line {
    transition: none;
    transform: none;
  }
}
</style>
