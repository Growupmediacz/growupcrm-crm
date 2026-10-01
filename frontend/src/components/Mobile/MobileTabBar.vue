<template>
  <nav
    v-if="!isDetail"
    class="gl-tabbar fixed inset-x-3 bottom-3 z-30 flex h-[68px] items-stretch rounded-[30px] px-2"
  >
    <router-link
      v-for="t in tabs"
      :key="t.label"
      :to="t.to"
      class="gl-tab flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold"
      :class="isActive(t) ? 'text-[#4f46e5]' : 'text-ink-gray-5'"
    >
      <GlIcon :name="t.icon" :size="22" />
      {{ t.label }}
    </router-link>
    <button
      class="gl-tab flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-ink-gray-5"
      @click="sidebarOpened = true"
    >
      <GlIcon name="more" :size="22" />
      {{ __('Více') }}
    </button>
  </nav>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { mobileSidebarOpened as sidebarOpened } from '@/composables/settings'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const tabs = [
  { label: __('Dnes'), icon: 'home', to: { name: 'Today' }, names: ['Today'] },
  { label: __('Zakázky'), icon: 'brief', to: { name: 'Leads' }, names: ['Leads', 'Lead'] },
  { label: __('Firmy'), icon: 'building', to: { name: 'Organizations' }, names: ['Organizations', 'Organization'] },
  { label: __('Kalendář'), icon: 'cal', to: { name: 'Calendar' }, names: ['Calendar'] },
]
const isActive = (t) => t.names.includes(route.name)
// Na detailu (zakázka, firma, kontakt) lišta není, jako v návrhu: zpět vede tlačítko v hlavičce.
const DETAIL_ROUTES = ['Lead', 'Organization', 'Contact', 'Deal']
const isDetail = computed(() => DETAIL_ROUTES.includes(route.name))
</script>
