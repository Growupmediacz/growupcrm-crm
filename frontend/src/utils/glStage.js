// GrowUp (design 3. kolo): barva fáze podle tokenů. Přijme název barvy z CRM („blue“)
// nebo třídu z parseColor („!text-blue-600“).
const STAGE_HEX = {
  blue: 'var(--stage-nova)',
  purple: 'var(--stage-kontaktovano)',
  violet: 'var(--stage-kontaktovano)',
  yellow: 'var(--stage-nabidka)',
  amber: 'var(--stage-nabidka)',
  orange: 'var(--stage-jednani)',
  green: 'var(--stage-vyhrano)',
  red: 'var(--c-red-400-2)',
  pink: 'var(--c-pink-400)',
  cyan: 'var(--c-cyan-550)',
  teal: 'var(--c-teal-600)',
  gray: 'var(--stage-prohrano)',
  black: 'var(--text-1)',
}

export function stageHex(color) {
  const name = String(color || '').match(/(?:text-)?([a-z]+)(?:-\d+)?$/)?.[1]
  return STAGE_HEX[name] || STAGE_HEX.gray
}
