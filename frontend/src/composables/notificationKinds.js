// GrowUp (design 2. kolo, oprava 18): ikona a barva oznámení podle typu (úkol, schůzka, hovor, e-mail, výhra, přiřazení, zmínka)
export const KINDS = {
  task: { icon: 'check', tone: 'bg-[rgba(234,170,8,.18)] text-[#915200]' },
  event: { icon: 'cal', tone: 'bg-[rgba(59,110,246,.13)] text-[#2e5bd8]' },
  call: { icon: 'phone', tone: 'bg-[rgba(249,115,22,.14)] text-[#c2410c]' },
  email: { icon: 'mail', tone: 'bg-[rgba(20,160,190,.13)] text-[#0b7488]' },
  won: { icon: 'star', tone: 'bg-[rgba(34,179,94,.14)] text-[#15803d]' },
  assign: { icon: 'brief', tone: 'bg-[rgba(79,70,229,.1)] text-[#4338ca]' },
  mention: { icon: 'reply', tone: 'bg-[rgba(110,120,200,.12)] text-[#4a5173]' },
}

export function kindOf(n) {
  const text = (n.notification_text || '').toLowerCase()
  if (n.notification_type_doctype === 'Event' || n.reference_doctype === 'Event') return KINDS.event
  if (n.type === 'Task' || n.notification_type_doctype === 'CRM Task') return KINDS.task
  if (n.notification_type_doctype === 'CRM Call Log') return KINDS.call
  if (text.includes('vyhr')) return KINDS.won
  if (n.type === 'Assignment') return KINDS.assign
  if (n.notification_type_doctype === 'Communication') return KINDS.email
  return KINDS.mention
}
