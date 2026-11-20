// GrowUp (zadání 2027 E2): body zlomu z jednoho místa, reaktivně (přepne se i při otočení a změně šířky okna).
// Telefon < 768 px, úzký desktop 768–1099 px, plný desktop ≥ 1100 px (DESIGN-ZADANI 1.5; dřív 640 v App.vue a 768 v router.js).
import { computed, readonly, ref } from 'vue'

export const PHONE_MAX = 768
export const WIDE_MIN = 1100

const width = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)

if (typeof window !== 'undefined') {
  let frame = 0
  const update = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => (width.value = window.innerWidth))
  }
  window.addEventListener('resize', update, { passive: true })
  window.addEventListener('orientationchange', update, { passive: true })
}

export const viewportWidth = readonly(width)
export const isPhone = computed(() => width.value < PHONE_MAX)
export const isNarrow = computed(() => width.value >= PHONE_MAX && width.value < WIDE_MIN)
export const isWide = computed(() => width.value >= WIDE_MIN)

export function useGlBreakpoint() {
  return { width: viewportWidth, isPhone, isNarrow, isWide }
}
