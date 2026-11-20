// GrowUp: sdílené věci modulu Outreach (barvy stavů kontaktu v kampani, avatary, formáty).
import { call } from 'frappe-ui'

// Stavy kontaktu v kampani (tokeny --cst-* z designu)
export const CONTACT_STATUS = {
  'Čeká': 'var(--stage-prohrano)',
  'Odesláno': 'var(--stage-nova)',
  'Otevřeno': 'var(--stage-kontaktovano)',
  'Klikl': 'var(--c-cyan-500)',
  'Odpověděl': 'var(--stage-vyhrano)',
  'Odhlášen': 'var(--overdue)',
  'Dokončeno': 'var(--accent-700)',
}

// Třídění odpovědí: štítek + barvy
export const REPLY_LABEL = {
  'Zájem': 'bg-[color-mix(in_srgb,var(--stage-vyhrano)_16%,transparent)] text-[var(--success)]',
  'Později': 'bg-[color-mix(in_srgb,var(--stage-nabidka)_20%,transparent)] text-[var(--warning)]',
  'Automatická odpověď': 'bg-[color-mix(in_srgb,var(--c-cyan-600)_15%,transparent)] text-[var(--c-cyan-750)]',
  'Odmítnutí': 'bg-[color-mix(in_srgb,var(--c-red-550)_13%,transparent)] text-[var(--overdue)]',
}

const TONES = [
  ['var(--c-blue-50)', 'var(--c-blue-600)'], ['var(--c-green-100)', 'var(--success)'], ['var(--c-orange-100-2)', 'var(--c-orange-700)'], ['var(--c-violet-50-2)', 'var(--c-violet-550)'], ['var(--c-cyan-100)', 'var(--c-cyan-750)'],
]
export function avatarTone(name = '') {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const [bg, fg] = TONES[h % TONES.length]
  return { background: bg, color: fg }
}
export const initials = (s) =>
  (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

export const api = (method, args = {}) => call(`growupcrm.outreach.${method}`, args)

export function plain(html) {
  return new DOMParser().parseFromString(html || '', 'text/html').body.textContent || ''
}

// „včera“, „dnes 9:12“, „29. 9.“
export function whenLabel(v) {
  if (!v) return ''
  const d = new Date(String(v).replace(' ', 'T'))
  if (isNaN(d)) return ''
  const s = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((s(new Date()) - s(d)) / 86400000)
  if (diff === 0) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  if (diff === 1) return 'včera'
  return `${d.getDate()}. ${d.getMonth() + 1}.`
}
