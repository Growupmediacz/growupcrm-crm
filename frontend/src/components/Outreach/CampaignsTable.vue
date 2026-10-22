<template>
  <!-- GrowUp (design 3. kolo, 11): kampaně – Aktivní / Vše, stav jako štítek, odpovědi, schůzky, % hotovo (otevření nesledujeme) -->
  <div class="gl-card p-5 md:p-6">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="text-[28px] font-bold tracking-tight text-ink-gray-9">{{ __('Kampaně') }}</h2>
      <div class="gl-seg inline-flex">
        <button class="gl-seg-btn !px-5" :class="filter === 'active' && 'gl-seg-on !bg-[var(--accent-600)] !text-white'" @click="filter = 'active'">{{ __('Aktivní') }}</button>
        <button class="gl-seg-btn !px-5" :class="filter === 'all' && 'gl-seg-on !bg-[var(--accent-600)] !text-white'" @click="filter = 'all'">{{ __('Vše') }}</button>
      </div>
    </div>
    <div v-if="!shown.length" class="flex flex-col items-center gap-3 py-8 text-center">
      <p class="text-[14px] text-ink-gray-5">{{ rows.length ? __('Žádná aktivní kampaň.') : __('Zatím žádná kampaň. Založte první a přidejte do ní kontakty z CRM.') }}</p>
      <Button variant="solid" iconLeft="plus" :label="__('Nová kampaň')" @click="$emit('new')" />
    </div>
    <div v-else class="flex flex-col">
      <div class="hidden grid-cols-[minmax(0,1fr)_120px_90px_80px_150px] gap-3 border-b border-[var(--line)] pb-2 text-[14px] text-ink-gray-5 lg:grid">
        <span>{{ __('Název kampaně') }}</span><span>{{ __('Stav') }}</span><span>{{ __('Odpovědi') }}</span><span>{{ __('Schůzky') }}</span><span>{{ __('% hotovo') }}</span>
      </div>
      <router-link
        v-for="c in shown"
        :key="c.name"
        :to="{ name: 'OutreachCampaign', params: { name: c.name } }"
        class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-[var(--line)] py-3.5 last:border-b-0 hover:bg-white/40 lg:grid-cols-[minmax(0,1fr)_104px_72px_64px_120px]"
      >
        <span class="flex min-w-0 items-center gap-3">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[var(--accent-600)]"><GlIcon :name="c.status === 'Koncept' ? 'doc' : 'mail'" :size="19" /></span>
          <span class="min-w-0">
            <span class="block truncate text-[16px] font-semibold text-ink-gray-9">{{ c.campaign_name }}</span>
            <span class="block truncate text-[13.5px] text-ink-gray-5">{{ stepsWord(c.steps) }} · {{ contactsWord(c.contacts) }}</span>
          </span>
        </span>
        <span class="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium" :class="STATUS[c.status]?.cls || STATUS.Koncept.cls">
          <span class="size-2 rounded-full" :style="{ background: STATUS[c.status]?.dot || STATUS.Koncept.dot }" />{{ __(c.status) }}
        </span>
        <span class="hidden lg:block"><span class="num block text-[15px] text-ink-gray-9">{{ c.sent ? c.replies : '—' }}</span><span v-if="c.sent" class="block text-[12.5px] text-ink-gray-5">{{ __('odpovědí') }}</span></span>
        <span class="hidden lg:block"><span class="num block text-[15px] text-ink-gray-9">{{ c.sent ? c.meetings || 0 : '—' }}</span><span v-if="c.sent" class="block text-[12.5px] text-ink-gray-5">{{ __('schůzky') }}</span></span>
        <span class="col-span-2 flex items-center gap-2 lg:col-span-1">
          <span class="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><span class="block h-full rounded-full bg-[var(--accent-600)]" :style="{ width: `${c.progress}%` }" /></span>
          <span class="num w-11 text-right text-[14px] text-ink-gray-8">{{ c.progress }} %</span>
        </span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { Button } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['new'])
const STATUS = {
  'Běží': { dot: '#22b35e', cls: 'bg-[rgba(34,179,94,.12)] text-[#178a4a]' },
  Pozastaveno: { dot: '#e0a100', cls: 'bg-[rgba(224,161,0,.14)] text-[#9a5b00]' },
  Koncept: { dot: '#9ca3af', cls: 'bg-[rgba(110,120,200,.1)] text-ink-gray-6' },
  'Dokončeno': { dot: 'var(--accent-600)', cls: 'bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] text-[var(--accent-700)]' },
}
const filter = ref('active')
const shown = computed(() => (filter.value === 'all' ? props.rows : props.rows.filter((c) => c.status !== 'Dokončeno')))
const plural = (n, one, few, many) => `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`
const stepsWord = (n) => plural(n, __('krok'), __('kroky'), __('kroků'))
const contactsWord = (n) => plural(n, __('kontakt'), __('kontakty'), __('kontaktů'))
</script>
