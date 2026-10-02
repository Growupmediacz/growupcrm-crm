// GrowUp (design 2. kolo, oprava 18): ikona a barva oznámení podle typu (úkol, schůzka, hovor, e-mail, výhra, přiřazení, zmínka)
export const KINDS = {
  task: { icon: 'check', tone: 'bg-[rgba(234,170,8,.18)] text-[#7a4400]' },
  event: { icon: 'cal', tone: 'bg-[rgba(59,110,246,.13)] text-[#1f48b8]' },
  call: { icon: 'phone', tone: 'bg-[rgba(249,115,22,.14)] text-[#a3360a]' },
  email: { icon: 'mail', tone: 'bg-[rgba(20,160,190,.13)] text-[#08626f]' },
  won: { icon: 'star', tone: 'bg-[rgba(34,179,94,.14)] text-[#0f6b32]' },
  assign: { icon: 'brief', tone: 'bg-[rgba(79,70,229,.1)] text-[#3b30b8]' },
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
