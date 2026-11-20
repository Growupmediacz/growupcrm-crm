<template>
  <!-- GrowUp (zadání 2027 E3): plovoucí lišta hromadných akcí dole v obsahu (sticky, nepřekrývá konec stránky) -->
  <div class="gl-bulk" role="region" :aria-label="__('Hromadné akce')">
    <div class="gl-bulk-info">
      <b class="num">{{ __('E-maily: {0}', [total]) }}</b>
      <span class="num"> · {{ __('{0} bez výhrad', [clean]) }}</span>
      <span v-if="warned" class="gl-bulk-warn num"> · {{ __('{0} s upozorněním zůstane čekat', [warned]) }}</span>
    </div>
    <div class="gl-bulk-actions">
      <template v-if="checked">
        <button type="button" class="gl-bulk-btn" :disabled="disabled" @click="$emit('approve-checked')">{{ __('Schválit označené ({0})', [checked]) }}</button>
        <button type="button" class="gl-bulk-btn gl-bulk-danger" :disabled="disabled" @click="$emit('exclude-checked')">{{ __('Vyřadit označené') }}</button>
      </template>
      <button
        type="button"
        class="gl-bulk-btn gl-bulk-primary"
        :disabled="disabled || !clean"
        :aria-label="warned ? __('Schválit e-maily bez výhrad ({0}), s upozorněním počkají ({1})', [clean, warned]) : undefined"
        @click="$emit('approve-clean')"
      >
        <GlIcon name="check" :size="16" />{{ __('Schválit vše bez výhrad ({0})', [clean]) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { computed } from 'vue'

// total: počet e-mailů v týdnu; clean: kolik je bez výhrad; checked: kolik je označeno; disabled: zamknout vše (načítání, nesouhlasný otisk, bez schránky)
const props = defineProps({
  total: { type: Number, required: true },
  clean: { type: Number, required: true },
  checked: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
})
defineEmits(['approve-checked', 'exclude-checked', 'approve-clean'])
const warned = computed(() => props.total - props.clean)
</script>

<style scoped>
.gl-bulk {
  position: sticky; bottom: 16px; z-index: 20; margin: 8px auto 0; width: fit-content; max-width: 100%;
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 16px; padding: 10px 10px 10px 20px; border-radius: 22px;
  background: var(--mat-bar); border: var(--mat-card-border); box-shadow: 0 16px 48px color-mix(in srgb, var(--c-shadow) 20%, transparent);
  -webkit-backdrop-filter: var(--mat-blur); backdrop-filter: var(--mat-blur);
}
.gl-bulk-info { font-size: 14px; color: var(--text-2); }
.gl-bulk-info b { color: var(--text-1); font-weight: 650; }
.gl-bulk-warn { color: var(--warning); font-weight: 600; }
.gl-bulk-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; }
.gl-bulk-btn { min-height: var(--hit-sm, 36px); padding: 0 16px; border-radius: 14px; border: 1px solid var(--field-border); background: var(--c-white); font: inherit; font-size: 14px; font-weight: 600; color: var(--text-1); display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: transform var(--t-press, 90ms), background-color var(--t-fast, 120ms); }
.gl-bulk-btn:active:not(:disabled) { transform: scale(0.97); }
.gl-bulk-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.gl-bulk-primary { background: var(--accent-600); border-color: transparent; color: var(--c-white); box-shadow: 0 6px 18px color-mix(in srgb, var(--accent-600) 28%, transparent); }
.gl-bulk-danger { color: var(--overdue); }
@media (max-width: 767px) {
  /* nad spodní navigací telefonu */
  .gl-bulk { bottom: calc(var(--gl-tabbar-h, 64px) + max(12px, env(safe-area-inset-bottom)) + 8px); width: auto; margin-inline: 0; padding: 12px; border-radius: 20px; }
  .gl-bulk-btn { min-height: 44px; }
  .gl-bulk-actions { width: 100%; }
  .gl-bulk-actions .gl-bulk-btn { flex: 1 1 auto; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) { .gl-bulk-btn { transition: none; } }
</style>
