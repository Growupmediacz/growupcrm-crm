<template>
  <!-- GrowUp (zadání 2027 E2): spodní panel na telefonu (změna fáze, nabídky, krátké dialogy).
       Tažení dolů / klepnutí do ztmavení / Esc zavře; zachycený fokus a návrat fokusu; bezpečná zóna dole.
       Výška: obsah, nejvýš 92 % (size="full" = 92 % vždy). Pohyb 280 ms --ease-panel, prefers-reduced-motion bez pohybu. -->
  <Teleport to="body">
    <Transition name="gl-sheet">
      <div v-if="open" class="gl-sheet-wrap" @keydown.esc.stop="close" @keydown.tab="trap">
        <div class="gl-sheet-scrim" aria-hidden="true" @click="close" />
        <div
          ref="panel"
          class="gl-sheet"
          :class="size === 'full' && 'is-full'"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? uid : undefined"
          :aria-label="title ? undefined : ariaLabel"
          tabindex="-1"
        >
          <div class="gl-sheet-hd" v-on="drag.handlers">
            <div class="gl-sheet-grab" aria-hidden="true" />
            <div v-if="title || $slots.header" class="gl-sheet-title">
              <slot name="header"><h2 :id="uid">{{ title }}</h2></slot>
              <button type="button" class="gl-sheet-x" :aria-label="__('Zavřít')" @click="close"><GlIcon name="x" :size="20" /></button>
            </div>
          </div>
          <div class="gl-sheet-body"><slot :close="close" /></div>
          <div v-if="$slots.footer" class="gl-sheet-ft"><slot name="footer" :close="close" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { useSheetDrag } from '@/composables/glSheetDrag'
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  size: { type: String, default: 'auto' }, // auto | full
})
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['close'])
const uid = `gl-sheet-${Math.random().toString(36).slice(2, 8)}`
const panel = ref(null)
let returnFocus = null

function close() {
  open.value = false
  emit('close')
}
const drag = useSheetDrag(panel, close)

watch(open, async (v) => {
  if (v) {
    returnFocus = document.activeElement
    await nextTick()
    const first = panel.value?.querySelector('button:not(.gl-sheet-x), [href], input, select, textarea')
    ;(first || panel.value)?.focus()
  } else if (returnFocus?.focus) {
    returnFocus.focus()
    returnFocus = null
  }
})

function trap(e) {
  const nodes = [...(panel.value?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [])].filter(
    (n) => !n.disabled && n.offsetParent !== null,
  )
  if (!nodes.length) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
</script>
<style scoped>
.gl-sheet-wrap { position: fixed; inset: 0; z-index: 90; }
.gl-sheet-scrim { position: absolute; inset: 0; background: var(--scrim); }
.gl-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  max-height: 92dvh;
  border-radius: 28px 28px 0 0;
  background: var(--mat-dialog);
  backdrop-filter: var(--mat-blur);
  box-shadow: var(--mat-sheet-shadow);
  outline: none;
  will-change: transform;
}
.gl-sheet.is-full { height: 92dvh; }
.gl-sheet-hd { flex: none; touch-action: none; cursor: grab; padding-top: 8px; }
.gl-sheet-grab { width: 40px; height: 5px; border-radius: 3px; background: var(--text-2); opacity: 0.4; margin: 0 auto; }
.gl-sheet-title { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 20px; }
.gl-sheet-title h2 { flex: 1; min-width: 0; font-size: 20px; font-weight: 650; color: var(--text-1, inherit); }
.gl-sheet-x { display: grid; place-items: center; width: var(--hit); height: var(--hit); border-radius: 14px; }
.gl-sheet-x:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-sheet-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 4px 16px 16px; }
.gl-sheet-ft { flex: none; padding: 8px 16px calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); }
.gl-sheet-body:last-child { padding-bottom: calc(16px + env(safe-area-inset-bottom)); }

.gl-sheet-enter-active, .gl-sheet-leave-active { transition: opacity var(--t-sheet) var(--ease-panel); }
.gl-sheet-enter-active .gl-sheet, .gl-sheet-leave-active .gl-sheet { transition: transform var(--t-sheet) var(--ease-panel); }
.gl-sheet-enter-from, .gl-sheet-leave-to { opacity: 0; }
.gl-sheet-enter-from .gl-sheet, .gl-sheet-leave-to .gl-sheet { transform: translateY(100%); }
@media (prefers-reduced-motion: reduce) {
  .gl-sheet-enter-active, .gl-sheet-leave-active, .gl-sheet-enter-active .gl-sheet, .gl-sheet-leave-active .gl-sheet { transition: none; }
}
</style>
