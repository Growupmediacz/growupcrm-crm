// GrowUp (design 3. kolo): barva akcentu klienta (Nastavení → Značka, FCRM Settings.growupcrm_accent).
// Z jedné barvy dopočítá odstíny přes color-mix a nastaví je na :root (přebije gl3.css).
export const ACCENTS = ['#5B5BF6', '#2E6BE6', '#8B5CF6', '#0E9F8E', '#1E9E58', '#E8590C']
export const DEFAULT_ACCENT = ACCENTS[0]

export function applyAccent(color) {
  const c = /^#[0-9a-f]{6}$/i.test(color || '') ? color : DEFAULT_ACCENT
  const root = document.documentElement.style
  const mix = (other, pct) => `color-mix(in srgb, ${c} ${pct}%, ${other})`
  root.setProperty('--accent-600', c)
  root.setProperty('--accent-700', mix('black', 84))
  root.setProperty('--accent-900', mix('black', 55))
  root.setProperty('--accent-400', mix('white', 65))
  root.setProperty('--accent-200', mix('white', 32))
  root.setProperty('--accent-50', mix('white', 9))
  root.setProperty('--accent-soft', mix('transparent', 12))
  root.setProperty('--focus-ring', `0 0 0 4px ${mix('transparent', 18)}`)
  root.setProperty('--brand-grad', `linear-gradient(145deg, ${mix('white', 85)} 0%, ${c} 55%, ${mix('black', 84)} 100%)`)
}
