// GrowUp (design 2. kolo, oprava 18): ikona a barva oznámení podle typu (úkol, schůzka, hovor, e-mail, výhra, přiřazení, zmínka)
export const KINDS = {
  task: { icon: 'check', tone: 'bg-[color-mix(in_srgb,var(--c-amber-550)_18%,transparent)] text-[var(--warning)]' },
  event: { icon: 'cal', tone: 'bg-[color-mix(in_srgb,var(--c-blue-400)_13%,transparent)] text-[var(--info)]' },
  call: { icon: 'phone', tone: 'bg-[color-mix(in_srgb,var(--stage-jednani)_14%,transparent)] text-[var(--c-orange-650)]' },
  email: { icon: 'mail', tone: 'bg-[color-mix(in_srgb,var(--c-cyan-600)_13%,transparent)] text-[var(--c-cyan-750)]' },
  won: { icon: 'star', tone: 'bg-[color-mix(in_srgb,var(--stage-vyhrano)_14%,transparent)] text-[var(--success)]' },
  assign: { icon: 'brief', tone: 'bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[var(--accent-700)]' },
  mention: { icon: 'reply', tone: 'bg-[color-mix(in_srgb,var(--c-tint)_12%,transparent)] text-[var(--c-blue-650)]' },
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
