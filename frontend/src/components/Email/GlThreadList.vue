<template>
  <!-- GrowUp (zadání 2027 E1): seznam konverzací zakázky – předmět, náhled, stav „Čeká na nás / na ně / Vyřízeno“, koncept -->
  <nav class="gl-tl" :aria-label="__('Konverzace')">
    <GlSkeleton v-if="loading && !threads.length" :rows="3" />
    <p v-else-if="!threads.length" class="px-3 py-4 text-[14px] text-[color:var(--text-2)]">{{ emptyText || __('Zatím tu není žádný e-mail.') }}</p>
    <ul v-else class="flex flex-col gap-1">
      <li v-for="t in threads" :key="t.id">
        <button
          type="button"
          class="gl-tl-row"
          :class="t.id === selected && 'is-on'"
          :aria-current="t.id === selected ? 'true' : undefined"
          @click="$emit('select', t.id)"
        >
          <span class="flex items-baseline justify-between gap-2">
            <b class="truncate text-[15px] font-semibold text-ink-gray-9">{{ t.subject || __('(bez předmětu)') }}</b>
            <time class="num shrink-0 text-[13px] text-[color:var(--text-2)]">{{ mailTime(t.last?.at, false) }}</time>
          </span>
          <span class="mt-0.5 block truncate text-[14px] text-[color:var(--text-2)]">
            <template v-if="t.last?.sent_or_received === 'Sent'">{{ __('Vy:') + ' ' }}</template>{{ t.last?.snippet }}
          </span>
          <span class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span class="gl-tl-chip" :class="STATE_LABEL[t.state]?.cls">{{ __(STATE_LABEL[t.state]?.label || '') }}</span>
            <span v-if="t.count > 1" class="num text-[13px] text-[color:var(--text-2)]">{{ t.count }}×</span>
            <span v-if="t.has_draft" class="gl-tl-chip is-draft">{{ __('Koncept') }}</span>
            <span v-if="t.has_proposal" class="gl-tl-chip is-us"><GlIcon name="sparkles" :size="13" />{{ __('návrh') }}</span>
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import { STATE_LABEL, mailTime } from '@/composables/glMail'

defineProps({
  threads: { type: Array, default: () => [] },
  selected: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '' },
})
defineEmits(['select'])
</script>
<style scoped>
.gl-tl-row {
  display: block;
  width: 100%;
  min-height: 64px;
  padding: 10px 12px;
  border-radius: 16px;
  text-align: left;
}
.gl-tl-row:hover { background: var(--fill-tinted, rgba(110, 120, 200, 0.075)); }
.gl-tl-row.is-on { background: var(--accent-soft); }
.gl-tl-row:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-tl-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
.gl-mstate-us, .gl-tl-chip.is-us { color: var(--state-us-fg); background: var(--state-us-bg); }
.gl-mstate-them { color: var(--state-them-fg); background: var(--state-them-bg); }
.gl-mstate-done { color: var(--state-done-fg); background: var(--state-done-bg); }
.gl-tl-chip.is-draft { color: var(--warn-fg); background: var(--warn-bg); }
</style>
