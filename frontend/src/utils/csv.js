// GrowUp: jednoduchý parser CSV (uvozovky, středník nebo čárka, BOM), pro importy v prohlížeči.
export function parseCsv(text) {
  text = String(text).replace(/^﻿/, '')
  const first = text.split('\n')[0] || ''
  const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ','
  const out = []
  let row = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cur += '"'), i++
      else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) (row.push(cur), (cur = ''))
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cur)
      cur = ''
      if (row.some((x) => x.trim())) out.push(row)
      row = []
    } else cur += ch
  }
  row.push(cur)
  if (row.some((x) => x.trim())) out.push(row)
  return out
}

// automatické mapování sloupců podle názvů v záhlaví
export function guessColumn(header, re) {
  const i = header.findIndex((h) => re.test(String(h).toLowerCase()))
  return i >= 0 ? String(i) : ''
}
