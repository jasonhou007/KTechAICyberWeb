/**
 * @file terminalCommands.js
 * @description Command registry for the AI Neural Terminal (#161).
 *
 * Single source of truth for every command the console understands. Each entry
 * declares a canonical `name` (the string the user types), the i18n key that
 * holds its localized response, and three optional flags:
 *   - easterEgg : true  -> triggers the neural "burst" feedback when run
 *   - isClear   : true  -> empties the output buffer instead of printing
 *   - hidden    : true  -> omitted from the `help` enumeration
 *
 * The `help` command enumerates `name` for every non-hidden entry, so adding a
 * new public command here is all that's required for it to show up in help and
 * autocomplete. Commands themselves stay English (they're the protocol); the
 * RESPONSE text is localized via the i18n key.
 *
 * @ticket #161
 */

export const terminalCommands = [
  // --- public commands (enumerated by `help`) ---
  {
    name: 'help',
    i18nKey: 'terminal.commands.help.response',
  },
  {
    name: 'about',
    i18nKey: 'terminal.commands.about.response',
  },
  {
    name: 'services',
    i18nKey: 'terminal.commands.services.response',
  },
  {
    name: 'ai',
    i18nKey: 'terminal.commands.ai.response',
  },
  {
    name: 'news',
    i18nKey: 'terminal.commands.news.response',
  },
  {
    name: 'contact',
    i18nKey: 'terminal.commands.contact.response',
  },
  {
    name: 'clear',
    i18nKey: 'terminal.commands.clear.response',
    isClear: true,
  },

  // --- easter eggs (hidden from help) ---
  {
    name: 'sudo',
    i18nKey: 'terminal.commands.sudo.response',
    easterEgg: true,
    hidden: true,
  },
  {
    name: 'coffee',
    i18nKey: 'terminal.commands.coffee.response',
    easterEgg: true,
    hidden: true,
  },
  {
    name: 'hackplanet',
    i18nKey: 'terminal.commands.hackplanet.response',
    easterEgg: true,
    hidden: true,
    // The AC/help copy reads "hack the planet"; accept the spaced phrase as an
    // alias so typing it verbatim also triggers the easter egg (N-1).
    aliases: ['hack the planet'],
  },
  {
    name: 'konami',
    i18nKey: 'terminal.commands.konami.response',
    easterEgg: true,
    hidden: true,
  },
]

/**
 * Look up a command by canonical name OR alias (case-insensitive).
 * @param {string} name
 * @returns {object|undefined}
 */
export function findCommand(name) {
  if (!name) return undefined
  const lower = String(name).toLowerCase()
  return terminalCommands.find((cmd) => {
    if (cmd.name.toLowerCase() === lower) return true
    // Allow alternate spellings / phrases (e.g. 'hack the planet' for hackplanet).
    if (Array.isArray(cmd.aliases)) {
      return cmd.aliases.some((a) => a.toLowerCase() === lower)
    }
    return false
  })
}

/**
 * Commands surfaced in `help` and the mobile chip palette — every public
 * (non-hidden) command, in registry order.
 */
export function visibleCommands() {
  return terminalCommands.filter((cmd) => !cmd.hidden)
}
