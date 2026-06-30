<script setup>
// OpsEventLog.vue — scrolling feed + filter tabs All/AI/Security/Performance.
// aria-live=polite so new events are announced. Emits category changes + reads
// the already-filtered `events` list from the parent composable.
import { useLanguage } from '../../composables/useLanguage'

const props = defineProps({
  events: { type: Array, required: true }, // already-filtered FeedEvent[]
  categories: { type: Array, required: true },
  activeCategory: { type: String, required: true },
  ariaFeedLabel: { type: String, required: true },
})

const emit = defineEmits(['set-category'])

const { t } = useLanguage()

function timeLabel(ts) {
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="ops-event-log" data-test="ops-event-log">
    <div class="ops-event-tabs" role="tablist" :aria-label="t('opsHud.aria.feedLive')">
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        role="tab"
        :aria-selected="activeCategory === c"
        class="ops-event-tab"
        :class="{ active: activeCategory === c }"
        :data-key="c"
        :data-test="`ops-tab-${c}`"
        @click.stop="emit('set-category', c)"
      >{{ t('opsHud.categories.' + c) }}</button>
    </div>
    <ol
      class="ops-event-list"
      :aria-label="ariaFeedLabel"
      aria-live="polite"
      data-test="ops-event-list"
    >
      <li
        v-for="e in events"
        :key="e.id"
        class="ops-event-item"
        :class="['ops-cat-' + e.category, { 'ops-event-pulse': e.pulse, 'ops-event-anomaly': e.anomaly }]"
      >
        <span class="ops-event-time">{{ timeLabel(e.ts) }}</span>
        <span class="ops-event-cat">{{ t('opsHud.categories.' + e.category) }}</span>
        <span class="ops-event-msg">{{ t(e.message) }}</span>
      </li>
      <li v-if="events.length === 0" class="ops-event-empty">—</li>
    </ol>
  </div>
</template>

<style scoped>
.ops-event-log {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

.ops-event-tabs {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.ops-event-tab {
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.ops-event-tab:hover,
.ops-event-tab:focus-visible {
  border-color: var(--neon-green);
  color: var(--neon-green);
  outline: none;
  box-shadow: 0 0 5px var(--neon-green);
}

.ops-event-tab.active {
  background: rgba(0, 255, 136, 0.15);
  border-color: var(--neon-green);
  color: var(--neon-green);
}

.ops-event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 140px;
  overflow-y: auto;
  font-family: var(--font-display);
  font-size: 0.72rem;
}

.ops-event-item {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.4rem;
  padding: 0.15rem 0.3rem;
  border-bottom: 1px solid rgba(0, 255, 136, 0.08);
  align-items: baseline;
}

.ops-event-time {
  color: var(--text-secondary);
  opacity: 0.7;
}

.ops-event-cat {
  color: var(--neon-blue);
  text-transform: uppercase;
  font-size: 0.65rem;
}

.ops-cat-security .ops-event-cat { color: var(--neon-pink); }
.ops-cat-performance .ops-event-cat { color: var(--neon-green); }

.ops-event-msg {
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ops-event-pulse .ops-event-msg {
  color: var(--neon-green);
  text-shadow: 0 0 4px var(--neon-green);
}

.ops-event-anomaly .ops-event-msg {
  color: var(--neon-pink);
  text-shadow: 0 0 4px var(--neon-pink);
}

.ops-event-empty {
  padding: 0.4rem;
  color: var(--text-secondary);
  opacity: 0.5;
  text-align: center;
}
</style>
