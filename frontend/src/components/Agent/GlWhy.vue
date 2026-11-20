<template>
  <!-- GrowUp (zadání 2027 E3): rozbalitelné „Proč“ (důvod výběru firmy / návrhu agenta). grid-template-rows 0fr → 1fr za 220 ms -->
  <section class="gl-why" :class="{ 'gl-why-open': isOpen }">
    <button type="button" class="gl-why-head" :aria-expanded="isOpen" :aria-controls="id" @click="toggle">
      <GlIcon name="spark" :size="16" class="shrink-0 text-[var(--accent-700)]" />
      <span class="gl-why-title">{{ title || __('Proč tahle firma') }}</span>
      <span v-if="score != null" class="gl-why-score num">{{ __('skóre') }} {{ score }}</span>
      <GlIcon name="down" :size="16" class="gl-why-chev ml-auto shrink-0" />
    </button>
    <div :id="id" class="gl-why-body" :inert="isOpen ? undefined : true">
      <div class="gl-why-inner">
        <ul v-if="reasons.length" class="gl-why-list">
          <li v-for="(r, i) in reasons" :key="i">{{ r }}</li>
        </ul>
        <p v-else class="gl-why-empty">{{ empty || __('Důvod výběru není zapsaný.') }}</p>
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { computed, ref, watch } from 'vue'

// reasons: odrážky; score: číslo skóre (volitelné); title: nadpis (výchozí „Proč tahle firma“);
// open: v-model:open (volitelné řízení zvenku), defaultOpen: počáteční stav bez v-model; empty: text bez důvodů
const props = defineProps({
  reasons: { type: Array, default: () => [] },
  score: { type: [Number, String], default: null },
  title: { type: String, default: '' },
  open: { type: Boolean, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  empty: { type: String, default: '' },
})
const emit = defineEmits(['update:open'])
const inner = ref(props.defaultOpen)
const isOpen = computed(() => (props.open === undefined ? inner.value : props.open))
const id = `gl-why-${Math.random().toString(36).slice(2, 8)}`
function toggle() {
  const v = !isOpen.value
  inner.value = v
  emit('update:open', v)
}
watch(() => props.defaultOpen, (v) => (inner.value = v))
</script>

<style scoped>
.gl-why { background: var(--accent-50, rgba(91, 91, 246, 0.07)); border-radius: 16px; }
.gl-why-head { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; padding: 0 16px; border: 0; background: transparent; text-align: left; cursor: pointer; border-radius: 16px; font-size: 15px; font-weight: 650; color: var(--text-1); }
.gl-why-head:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-why-score { font-size: 13px; font-weight: 600; color: var(--accent-700); background: var(--accent-soft); border-radius: 999px; padding: 2px 10px; }
.gl-why-chev { transition: transform var(--t-panel, 220ms) var(--ease-panel, ease); }
.gl-why-open .gl-why-chev { transform: rotate(180deg); }
.gl-why-body { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows var(--t-panel, 220ms) var(--ease-panel, ease), visibility 0s linear var(--t-panel, 220ms); }
.gl-why-open .gl-why-body { grid-template-rows: 1fr; visibility: visible; transition: grid-template-rows var(--t-panel, 220ms) var(--ease-panel, ease), visibility 0s; }
.gl-why-inner { min-height: 0; overflow: hidden; padding: 0 16px; }
.gl-why-open .gl-why-inner { padding-bottom: 14px; }
.gl-why-list { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: var(--text-2); }
.gl-why-list li { margin: 2px 0; }
.gl-why-empty { margin: 0; font-size: 14px; color: var(--text-2); }
@media (prefers-reduced-motion: reduce) {
  .gl-why-body, .gl-why-chev { transition: none !important; }
}
</style>
