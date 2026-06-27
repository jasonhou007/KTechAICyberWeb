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
        <div v-for="item in items" 
             :key="item.key" 
             class="dropdown-item"
             @click="navigateTo(item.route)">
          {{ t(item.label) }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()
const isOpen = ref(false)
const triggerRef = ref(null)

// Simple translation function
const t = (key) => {
  const translations = {
    'nav.dropdown.open': 'Open menu',
    'nav.dropdown.close': 'Close menu'
  }
  return translations[key] || key
}

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
