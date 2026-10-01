// GrowUp: jednotný formát data a času (design 2. kolo, opravy 2 a 18).
// Datum vždy „1. 10. 2026“, ve formulářích s dnem v týdnu „čt 1. 10. 2026“, čas „9:00“ (bez nuly na začátku).
// V oznámeních a seznamech relativně („před 14 h“, „včera“) a krátce „1. 10.“ v aktuálním roce.

const WEEKDAYS_SHORT = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so']

export function toDate(v) {
  if (!v) return null
  if (v instanceof Date) return v
  const s = String(v)
  // „2026-10-01“ bez času = místní půlnoc (ne UTC)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date(s.replace(' ', 'T'))
  return isNaN(d) ? null : d
}

export function formatDateCz(v, { weekday = false, year = true } = {}) {
  const d = toDate(v)
  if (!d) return ''
  let s = `${d.getDate()}. ${d.getMonth() + 1}.`
  if (year) s += ` ${d.getFullYear()}`
  return weekday ? `${WEEKDAYS_SHORT[d.getDay()]} ${s}` : s
}

export function formatTimeCz(v) {
  const d = toDate(v)
  if (!d) return ''
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// „1. 10.“ v letošním roce, jinak „1. 10. 2025“
export function shortDateCz(v) {
  const d = toDate(v)
  if (!d) return ''
  return formatDateCz(d, { year: d.getFullYear() !== new Date().getFullYear() })
}

// Relativní čas: „právě teď“, „před 5 min“, „před 14 h“, „včera“, „před 3 dny“, pak „1. 10.“
export function relativeCz(v) {
  const d = toDate(v)
  if (!d) return ''
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 0) return shortDateCz(d)
  if (diff < 60) return __('právě teď')
  if (diff < 3600) return __('před {0} min', [Math.floor(diff / 60)])
  if (diff < 86400) return __('před {0} h', [Math.floor(diff / 3600)])
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((start(new Date()) - start(d)) / 86400000)
  if (days === 1) return __('včera')
  if (days < 7) return __('před {0} dny', [days])
  return shortDateCz(d)
}
