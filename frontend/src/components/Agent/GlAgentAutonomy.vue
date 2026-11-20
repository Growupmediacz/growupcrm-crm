<template>
  <!-- GrowUp (zadání 2027 kolo 2 V2): „Co smí agent sám“ – tabulka samostatnosti (jen ke čtení, úrovně mění vedoucí po domluvě).
       Data: growupcrm.agent_autonomy.get. Obchodník dostane chybu práv a sekce se nevykreslí vůbec (jako GlAgentStatus). -->
  <section v-if="!forbidden" class="gl-card flex min-w-0 flex-col gap-4 p-5 md:p-6" :aria-label="__('Co smí agent sám')">
    <GlSkeleton v-if="res.loading && !data" :rows="4" />
    <GlErrorBanner v-else-if="res.error" :title="__('Samostatnost agenta se nepodařilo načíst')" :text="res.error.messages?.[0]" @retry="res.reload()" />
    <template v-else-if="data">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 max-w-[720px]">
          <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Co smí agent sám') }}</h2>
          <p class="mt-1 text-[15px] text-ink-gray-6">{{ __('Co agent udělá bez vás, co vám dá ke schválení a co vždy necháte na sobě. Úrovně mění vedoucí po domluvě, povýšení agent navrhne ve frontě Dnes.') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-for="s in summary" :key="s.level" class="gl-chip pointer-events-none inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium">
            <GlIcon :name="LEVELS[s.level].icon" :size="14" />{{ s.count }}× {{ LEVELS[s.level].label() }}
          </span>
        </div>
      </div>

      <GlEmptyState v-if="!data.rows?.length" icon="bot" :title="__('Zatím bez pravidel')" :text="__('Tabulka samostatnosti se zobrazí, jakmile ji vedoucí nastaví.')" />
      <div v-else>
        <!-- hlavička sloupců jen na desktopu -->
        <div class="hidden grid-cols-[minmax(0,1fr)_150px_110px] gap-4 border-b border-[var(--line)] px-1 pb-2 text-[13px] font-semibold text-ink-gray-5 md:grid">
          <div>{{ __('Akce') }}</div>
          <div>{{ __('Úroveň') }}</div>
          <div class="text-right">{{ __('Za 4 týdny') }}</div>
        </div>
        <ul class="flex flex-col">
          <li v-for="r in data.rows" :key="r.key" class="flex min-h-[56px] flex-col justify-center gap-1 border-b border-[var(--line)] px-1 py-3 last:border-b-0">
            <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_150px_110px]">
              <div class="min-w-0">
                <div class="break-words text-[15px] font-semibold text-ink-gray-9">{{ r.label }}</div>
                <div v-if="r.note" class="break-words text-[14px] text-ink-gray-5">{{ r.note }}</div>
              </div>
              <span class="inline-flex h-8 w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold max-md:order-3 max-md:col-start-1" :class="LEVELS[r.level]?.tone" :style="LEVELS[r.level]?.style">
                <GlIcon :name="LEVELS[r.level]?.icon || 'bot'" :size="15" />{{ LEVELS[r.level]?.label() || r.level }}
              </span>
              <div class="text-right text-[14px] tabular-nums text-ink-gray-7 max-md:col-start-2 max-md:row-start-1">
                <span v-if="r.runs_28d !== null && r.runs_28d !== undefined">{{ nf(r.runs_28d) }}×</span>
                <span v-else class="text-ink-gray-5" :title="__('Nelze spočítat')">—</span>
                <span class="sr-only md:hidden"> {{ __('za 4 týdny') }}</span>
              </div>
            </div>
            <div v-if="r.promote_hint" class="text-[13px] text-ink-gray-6">{{ r.promote_hint }}</div>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup>
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import { isForbidden } from '@/utils/glErrors'
import { createResource } from 'frappe-ui'
import { computed } from 'vue'

// stav není jen barva: ikona + text; tóny jen z tokenů
const LEVELS = {
  self: {
    icon: 'bot',
    label: () => __('Sám'),
    tone: 'text-[var(--c-green-700)]',
    style: { background: 'color-mix(in srgb, var(--stage-vyhrano) 14%, transparent)' },
  },
  approve: {
    icon: 'shield-check',
    label: () => __('Ke schválení'),
    tone: 'text-[var(--accent-700)]',
    style: { background: 'color-mix(in srgb, var(--accent-600) 12%, transparent)' },
  },
  human: {
    icon: 'user',
    label: () => __('Vždy vy'),
    tone: 'text-[var(--c-amber-700)]',
    style: { background: 'color-mix(in srgb, var(--c-amber-550) 18%, transparent)' },
  },
}

const res = createResource({ url: 'growupcrm.agent_autonomy.get', auto: true })
const data = computed(() => res.data)
// obchodník dostane chybu práv: sekce se nevykreslí vůbec
const forbidden = computed(() => !!res.error && isForbidden(res.error))
const nf = (n) => new Intl.NumberFormat('cs-CZ').format(n || 0)

const summary = computed(() =>
  ['self', 'approve', 'human'].map((level) => ({ level, count: (data.value?.rows || []).filter((r) => r.level === level).length })),
)
</script>
