// GrowUp: reakční doba na příchozí Zakázku (growupcrm.response_time) – texty pro detail, kartu a Analytiku.

// pracovní minuty → „25 min“, „2 h 10 min“, „3 h“
export function formatMinutes(min) {
  if (min === null || min === undefined) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

const timeFmt = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })
const toDate = (s) => new Date(String(s).replace(' ', 'T'))

function dueLabel(due) {
  const d = toDate(due)
  const today = new Date()
  const same = d.toDateString() === today.toDateString()
  return same ? timeFmt.format(d) : `${dayFmt.format(d)} ${timeFmt.format(d)}`
}

// stav reakce pro štítek: { tone: 'ok' | 'warn' | 'late', text, title }
export function responseBadge(doc) {
  const state = doc?.gl_response_state
  if (!state) return null
  if (state === 'Čeká') {
    const overdue = doc.gl_response_due && toDate(doc.gl_response_due) < new Date()
    return overdue
      ? { tone: 'late', text: __('Bez odpovědi po termínu'), title: __('Měla dostat odpověď do {0}', [dueLabel(doc.gl_response_due)]) }
      : { tone: 'warn', text: __('Odpovědět do {0}', [dueLabel(doc.gl_response_due)]), title: __('Lhůta na první odpověď (e-mail, hovor nebo posun stavu)') }
  }
  const took = formatMinutes(doc.gl_response_minutes)
  return state === 'V termínu'
    ? { tone: 'ok', text: __('Odpověď za {0}', [took]), title: __('Odpovězeno v termínu (pracovní čas)') }
    : { tone: 'late', text: __('Odpověď za {0}', [took]), title: __('Odpovězeno po termínu (pracovní čas)') }
}

export const BADGE_TONE = {
  ok: 'bg-[color-mix(in_srgb,var(--stage-vyhrano)_13%,transparent)] text-[var(--c-green-700)]',
  warn: 'bg-[color-mix(in_srgb,var(--stage-nabidka)_16%,transparent)] text-[var(--warning)]',
  late: 'bg-[color-mix(in_srgb,var(--c-red-400)_13%,transparent)] text-[var(--overdue)]',
}
