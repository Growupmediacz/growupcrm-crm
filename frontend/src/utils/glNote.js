// GrowUp (design 3. kolo, Zápisy 14): obsah zápisu rozdělený na sekce Cíl · Průběh · Závěr a „Další krok“.
// Zápis vzniká ze šablony <p><strong>Cíl:</strong> …</p> (doctypes/fcrm_note/form.js) nebo s nadpisy h1–h4.
// Když zápis strukturu nemá, vrátí jednu sekci bez nadpisu s původním HTML.
const HEADS = [
  { re: /^c[ií]l\b/i, label: 'Cíl' },
  { re: /^pr[uů]b[eě]h\b/i, label: 'Průběh' },
  { re: /^z[aá]v[eě]r\b/i, label: 'Závěr' },
  { re: /^dal[sš][ií] kr(o|ok)/i, label: 'Další krok', next: true },
]
const headOf = (text) => HEADS.find((h) => h.re.test(text.trim()))

export function parseNote(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  const sections = []
  let next = ''
  let cur = { label: '', nodes: [] }
  const push = () => {
    const body = cur.nodes.map((n) => n.outerHTML || n.textContent).join('')
    const plain = cur.nodes.map((n) => n.textContent).join('').trim()
    if (cur.next) next = next || plain
    else if (plain) sections.push({ label: cur.label, html: body })
  }
  for (const el of [...root.childNodes]) {
    const text = el.textContent || ''
    const strong = el.querySelector?.(':scope > strong, :scope > b')
    const isHeading = /^H[1-4]$/.test(el.nodeName)
    const head = (isHeading || (strong && text.trim().startsWith(strong.textContent.trim()))) && headOf(isHeading ? text : strong.textContent)
    if (head) {
      push()
      cur = { label: head.label, next: head.next, nodes: [] }
      // zbytek odstavce za „Cíl:“ patří do sekce
      if (!isHeading) {
        strong.remove()
        const rest = el.innerHTML.replace(/^\s*(:|&nbsp;)?\s*/, '')
        if (rest.replace(/<[^>]+>/g, '').trim()) {
          const p = doc.createElement('p')
          p.innerHTML = rest
          cur.nodes.push(p)
        }
      }
      continue
    }
    // „Další krok: …“ uvnitř Závěru
    const m = text.trim().match(/^dal[sš][ií] kroky?\s*:\s*(.+)$/is)
    if (m && cur.label === 'Závěr') {
      next = next || m[1].trim()
      continue
    }
    cur.nodes.push(el)
  }
  push()
  const structured = sections.some((s) => s.label)
  return { structured, sections: structured ? sections : [{ label: '', html }], next }
}
