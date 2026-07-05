<template>
  <nav class="nav" :class="{ 'scrolled': isScrolled }" id="navbar">
    <router-link to="/" class="nav-logo">
      K<span class="accent">Tech</span>
    </router-link>

    <!-- Mobile hamburger toggle (off-canvas nav). Hidden on desktop via CSS. -->
    <button
      class="nav-toggle"
      ref="toggleRef"
      :aria-label="mobileOpen ? t('nav.menu.close') : t('nav.menu.open')"
      :aria-expanded="mobileOpen"
      aria-controls="navbar"
      @click="toggleMobile"
    >
      <span class="nav-toggle-bar" aria-hidden="true"></span>
      <span class="nav-toggle-bar" aria-hidden="true"></span>
      <span class="nav-toggle-bar" aria-hidden="true"></span>
    </button>

    <!-- #190: role="dialog" moved OFF the <ul> onto this wrapper. Keeping the
         dialog role on the <ul> triggered aria-allowed-role (dialog not allowed
         on ul) AND listitem (the dialog role overrode the ul's implicit list
         role, so child <li> lost their list parent). The wrapper owns the
         dialog semantics; the <ul> keeps native list semantics; the focusables
         still live inside the wrapper so the focus trap (panelRef now points
         here) still works. -->
    <div
      class="nav-mobile-dialog"
      :class="{ 'mobile-open': mobileOpen }"
      ref="panelRef"
      role="dialog"
      aria-modal="true"
      :aria-label="t('nav.menu.label')"
      @keydown="onPanelKeydown"
    >
      <ul class="nav-links">
      <li>
        <router-link to="/" @click="closeMobile">{{ t('nav.home') }}</router-link>
      </li>
      <li>
        <router-link to="/about" @click="closeMobile">{{ t('nav.aboutUs') }}</router-link>
      </li>
      <li>
        <router-link to="/news" @click="closeMobile">{{ t('nav.news') }}</router-link>
      </li>
      <li>
        <NavigationDropdown
          :label="t('nav.ourSolutions')"
          :groups="solutionsGroups"
        />
      </li>
      <li>
        <NavigationDropdown :label="t('nav.joinUs')" :items="joinItems" />
      </li>
      <li>
        <router-link to="/contact" @click="closeMobile">{{ t('nav.contact') }}</router-link>
      </li>
    </ul>
    </div>

    <!-- Optional toolbar slot: App.vue injects the language + theme toggles
         here so they live on the right edge of the nav (always visible,
         including on mobile, where they sit beside the hamburger rather than
         inside the off-canvas drawer). Decoupling the toggles from the nav
         item list keeps Header focused on routing while App.vue owns the
         global language/theme controls. -->
    <div class="nav-toolbar">
      <slot name="toolbar" />
    </div>
  </nav>
</template>

<script setup>
/**
 * @component Header
 * @description Main navigation header (#164 nav overhaul).
 *
 * Mirrors the official kaitai.tech top-level structure: Home, About Us
 * (direct router-link to /about), News (direct link to /news), Our Solutions
 * (grouped mega-menu), Join Us, Contact. The logo is a router-link to "/"
 * (no # anchors).
 * A mobile hamburger toggles an off-canvas
 * .nav-links panel. Scroll-aware styling toggles a `scrolled` class once
 * `window.scrollY > 50`. Translation flows through the shared `useLanguage()`
 * composable.
 */

import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguage } from '../composables/useLanguage'
import NavigationDropdown from './NavigationDropdown.vue'

// Shared i18n — text follows the site-wide language toggle (en/zh).
const { t } = useLanguage()

const router = useRouter()
// In some unit-test mounts router-link is stubbed without a real router
// injected, so useRouter() returns undefined. Guard the M3 afterEach hook so
// the drawer close-on-navigate logic is a no-op there instead of crashing
// during onMounted. Production always provides a router.
const routerSafe = router && typeof router.afterEach === 'function' ? router : null

// State
const isScrolled = ref(false)
const mobileOpen = ref(false)
const panelRef = ref(null)
const toggleRef = ref(null)
// Last element focused before the drawer opened — restored on close.
let lastFocusedBeforeOpen = null

// Submenu definitions. Routes point at real routed pages so the nav never
// produces a 404. Each submenu item renders via t(item.label).
const joinItems = [
  { key: 'joinUs', label: 'nav.submenu.joinUs', route: '/join-us' },
  { key: 'positionList', label: 'nav.submenu.positionList', route: '/careers' },
]

// Grouped mega-menu for Our Solutions. Two groups: Banking Solution +
// Blockchain & Web3. The Blockchain group includes the 3 new solution pages
// added in this ticket (cross-border-payment, digital-asset-custody, stablecoin).
const solutionsGroups = [
  {
    groupLabel: 'nav.groups.banking',
    items: [
      { key: 'retailLending', label: 'nav.submenu.retailLending', route: '/services/retail-lending' },
      { key: 'supplyChainFinance', label: 'nav.submenu.supplyChainFinance', route: '/services/supply-chain-finance' },
    ],
  },
  {
    groupLabel: 'nav.groups.blockchainWeb3',
    items: [
      { key: 'blockchain', label: 'nav.submenu.blockchain', route: '/services/blockchain' },
      { key: 'crossBorderPayment', label: 'nav.submenu.crossBorderPayment', route: '/services/cross-border-payment' },
      { key: 'digitalAssetCustody', label: 'nav.submenu.digitalAssetCustody', route: '/services/digital-asset-custody' },
      { key: 'stablecoin', label: 'nav.submenu.stablecoin', route: '/services/stablecoin' },
    ],
  },
]

const toggleMobile = async () => {
  mobileOpen.value = !mobileOpen.value
  if (mobileOpen.value) {
    // Open: record current focus + move it into the panel.
    lastFocusedBeforeOpen =
      document.activeElement && document.activeElement !== document.body
        ? document.activeElement
        : toggleRef.value
    await nextTick()
    const panel = panelRef.value
    const firstFocusable = panel?.querySelector(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    firstFocusable?.focus?.()
  } else {
    // Close: restore focus to the hamburger toggle.
    await nextTick()
    toggleRef.value?.focus?.()
  }
}

// Close the drawer (used by nav-link clicks + Escape + router afterEach).
const closeMobile = async () => {
  if (!mobileOpen.value) return
  mobileOpen.value = false
  await nextTick()
  toggleRef.value?.focus?.()
}

// Focus-trap inside the drawer panel: Tab on the last focusable wraps to the
// first; Shift+Tab on the first wraps to the last; Escape closes.
const onPanelKeydown = (e) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    closeMobile()
    return
  }
  if (e.key !== 'Tab') return
  const panel = panelRef.value
  if (!panel) return
  const focusables = Array.from(
    panel.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null || el === document.activeElement)
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement
  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

const handleEscapeGlobal = (e) => {
  if (e.key === 'Escape' && mobileOpen.value) {
    closeMobile()
  }
}

// Handle scroll event
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

// Close the drawer whenever the route changes (covers submenu navigations
// triggered from inside the dropdowns, which don't fire a top-level click
// on the panel's direct children).
let removeAfterEach = null

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('keydown', handleEscapeGlobal)
  removeAfterEach = routerSafe?.afterEach(() => {
    if (mobileOpen.value) closeMobile()
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('keydown', handleEscapeGlobal)
  removeAfterEach?.()
})
</script>

<style scoped>
.nav {
  position: fixed;
  inset: 0 auto auto 0;
  right: 0;
  top: 0;
  z-index: var(--z-nav);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 4rem;
  background: var(--surface-card);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--accent-cyan-alpha-20);
  transition: all 0.3s ease;
}

.nav.scrolled {
  padding: 1rem 4rem;
  box-shadow: 0 4px 20px var(--accent-cyan-alpha-10);
}

.nav-logo {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.1em;
  text-decoration: none;
  transition: color 0.3s ease;
  text-shadow: 0 0 10px transparent;
}

.nav-logo:hover {
  color: var(--cyan);
  text-shadow: 0 0 20px var(--cyan);
}

.nav-logo .accent {
  color: var(--cyan);
  text-shadow: 0 0 20px var(--cyan);
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  align-items: center;
  margin: 0;
  padding: 0;
}

/* #190: the dialog wrapper is layout-invisible on desktop (display:contents)
   so the <ul> participates in the nav's flex row exactly as before. On mobile
   the media query below repurposes this wrapper as the positioned slide-in
   panel (the off-canvas transform + background move here from .nav-links). */
.nav-mobile-dialog {
  display: contents;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  position: relative;
  padding: 0.25rem 0;
}

.nav-links a:hover,
.nav-links a:focus {
  color: var(--cyan);
  outline: none;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--cyan);
  transition: width 0.3s ease;
}

.nav-links a:hover::after,
.nav-links a:focus::after,
.nav-links a.router-link-active::after {
  width: 100%;
}

.nav-links a.router-link-active {
  color: var(--cyan);
}

/* Toolbar: language + theme toggles injected by App.vue via the #toolbar
 * slot. Sits on the right edge of the nav, always visible (including on
 * mobile, where it stays beside the hamburger instead of entering the
 * off-canvas drawer). */
.nav-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

/* Mobile hamburger toggle: hidden on desktop, flex on mobile.
 * #190 R1: height raised from 22px to 24px to satisfy WCAG 2.5.8 "Target Size
 * (Minimum)" — Lighthouse measured the rendered hit target at 22.6 x 22px,
 * below the 24 x 24px minimum. The 3 aria-hidden bars use flex
 * space-between (3px each = 9px total), so a 24px height still yields a
 * ~7.5px gap between bars — visually unchanged on mobile (this rule is
 * display:none on desktop).
 * #190 R4: flex-shrink: 0 added — .nav is display:flex (justify-content:
 * space-between), so .nav-toggle is a flex child. Flex items default to
 * flex-shrink:1, which let the container squeeze the declared 28px width
 * down to a RENDERED 22.6px (coordinator Lighthouse re-measurement), still
 * failing the 24x24 target-size minimum on the WIDTH axis despite the
 * declaration. flex-shrink:0 makes the parent honor the declared width. */
.nav-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  width: 28px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}

.nav-toggle-bar {
  display: block;
  width: 100%;
  height: 3px;
  background: var(--cyan, var(--cyan));
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.nav-toggle:focus {
  outline: 2px solid var(--cyan, var(--cyan));
  outline-offset: 4px;
}

/* Media queries cannot reference CSS variables (not resolved at parse
 * time), so the literal mirrors src/constants/breakpoints.js
 * MOBILE_BREAKPOINT / --breakpoint-mobile. Keep these in sync. */
@media (max-width: 768px) {
  .nav {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  /* Off-canvas nav (#190): the slide-in panel is now the .nav-mobile-dialog
     wrapper (which owns role=dialog). It carries the absolute positioning +
     transform + background; the <ul> inside keeps a plain column layout. */
  .nav-mobile-dialog {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    padding: 1.5rem;
    background: var(--surface-card);
    border-bottom: 1px solid var(--accent-cyan-alpha-20);
    transform: translateX(110%);
    transition: transform 0.3s ease;
    backdrop-filter: blur(20px);
  }

  .nav-mobile-dialog.mobile-open {
    transform: translateX(0);
  }

  .nav-links {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .nav-toggle {
    display: flex;
  }
}
</style>
