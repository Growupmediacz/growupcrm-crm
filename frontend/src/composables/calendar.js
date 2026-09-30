// GrowUpCRM: kalendář (stránka /calendar). Vlastní pohledy místo komponenty
// Calendar z frappe-ui: ta je natvrdo anglická, týden začíná nedělí a čas je 12h.
// Data dodává growupcrm.calendar (Eventy jako bloky, úkoly jako body v čase).
import { call } from 'frappe-ui'

export const HOUR_HEIGHT = 48
export const LIST_DAYS = 14

export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

// Týden začíná pondělím.
export function startOfWeek(d) {
  return addDays(startOfDay(d), -((d.getDay() + 6) % 7))
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function pad(n) {
  return String(n).padStart(2, '0')
}

export function isoDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isoDateTime(d) {
  return `${isoDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

export function parseServerDate(s) {
  return new Date(String(s).replace(' ', 'T').split('.')[0])
}

export function timeLabel(d) {
  return `${d.getHours()}:${pad(d.getMinutes())}`
}

const LOCALE = 'cs-CZ'

export function monthYearLabel(d) {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' }).format(d)
}

export function dayLabel(d) {
  const label = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function weekdayShort(d) {
  return new Intl.DateTimeFormat(LOCALE, { weekday: 'short' }).format(d)
}

export function rangeLabel(days) {
  const a = days[0]
  const b = days[days.length - 1]
  if (days.length === 1) return dayLabel(a)
  const f = (d, opts) => new Intl.DateTimeFormat(LOCALE, opts).format(d)
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}.–${b.getDate()}. ${f(b, { month: 'long', year: 'numeric' })}`
  return `${f(a, { day: 'numeric', month: 'short' })} – ${f(b, { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function getRange(view, anchor) {
  if (view === 'day') return { start: startOfDay(anchor), end: startOfDay(anchor) }
  if (view === 'week') {
    const s = startOfWeek(anchor)
    return { start: s, end: addDays(s, 6) }
  }
  // seznam: dva týdny od zvoleného dne (na mobilu je to „co mě čeká“)
  if (view === 'list') return { start: startOfDay(anchor), end: addDays(startOfDay(anchor), LIST_DAYS - 1) }
  // měsíc: celý měsíc, mřížka navíc doplňuje týdny
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  return { start: startOfWeek(first), end: addDays(startOfWeek(last), 6) }
}

export function daysBetween(start, end) {
  const out = []
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d)
  return out
}

// Barvy: Eventy modře, úkoly podle priority, hotové úkoly šedě.
export function itemClasses(item) {
  if (item.kind === 'event')
    return 'bg-surface-blue-2 text-ink-blue-7 border-outline-blue-1 hover:bg-surface-blue-3'
  if (item.done) return 'bg-surface-gray-2 text-ink-gray-5 border-outline-gray-2 line-through'
  if (item.priority === 'High') return 'bg-surface-red-2 text-ink-red-7 border-outline-red-1 hover:bg-surface-red-3'
  if (item.priority === 'Medium') return 'bg-surface-amber-2 text-ink-amber-7 border-outline-amber-1 hover:bg-surface-amber-3'
  return 'bg-surface-gray-2 text-ink-gray-7 border-outline-gray-2 hover:bg-surface-gray-3'
}

export function toItems({ events = [], tasks = [] }) {
  const items = []
  for (const e of events) {
    const start = parseServerDate(e.starts_on)
    const end = e.ends_on ? parseServerDate(e.ends_on) : start
    items.push({
      key: `event-${e.name}`,
      kind: 'event',
      name: e.name,
      title: e.subject,
      start,
      end,
      allDay: Boolean(e.all_day),
      assignedTo: e.assigned_to,
      leadName: e.reference_doctype === 'CRM Lead' ? e.reference_docname : null,
      leadTitle: e.lead_title,
      description: e.description,
      canEdit: Boolean(e.can_edit),
      raw: e,
    })
  }
  for (const t of tasks) {
    const start = parseServerDate(t.due_date)
    items.push({
      key: `task-${t.name}`,
      kind: 'task',
      name: t.name,
      title: t.title,
      start,
      end: start,
      allDay: false,
      status: t.status,
      priority: t.priority,
      done: t.status === 'Done',
      assignedTo: t.assigned_to || t.owner,
      leadName: t.reference_doctype === 'CRM Lead' ? t.reference_docname : null,
      leadTitle: t.lead_title,
      raw: t,
    })
  }
  return items.sort((a, b) => a.start - b.start)
}

// Položka zasahuje do dne, pokud se její interval protíná s [den, den+1).
export function itemsOnDay(items, day) {
  const s = startOfDay(day)
  const e = addDays(s, 1)
  return items.filter((i) => i.start < e && (i.end > s || sameDay(i.start, s)))
}

export function fetchCalendar(start, end, scope) {
  return call('growupcrm.calendar.get_calendar', {
    start: isoDate(start),
    end: isoDate(end),
    scope,
  })
}

// Česká číslovka: 1 schůzka, 2–4 schůzky, 0 a 5+ schůzek.
export function pluralMeetings(n) {
  if (n === 1) return `${n} schůzka`
  if (n >= 2 && n <= 4) return `${n} schůzky`
  return `${n} schůzek`
}
