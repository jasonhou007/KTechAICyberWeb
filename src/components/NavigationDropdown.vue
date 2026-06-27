<template>
  <div class="nav-dropdown" 
       @mouseenter="handleMouseEnter"
       @mouseleave="handleMouseLeave"
       :aria-expanded="isOpen"
       :aria-haspopup="true">
    <button class="dropdown-trigger"
            @click="toggle"
            :aria-label="isOpen ? t('nav.dropdown.close') : t('nav.dropdown.open')"
            ref="triggerRef">
      {{ label }}
      <span class="dropdown-arrow" :class="{ 'open': isOpen }">▼</span>
    </button>
    
    <transition name="dropdown-fade">
      <div v-if="isOpen"
           class="dropdown-menu"
           @click="handleMenuClick">
        <!-- Flat mode (default): render items directly when items.length > 0. -->
        <div v-if="items && items.length > 0"
             v-for="item in items"
             :key="item.key"
             class="dropdown-item"
             @click="navigateTo(item.route)">
          {{ t(item.label) }}
        </div>
        <!-- Grouped mega-menu mode: render one .dropdown-group per group when
             items is empty/undefined but groups are provided. -->
        <div v-else
             v-for="group in groups"
             :key="group.groupLabel"
             class="dropdown-group">
          <div class="dropdown-group-heading">{{ t(group.groupLabel) }}</div>
          <div v-for="item in group.items"
               :key="item.key"
               class="dropdown-item"
               @click="navigateTo(item.route)">
            {{ t(item.label) }}
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguage } from '../composables/useLanguage'

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
  }
})

const router = useRouter()
const isOpen = ref(false)
const triggerRef = ref(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const handleMouseEnter = () => {
  if (window.innerWidth > 768) {
    isOpen.value = true
  }
}

const handleMouseLeave = () => {
  if (window.innerWidth > 768) {
    isOpen.value = false
  }
}

const handleMenuClick = (e) => {
  if (window.innerWidth <= 768) {
    e.stopPropagation()
  }
}

const navigateTo = (route) => {
  router.push(route)
  isOpen.value = false
}

const handleClickOutside = (e) => {
  if (triggerRef.value && !triggerRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
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
</script>

<style scoped>
.nav-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  background: transparent;
  border: none;
  color: #00f0ff;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.dropdown-trigger:hover {
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.8);
}

.dropdown-arrow {
  font-size: 0.7rem;
  transition: transform 0.3s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(10, 10, 20, 0.95);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 5px;
  min-width: 200px;
  padding: 0.5rem 0;
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background: rgba(0, 240, 255, 0.1);
  color: #00f0ff;
  padding-left: 1.25rem;
}

/* Grouped mega-menu mode */
.dropdown-group {
  padding: 0.25rem 0;
}

.dropdown-group + .dropdown-group {
  border-top: 1px solid rgba(0, 240, 255, 0.2);
  margin-top: 0.25rem;
  padding-top: 0.5rem;
}

.dropdown-group-heading {
  padding: 0.5rem 1rem 0.25rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #00f0ff;
  cursor: default;
}

.dropdown-group-heading:hover {
  background: transparent;
  color: #00f0ff;
  padding-left: 1rem;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .dropdown-menu {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 20px 20px 0 0;
  }
}
</style>
