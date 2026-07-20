<template>
  <div class="nav-dropdown"
       @mouseenter="handleMouseEnter"
       @mouseleave="handleMouseLeave">
    <button class="dropdown-trigger"
            @click="toggle"
            :aria-label="isOpen ? t('nav.dropdown.closeLabel', { label }) : t('nav.dropdown.openLabel', { label })"
            :aria-expanded="isOpen"
            aria-haspopup="menu"
            :aria-controls="menuId"
            ref="triggerRef">
      {{ label }}
      <span class="dropdown-arrow" :class="{ 'open': isOpen }">▼</span>
    </button>

    <transition name="dropdown-fade">
      <div v-if="isOpen"
           :id="menuId"
           ref="menuRef"
           class="dropdown-menu"
           role="menu"
           :aria-label="label"
           @click="handleMenuClick">
        <!-- Flat mode (default): render items directly when items.length > 0. -->
        <router-link v-for="item in items"
                     v-show="items.length > 0"
                     :key="item.key"
                     :to="item.route"
                     class="dropdown-item"
                     role="menuitem"
                     :data-item-idx="itemIdxById(item.key)"
                     @click="close"
                     @keydown="onItemKeydown($event, itemIdxById(item.key))">
          {{ t(item.label) }}
        </router-link>
        <!-- Grouped mega-menu mode: render one .dropdown-group per group when
             items is empty/undefined but groups are provided. -->
        <div v-for="group in groups"
             v-show="items.length === 0"
             :key="group.groupLabel"
             class="dropdown-group">
          <div class="dropdown-group-heading">{{ t(group.groupLabel) }}</div>
          <router-link v-for="item in group.items"
                       :key="item.key"
                       :to="item.route"
                       class="dropdown-item"
                       role="menuitem"
                       :data-item-idx="itemIdxById(item.key)"
                       @click="close"
                       @keydown="onItemKeydown($event, itemIdxById(item.key))">
            {{ t(item.label) }}
          </router-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { isDesktopViewport, isMobileViewport } from '../constants/breakpoints'

// Shared i18n — text follows the site-wide language toggle (en/zh).
const { t } = useLanguage()

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  // Optional grouped (mega-menu) mode: when `items` is empty/undefined and
  // `groups` is provided, render one .dropdown-group per group, each with a
  // non-clickable heading (t(group.groupLabel)) followed by its items.
  groups: {
    type: Array,
    default: () => []
  },
  // Stable id for aria-controls linkage (defaults to a label-derived slug).
  menuId: {
    type: String,
    default: ''
  }
})

// Derive a stable menu id once per instance so the trigger's aria-controls
// points at the rendered menu element.
const autoMenuId = `dropdown-menu-${Math.random().toString(36).slice(2, 9)}`
const menuId = computed(() => props.menuId || autoMenuId)

const isOpen = ref(false)
// S5: track whether the menu was opened/pinned by an explicit interaction
// (click or keyboard). A pinned menu is NOT closed by mouseleave — only the
// hover path opens/closes on mouseleave. This unifies the desktop open model
// so hover and click can no longer disagree on state.
const pinned = ref(false)
const triggerRef = ref(null)
const menuRef = ref(null)

// Build a flat ordered list of all menuitems (flat items + grouped items) so
// arrow-key navigation can index across both modes uniformly.
const allItems = computed(() => {
  if (props.items && props.items.length > 0) {
    return props.items
  }
  return (props.groups || []).flatMap((g) => g.items || [])
})

// Map item.key -> flat index for the data-item-idx attribute + arrow nav.
const itemIdxById = (key) => allItems.value.findIndex((i) => i.key === key)

const focusItem = (idx) => {
  const menu = menuRef.value || document.querySelector(`#${menuId.value}`)
  const el = menu?.querySelector(`[data-item-idx="${idx}"]`)
  el?.focus()
}

const open = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
  pinned.value = false
}

const toggle = () => {
  // Click toggles pin: opening pins (immune to mouseleave), closing unpins.
  const willOpen = !isOpen.value
  isOpen.value = willOpen
  pinned.value = willOpen
}

const handleMouseEnter = () => {
  if (isDesktopViewport() && !pinned.value) {
    isOpen.value = true
  }
}

const handleMouseLeave = () => {
  // Only the hover path closes on mouseleave; a pinned (click-opened) menu
  // stays open until the user picks an item, presses Escape, or clicks out.
  if (isDesktopViewport() && !pinned.value) {
    isOpen.value = false
  }
}

const handleMenuClick = (e) => {
  if (isMobileViewport()) {
    e.stopPropagation()
  }
}

// Unified keyboard handler bound to each menuitem. Implements the WAI-ARIA
// Menu pattern: Enter/Space activate, ArrowDown/ArrowUp move focus (with
// wrap), Escape closes + restores focus to the trigger.
const onItemKeydown = (e, idx) => {
  const total = allItems.value.length
  if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
    // router-link handles the navigation; just ensure the menu closes.
    close()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusItem((idx + 1) % total)
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusItem((idx - 1 + total) % total)
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    triggerRef.value?.focus()
  }
}

const handleClickOutside = (e) => {
  if (triggerRef.value && !triggerRef.value.contains(e.target)) {
    close()
  }
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    close()
    triggerRef.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})

// Expose for template refs + tests.
defineExpose({ isOpen, menuRef, open, close })
</script>

<style scoped>
.nav-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  background: transparent;
  border: none;
  color: var(--cyan);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: text-shadow 0.25s ease;
  will-change: text-shadow;
}

.dropdown-trigger:hover {
  text-shadow: 0 0 10px var(--accent-cyan-alpha-80);
}

.dropdown-arrow {
  font-size: 0.7rem;
  transition: transform 0.25s ease;
  will-change: transform;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid var(--accent-cyan-alpha-30);
  border-radius: var(--radius-sm);
  min-width: 200px;
  padding: 0.5rem 0;
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.25s ease, background-color 0.25s ease, padding-left 0.25s ease;
  will-change: color, background-color, padding-left;
}

.dropdown-item:hover,
.dropdown-item:focus-visible {
  background: var(--accent-cyan-alpha-10);
  color: var(--cyan);
  padding-left: 1.25rem;
  outline: none;
}

.dropdown-item:focus-visible {
  box-shadow: inset 0 0 0 2px var(--accent-cyan-alpha-60);
}

/* Grouped mega-menu mode */
.dropdown-group {
  padding: 0.25rem 0;
}

.dropdown-group + .dropdown-group {
  border-top: 1px solid var(--accent-cyan-alpha-20);
  margin-top: 0.25rem;
  padding-top: 0.5rem;
}

.dropdown-group-heading {
  padding: 0.5rem 1rem 0.25rem;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--cyan);
  cursor: default;
}

.dropdown-group-heading:hover {
  background: transparent;
  color: var(--cyan);
  padding-left: 1rem;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  will-change: opacity, transform;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Media queries cannot reference CSS variables (not resolved at parse
 * time), so the literal mirrors src/constants/breakpoints.js
 * MOBILE_BREAKPOINT / --breakpoint-mobile. Keep these in sync. */
@media (max-width: 768px) {
  .dropdown-menu {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: var(--radius-xl) 20px 0 0;
  }
}

/* #432 AC4: Respect prefers-reduced-motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .dropdown-trigger,
  .dropdown-arrow,
  .dropdown-item,
  .dropdown-fade-enter-active,
  .dropdown-fade-leave-active {
    transition-duration: 0s;
  }
}
</style>
