// GrowUp: sdílené věci modulu Outreach (barvy stavů kontaktu v kampani, avatary, formáty).
import { call } from 'frappe-ui'

// Stavy kontaktu v kampani (tokeny --cst-* z designu)
export const CONTACT_STATUS = {
  'Čeká': '#9CA3AF',
  'Odesláno': '#3B82F6',
  'Otevřeno': '#8B5CF6',
  'Odpověděl': '#22B35E',
  'Odhlášen': '#C8321F',
  'Dokončeno': '#4338CA',
}

// Třídění odpovědí: štítek + barvy
export const REPLY_LABEL = {
  'Zájem': 'bg-[rgba(34,179,94,.16)] text-[#15803d]',
  'Později': 'bg-[rgba(224,161,0,.2)] text-[#915200]',
  'Automatická odpověď': 'bg-[rgba(20,160,190,.15)] text-[#0b7488]',
  'Odmítnutí': 'bg-[rgba(200,50,31,.13)] text-[#c8321f]',
}

const TONES = [
  ['#dde6ff', '#2e4bb8'], ['#dcf5e6', '#15803d'], ['#ffe8d6', '#b45309'], ['#eadcff', '#6d3fd6'], ['#d9f1f6', '#0b7488'],
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
