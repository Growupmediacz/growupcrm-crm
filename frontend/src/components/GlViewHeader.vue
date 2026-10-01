<template>
  <!-- GrowUp: hlavička seznamu (design): nadpis, přepínač Kanban/Seznam, uložené pohledy. -->
  <div class="flex min-w-0 items-center gap-3">
    <router-link :to="{ name: routeName }" class="text-lg-medium shrink-0 text-ink-gray-9">
      {{ title }}
    </router-link>
    <div v-if="!savedView && segments.length > 1" class="gl-seg hidden shrink-0 sm:inline-flex">
      <button
        v-for="o in segments"
        :key="o.type"
        class="gl-seg-btn"
        :class="current === o.type && 'gl-seg-on'"
        @click="go(o.type)"
      >
        <GlIcon :name="o.icon" :size="15" />{{ o.label }}
      </button>
    </div>
    <span
      v-else-if="savedView"
      class="gl-chip gl-chip-on flex h-9 shrink-0 items-center gap-1.5 rounded-full pl-3.5 pr-1 text-[14px] font-semibold"
    >
      {{ __(viewControls?.currentView?.label) }}
      <router-link
        :to="{ name: routeName, params: { viewType: current } }"
        class="gl-chip-x"
        :aria-label="__('Zpět na standardní pohled')"
      >
        <GlIcon name="x" :size="13" />
      </router-link>
    </span>
    <Dropdown v-if="viewControls?.viewsDropdownOptions" :options="viewControls.viewsDropdownOptions">
      <button class="gl-round flex size-9 shrink-0 items-center justify-center rounded-full" :aria-label="__('Pohledy')" :title="__('Pohledy')">
        <span class="lucide-chevron-down size-4" aria-hidden="true" />
      </button>
    </Dropdown>
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { Dropdown } from 'frappe-ui'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, required: true },
  routeName: { type: String, required: true },
  viewControls: { type: Object, default: null },
  kanban: { type: Boolean, default: true },
  // GrowUp (oprava 15): stránka s kartami (např. ContactsCards) → přepínač Karty / Tabulka
  cardsRoute: { type: String, default: '' },
})

const route = useRoute()
const router = useRouter()
const current = computed(() => route.params.viewType || 'list')
const savedView = computed(() => !!route.query.view)
const segments = computed(() =>
  props.cardsRoute
    ? [
        { type: 'cards', label: __('Karty'), icon: 'grid' },
        { type: 'list', label: __('Tabulka'), icon: 'list' },
      ]
    : [
        props.kanban && { type: 'kanban', label: __('Kanban'), icon: 'kanban' },
        { type: 'list', label: __('Seznam'), icon: 'list' },
      ].filter(Boolean),
)

function go(type) {
  if (type === 'cards') return router.push({ name: props.cardsRoute })
  if (type !== current.value) router.push({ name: props.routeName, params: { viewType: type } })
}
</script>
