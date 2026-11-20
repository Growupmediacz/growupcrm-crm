// GrowUp (zadání 2027 E2): tažení spodního panelu dolů (zavřít). Bez knihovny: vaul-vue by přinesl vlastní
// verzi reka-ui vedle té ve frappe-ui (dvě kopie Dialogu, zachycení fokusu by se praly), na jedno gesto to nestojí.
// Použití: const drag = useSheetDrag(panelRef, onClose); na úchyt/hlavičku v-on="drag.handlers".
// Pohyb jen transform; zavře při posunu > 25 % výšky nebo rychlém švihu dolů. prefers-reduced-motion: bez dojezdu.
import { onBeforeUnmount } from 'vue'

export function useSheetDrag(panelRef, onClose) {
  let startY = 0
  let lastY = 0
  let lastT = 0
  let velocity = 0
  let dragging = false
  let pointerId = null

  const el = () => panelRef.value?.$el || panelRef.value
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // klepnutí na tlačítko v hlavičce není tažení
    if (e.target.closest('button, a, input, textarea, [contenteditable="true"]')) return
    dragging = true
    pointerId = e.pointerId
    startY = lastY = e.clientY
    lastT = performance.now()
    velocity = 0
    e.currentTarget.setPointerCapture?.(pointerId)
    const node = el()
    if (node) node.style.transition = 'none'
  }
  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return
    const now = performance.now()
    velocity = (e.clientY - lastY) / Math.max(1, now - lastT)
    lastY = e.clientY
    lastT = now
    const dy = Math.max(0, e.clientY - startY)
    const node = el()
    if (node) node.style.transform = `translateY(${dy}px)`
  }
  function finish(e) {
    if (!dragging || (e && e.pointerId !== pointerId)) return
    dragging = false
    // pointerup nese poslední polohu i bez předchozího pointermove (rychlý švih)
    if (e && e.type === 'pointerup') lastY = e.clientY
    const node = el()
    if (!node) return
    const dy = Math.max(0, lastY - startY)
    const close = dy > node.offsetHeight * 0.25 || (velocity > 0.6 && dy > 24)
    node.style.transition = reduced() ? 'none' : 'transform var(--t-sheet) var(--ease-panel)'
    if (close) {
      node.style.transform = 'translateY(100%)'
      const done = () => onClose?.()
      reduced() ? done() : setTimeout(done, 200)
    } else {
      node.style.transform = ''
    }
  }

  onBeforeUnmount(() => (dragging = false))

  return {
    handlers: {
      pointerdown: onPointerDown,
      pointermove: onPointerMove,
      pointerup: finish,
      pointercancel: finish,
    },
  }
}
