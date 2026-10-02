<template>
  <!-- GrowUp (design 2. kolo, C6): Tarif a uživatelé – tarif, obsazená místa, přehled rolí -->
  <div class="flex h-full flex-col gap-5 overflow-y-auto p-6 text-ink-gray-8">
    <div>
      <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('Tarif a uživatelé') }}</h2>
      <p class="mt-1 text-p-base text-ink-gray-6">{{ __('Kolik lidí CRM používá a co kdo vidí.') }}</p>
    </div>
    <SeatUsage />
    <div class="flex items-center justify-between">
      <h3 class="text-[18px] font-bold text-ink-gray-9">{{ __('Uživatelé a role') }}</h3>
      <Button variant="solid" iconLeft="plus" :label="__('Pozvat uživatele')" @click="activeSettingsPage = __('Invite User')" />
    </div>
    <div class="rounded-[20px] bg-[rgba(110,120,200,.07)] p-2">
      <div v-for="u in people" :key="u.name" class="flex items-center gap-3 rounded-2xl px-3 py-2.5">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[12px] font-bold text-[#2440a6]">{{ initials(u.full_name) }}</span>
        <span class="min-w-0 flex-1"><span class="block truncate text-[15px] font-bold text-ink-gray-9">{{ u.full_name }}</span><span class="block truncate text-[12px] text-ink-gray-5">{{ u.name }}</span></span>
        <span class="rounded-full bg-white/80 px-3 py-1 text-[13px] font-semibold text-ink-gray-8">{{ ROLES[u.role] || u.role }}</span>
        <span class="flex items-center gap-1.5 text-[13px] text-ink-gray-7"><span class="size-2 rounded-full bg-[#22b35e]" />{{ __('Aktivní') }}</span>
      </div>
    </div>
    <p class="text-[13px] leading-relaxed text-ink-gray-6">
      <b class="text-ink-gray-9">{{ __('Správce') }}</b> {{ __('vidí vše.') }} <b class="text-ink-gray-9">{{ __('Vedoucí obchodu') }}</b> {{ __('vše kromě Analytiky a smí upravit cíle.') }}
      <b class="text-ink-gray-9">{{ __('Obchodník') }}</b> {{ __('vidí své zakázky, úkoly a kalendář, Plány jen ke čtení.') }}
    </p>
  </div>
</template>

<script setup>
import SeatUsage from '@/components/Settings/SeatUsage.vue'
import { activeSettingsPage } from '@/composables/settings'
import { usersStore } from '@/stores/users'
import { Button } from 'frappe-ui'
import { computed } from 'vue'

const { users } = usersStore()
const ROLES = { 'System Manager': __('Správce'), 'Sales Manager': __('Vedoucí obchodu'), 'Sales User': __('Obchodník') }
const people = computed(() => (users.data?.crmUsers || []).filter((u) => u.name !== 'Administrator'))
const initials = (s) => (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
</script>
