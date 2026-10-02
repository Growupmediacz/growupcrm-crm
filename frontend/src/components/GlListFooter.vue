<template>
  <!-- GrowUp: česká patička seznamu (design 2. kolo, oprava 5 a 28).
       Desktop: „Zobrazeno 20 z 29“ · „Načíst další“ · „Na stránku 20 · 50 · 100“.
       Mobil: jedno velké „Načíst další“, na konci jen „Zobrazeno 29 z 29“.
       Stejné rozhraní jako ListFooter z frappe-ui (v-model = počet na stránku, událost loadMore). -->
  <div
    v-if="isMobileView"
    class="flex flex-col items-center gap-2 py-3"
  >
    <button
      v-if="showLoadMore"
      class="h-11 w-full rounded-[14px] bg-white/80 text-[15px] font-semibold text-ink-gray-9 shadow-[0_2px_10px_-3px_rgba(64,72,160,0.25)] transition active:scale-[0.98]"
      @click="emit('loadMore')"
    >
      {{ __('Načíst další') }}
    </button>
    <span class="text-[13px] text-[var(--text-3,#464c70)]">{{ shownLabel }}</span>
  </div>
  <div v-else class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
    <span class="text-[13px] text-[var(--text-3,#464c70)]">{{ shownLabel }}</span>
    <button
      v-if="showLoadMore"
      class="h-9 rounded-full bg-white/85 px-4 text-[14px] font-semibold text-ink-gray-9 shadow-[0_2px_10px_-3px_rgba(64,72,160,0.25)] transition hover:bg-white active:scale-[0.97]"
      @click="emit('loadMore')"
    >
      {{ __('Načíst další') }}
    </button>
    <span v-else />
    <span class="flex items-center justify-end gap-1 text-[13px] text-[var(--text-3,#464c70)]">
      {{ __('Na stránku') }}
      <template v-for="(n, i) in pageLengthOptions" :key="n">
        <span v-if="i" aria-hidden="true">·</span>
        <button
          class="rounded px-0.5 tabular-nums transition hover:text-ink-gray-9"
          :class="n === pageLengthCount && 'font-bold text-ink-gray-9'"
          :aria-pressed="n === pageLengthCount"
          @click="pageLengthCount = n"
        >
          {{ n }}
        </button>
      </template>
    </span>
  </div>
</template>

<script setup>
import { isMobileView } from '@/composables/settings'
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 20 },
  options: {
    type: Object,
    default: () => ({ rowCount: 0, totalCount: 0, pageLengthOptions: [20, 50, 100] }),
  },
})
const emit = defineEmits(['update:modelValue', 'loadMore'])

const pageLengthCount = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const pageLengthOptions = computed(() => props.options.pageLengthOptions || [20, 50, 100])
const showLoadMore = computed(
  () =>
    props.options.rowCount &&
    props.options.totalCount &&
    props.options.rowCount < props.options.totalCount,
)
const shownLabel = computed(() =>
  __('Zobrazeno {0} z {1}', [props.options.rowCount || 0, props.options.totalCount || 0]),
)
</script>
