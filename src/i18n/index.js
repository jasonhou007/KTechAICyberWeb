/**
 * i18n barrel module.
 *
 * Re-exports the language composable + initializer so the rest of the app can
 * import from '@/i18n' (or './i18n' / '../i18n') regardless of where the
 * implementation lives. Keeps the import surface stable.
 */
export { useLanguage, initLanguage } from '../composables/useLanguage.js'
