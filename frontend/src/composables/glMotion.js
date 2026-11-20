// GrowUp (zadání 2027 kolo 2 V1): pohyb seznamů přes @formkit/auto-animate (MIT).
// Hodnoty = tokeny pohybu v styles/gl3.css (--t-base 180 ms, --ease-out). auto-animate sám respektuje
// prefers-reduced-motion (pak se nic nehýbe). Použití: <ul v-gl-animate> … </ul>
// nebo const [el, setEnabled] = useGlAnimate() – vypnout během tažení (Kanban).
import { createVAutoAnimate, useAutoAnimate } from '@formkit/auto-animate/vue'

export const GL_LIST_MOTION = { duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
export const vGlAnimate = createVAutoAnimate(GL_LIST_MOTION)
export const useGlAnimate = () => useAutoAnimate(GL_LIST_MOTION)

// Seznam, který jde vypnout (Kanban: během tažení řídí pohyb Sortable, auto-animate stojí).
// <Draggable v-gl-animate-when="!dragging"> … – false = vypnuto.
import autoAnimate from '@formkit/auto-animate'
export const vGlAnimateWhen = {
  mounted(el, binding) {
    el.__glAA = autoAnimate(el, GL_LIST_MOTION)
    if (binding.value === false) el.__glAA.disable()
  },
  updated(el, binding) {
    if (!el.__glAA || binding.value === binding.oldValue) return
    clearTimeout(el.__glAAt)
    // zapnout až po dojezdu animace Sortable (220 ms), aby puštěná karta nedostala druhý pohyb
    if (binding.value === false) el.__glAA.disable()
    else el.__glAAt = setTimeout(() => el.__glAA?.enable(), 260)
  },
}
