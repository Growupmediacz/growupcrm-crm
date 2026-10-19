import { toast } from 'frappe-ui'

// GrowUp: české názvy typů záznamů pro texty v UI (mazání, propojené záznamy).
// [1. pád, 4. pád]; neznámý typ: název bez předpony CRM/FCRM.
const NAMES = {
  'CRM Organization': ['Firma', 'firmu'],
  'CRM Lead': ['Zakázka', 'zakázku'],
  'CRM Deal': ['Obchod', 'obchod'],
  Contact: ['Kontakt', 'kontakt'],
  'CRM Task': ['Úkol', 'úkol'],
  'FCRM Note': ['Zápis', 'zápis'],
  'CRM Call Log': ['Hovor', 'hovor'],
  Event: ['Událost', 'událost'],
  'GrowUp Branch': ['Pobočka', 'pobočku'],
  'GrowUp Project': ['Projekt', 'projekt'],
  'GrowUp Retainer': ['Retainer', 'retainer'],
  Communication: ['E-mail', 'e-mail'],
  'CRM Notification': ['Upozornění', 'upozornění'],
}

const plain = (doctype) => __((doctype || '').replace(/^(CRM|FCRM)\s*/, ''))

export const doctypeName = (doctype) => NAMES[doctype]?.[0] || plain(doctype)
export const doctypeAccusative = (doctype) => NAMES[doctype]?.[1] || plain(doctype).toLowerCase()

// Výsledek growupcrm.deletion: {done, failed: [{doctype, docname, error}]} → upozornění, co se nesmazalo a proč
export function showDeleteFailures(res) {
  const failed = res?.failed || []
  if (!failed.length) return
  const first = failed[0]
  toast.error(
    __('Některé záznamy se nepodařilo zpracovat ({0}). {1} {2}: {3}', [
      failed.length,
      doctypeName(first.doctype),
      first.docname,
      first.error,
    ]),
  )
}
