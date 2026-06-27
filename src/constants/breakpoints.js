/**
 * Shared responsive breakpoints.
 *
 * The magic `768` px value (mobile/desktop cutoff) used to be inlined in
 * NavigationDropdown.vue and Header.vue (4 occurrences: hover-gating logic
 * + media queries). Centralising it here + as the `--breakpoint-mobile`
 * CSS variable in variables.css keeps JS and CSS in sync (#164 review S3).
 */
export const MOBILE_BREAKPOINT = 768

/** True when the current viewport is at/below the mobile breakpoint. */
export const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT

/** True when the current viewport is above the mobile breakpoint (desktop). */
export const isDesktopViewport = () =>
  typeof window !== 'undefined' && window.innerWidth > MOBILE_BREAKPOINT
