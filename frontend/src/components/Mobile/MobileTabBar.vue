<template>
  <!-- GrowUp (design 3. kolo, mobil = web v Safari): Dnes · Prodej · Práce · Dodání · Více.
       Stránky skupiny jsou v záložkách pod nadpisem (GlSectionPills). -->
  <nav
    data-gl-pill=".gl-tab-on"
    class="gl-tabbar fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex h-[68px] items-stretch rounded-[30px] px-2"
  >
    <router-link
      v-for="t in tabs"
      :key="t.key"
      :to="t.to"
      class="gl-tab flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold"
      :class="t.active ? 'gl-tab-on text-[var(--accent-600)]' : 'text-ink-gray-5'"
      :aria-current="t.active ? 'page' : undefined"
    >
      <GlIcon :name="t.icon" :size="22" />
      {{ t.label }}
    </router-link>
  </nav>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { useGlNav } from '@/composables/glNav'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { groups, activeGroup, groupTarget, remember } = useGlNav()
watch(() => route.name, remember, { immediate: true })

const MORE_ROUTES = ['More', 'Notifications']
const tabs = computed(() => [
  ...groups.value.map((g) => ({
    key: g.key,
    label: __(g.label),
    icon: g.icon,
    to: g.key === 'today' ? { name: 'Today' } : groupTarget(g),
    active: !MORE_ROUTES.includes(route.name) && activeGroup.value?.key === g.key,
  })),
  { key: 'more', label: __('Více'), icon: 'more', to: { name: 'More' }, active: MORE_ROUTES.includes(route.name) },
])
// design 3. kolo (m2, m3): spodní lišta je i na detailu
</script>
