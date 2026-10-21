// GrowUp (design 3. kolo): barva fáze podle tokenů. Přijme název barvy z CRM („blue“)
// nebo třídu z parseColor („!text-blue-600“).
const STAGE_HEX = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  violet: '#8b5cf6',
  yellow: '#e0a100',
  amber: '#e0a100',
  orange: '#f97316',
  green: '#22b35e',
  red: '#ef4444',
  pink: '#ec4899',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  gray: '#9ca3af',
  black: '#0e1330',
}

export function stageHex(color) {
  const name = String(color || '').match(/(?:text-)?([a-z]+)(?:-\d+)?$/)?.[1]
  return STAGE_HEX[name] || STAGE_HEX.gray
}
