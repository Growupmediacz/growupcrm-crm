<template>
  <!-- GrowUp (zadání 2027 E3): koncová fáze (Vyhráno, Prohráno) sbalená do úzkého pruhu ~64 px.
       Klik nebo Enter ji rozbalí. Pruh přijme přetaženou kartu: nad ním leží neviditelný seznam vuedraggable
       (stejná skupina „fields“), který je klikatelný jen při tažení, jinak nepřekáží tlačítku. -->
  <div
    class="gl3-lane gl-kcol-strip relative flex flex-col items-stretch"
    :class="{ 'gl-kcol-strip-drop': dragging }"
    :style="{ '--lane': color }"
  >
    <button
      type="button"
      class="gl-kcol-btn flex h-full min-h-[360px] w-full flex-col items-center gap-2.5 px-0 py-3"
      :aria-label="`${__(column.column.name)}, ${count}, ${__('rozbalit')}`"
      :title="__('Rozbalit')"
      @click="emit('expand')"
    >
      <span class="size-3 shrink-0 rounded-full bg-[var(--lane)]" aria-hidden="true" />
      <span class="gl-kcol-vert text-[15px] font-semibold tracking-[-0.01em] text-ink-gray-9">
        {{ __(column.column.name) }}
        <span class="num font-medium text-ink-gray-5">{{ count }}</span>
      </span>
      <span v-if="sumText" class="gl-kcol-vert num text-[13px] text-ink-gray-5">{{ sumText }}</span>
    </button>
    <!-- cíl pro přetažení karty -->
    <Draggable
      :list="column.data"
      group="fields"
      item-key="name"
      class="gl-kcol-drop"
      :class="dragging ? 'gl-kcol-drop-on' : ''"
      :data-column="column.column.name"
      :animation="0"
      ghost-class="gl3-kghost"
      @end="(e) => emit('end', e)"
    >
      <template #item="{ element }">
        <div class="hidden" :data-name="element.name" aria-hidden="true" />
      </template>
    </Draggable>
    <span v-if="dragging" class="gl-kcol-hint pointer-events-none" aria-hidden="true">{{ __('Pustit sem') }}</span>
  </div>
</template>
<script setup>
import Draggable from 'vuedraggable'
import { computed } from 'vue'

const props = defineProps({
  column: { type: Object, required: true },
  color: { type: String, default: 'var(--stage-prohrano)' },
  dragging: { type: Boolean, default: false },
})
const emit = defineEmits(['expand', 'end'])

const count = computed(() => props.column.column.all_count ?? props.column.data?.length ?? 0)
const sumText = computed(() => {
  const s = props.column.column.sum
  if (s === undefined || s === null) return ''
  if (s >= 1e6) return `${(s / 1e6).toFixed(1).replace('.', ',')} mil.`
  if (s >= 1000) return `${Math.round(s / 1000)} tis.`
  return `${s} Kč`
})
</script>
<style>
.gl-kcol-vert {
  writing-mode: vertical-rl;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.gl-kcol-btn {
  cursor: pointer;
  background: transparent;
  border-radius: var(--r-panel);
  transition: background-color var(--t-fast, 120ms);
}
.gl-kcol-btn:hover {
  background: rgba(255, 255, 255, 0.9);
}
.gl-kcol-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
/* seznam pro drop: mimo tažení nereaguje na myš, při tažení pokryje celý pruh */
.gl-kcol-drop {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
}
.gl-kcol-drop-on {
  pointer-events: auto;
}
.gl-kcol-strip-drop {
  outline: 2px dashed var(--accent-400);
  outline-offset: -2px;
  background: var(--accent-soft);
}
.gl-kcol-hint {
  position: absolute;
  inset: auto 0 12px 0;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-700);
}
@media (prefers-reduced-motion: reduce) {
  .gl-kcol-btn {
    transition: none;
  }
}
</style>
