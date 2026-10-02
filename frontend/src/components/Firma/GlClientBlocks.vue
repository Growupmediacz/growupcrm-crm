<template>
  <!-- GrowUp (design 2. kolo, P3): firma ve stavu Klient – stav vztahu, spolupráce a projekty -->
  <template v-if="d">
    <div class="gl-card p-5 md:p-6">
      <div class="flex items-baseline justify-between"><h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Spolupráce') }}</h2></div>
      <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-2xl bg-[rgba(110,120,200,.09)] px-4 py-3">
          <div class="num text-[22px] font-bold text-ink-gray-9">{{ d.has_retainer ? `${nf.format(d.monthly)} Kč` : '' }}<span v-if="!d.has_retainer" class="text-[16px] font-semibold text-[var(--empty-color)]">{{ __('Bez retaineru') }}</span></div>
          <div class="text-[12px] text-ink-gray-5">{{ __('měsíční retainer') }}</div>
        </div>
        <div class="rounded-2xl bg-[rgba(110,120,200,.09)] px-4 py-3">
          <div class="num text-[22px] font-bold text-ink-gray-9">{{ d.since ? __('od {0}', [formatDateCz(d.since)]) : '' }}<span v-if="!d.since" class="text-[16px] font-semibold text-[var(--empty-color)]">{{ __('Bez data') }}</span></div>
          <div class="text-[12px] text-ink-gray-5">{{ d.months !== null ? monthsWord(d.months) : '' }}</div>
        </div>
        <div class="rounded-2xl bg-[rgba(110,120,200,.09)] px-4 py-3">
          <div class="num text-[22px] font-bold text-ink-gray-9">{{ d.next_billing ? shortDateCz(d.next_billing) : '' }}<span v-if="!d.next_billing" class="text-[16px] font-semibold text-[var(--empty-color)]">{{ __('Bez fakturace') }}</span></div>
          <div class="text-[12px] text-ink-gray-5">{{ __('další fakturace') }}</div>
        </div>
      </div>
      <div v-if="d.services.length" class="mt-3 flex flex-wrap gap-2"><span v-for="s in d.services" :key="s" class="rounded-full bg-[rgba(79,70,229,.1)] px-3 py-1 text-[13px] font-semibold text-[#3b30b8]">{{ s }}</span></div>
    </div>

    <div class="gl-card p-5 md:p-6">
      <div class="flex items-baseline justify-between">
        <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Projekty') }}</h2>
        <router-link v-if="d.projects_total" :to="{ name: 'Projects' }" class="gl-fill">{{ __('Všechny ({0})', [d.projects_total]) }}</router-link>
      </div>
      <p v-if="!d.projects.length" class="py-5 text-[14px] text-ink-gray-5">{{ __('Zatím žádný projekt.') }}</p>
      <router-link v-for="p in d.projects" :key="p.name" :to="{ name: 'Project', params: { projectId: p.name } }" class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-[rgba(110,120,200,.12)] py-3 first:border-0 md:grid-cols-[1fr_130px_190px_60px]">
        <span class="min-w-0"><span class="block truncate text-[16px] font-bold text-ink-gray-9">{{ p.project_name }}</span><span v-if="p.next_step" class="block truncate text-[12px] text-ink-gray-5">{{ p.next_step }}</span></span>
        <span class="flex items-center gap-1.5 text-[14px] text-ink-gray-9"><span class="size-2 rounded-full" :style="{ background: COLORS[p.display_status] }" />{{ __(p.display_status) }}</span>
        <span class="hidden items-center gap-2 md:flex"><span class="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><span class="block h-full rounded-full bg-[#4F46E5]" :style="{ width: `${p.progress || 0}%` }" /></span><span class="num w-9 text-right text-[12px] text-ink-gray-5">{{ Math.round(p.progress || 0) }} %</span></span>
        <span class="num hidden text-right text-[13px] md:block" :class="p.display_status === 'Zpožděno' ? 'font-semibold text-[#a82614]' : 'text-ink-gray-5'">{{ p.deadline ? shortDateCz(p.deadline) : '' }}</span>
      </router-link>
    </div>
  </template>
</template>

<script setup>
import { formatDateCz, shortDateCz } from '@/utils/glDate'
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, default: null } })
const nf = new Intl.NumberFormat('cs-CZ')
const COLORS = { 'Probíhá': '#3b82f6', 'Průběžně': '#8b5cf6', 'Zpožděno': '#e5484d', 'Čeká': '#e0a100', 'Dokončeno': '#22b35e', 'Zrušeno': '#9ca3af' }
const d = computed(() => props.data)
const monthsWord = (n) => `${n} ${n === 1 ? 'měsíc' : n >= 2 && n <= 4 ? 'měsíce' : 'měsíců'}`
</script>
