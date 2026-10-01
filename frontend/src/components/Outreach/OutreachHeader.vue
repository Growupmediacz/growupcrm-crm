<template>
  <!-- GrowUp (design 2. kolo, O1): nadpis Outreach, záložky, stav schránky a Nová kampaň -->
  <LayoutHeader>
    <template #left-header>
      <div class="flex min-w-0 items-center gap-3">
        <h1 class="text-lg-medium shrink-0">{{ __('Outreach') }}</h1>
        <div class="gl-seg hidden max-w-full overflow-x-auto md:inline-flex">
          <router-link
            v-for="t in tabs"
            :key="t.key"
            :to="{ name: 'Outreach', params: { tab: t.key === 'overview' ? '' : t.key } }"
            class="gl-seg-btn whitespace-nowrap"
            :class="active === t.key && 'gl-seg-on'"
          >
            {{ t.label }}
            <span v-if="t.count" class="num ml-1 rounded-full bg-[rgba(79,70,229,.14)] px-1.5 text-[11px] font-bold text-[#4338ca]">{{ t.count }}</span>
          </router-link>
        </div>
      </div>
    </template>
    <template #right-header>
      <button class="gl-chip hidden h-9 items-center gap-2 rounded-full px-3.5 text-[14px] sm:flex" @click="$emit('mailbox')">
        <span class="size-2 rounded-full" :class="connected ? 'bg-[#22b35e]' : 'bg-[#e0a100]'" />
        {{ connected ? __('Schránka připojena') : __('Připojit schránku') }}
      </button>
      <Button variant="solid" iconLeft="plus" @click="$emit('newCampaign')">
        <span class="hidden sm:inline">{{ __('Nová kampaň') }}</span>
      </Button>
    </template>
  </LayoutHeader>
  <!-- mobil: záložky pod hlavičkou -->
  <div class="gl-seg mx-4 mb-3 flex overflow-x-auto md:hidden">
    <router-link
      v-for="t in tabs"
      :key="t.key"
      :to="{ name: 'Outreach', params: { tab: t.key === 'overview' ? '' : t.key } }"
      class="gl-seg-btn whitespace-nowrap"
      :class="active === t.key && 'gl-seg-on'"
    >
      {{ t.label }}
    </router-link>
  </div>
</template>

<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import { computed } from 'vue'

const props = defineProps({
  active: { type: String, default: 'overview' },
  connected: { type: Boolean, default: false },
  counts: { type: Object, default: () => ({}) },
})
defineEmits(['mailbox', 'newCampaign'])

const tabs = computed(() => [
  { key: 'overview', label: __('Přehled') },
  { key: 'approve', label: __('Ke schválení'), count: props.counts.approve },
  { key: 'replies', label: __('Odpovědi'), count: props.counts.replies },
  { key: 'campaigns', label: __('Kampaně') },
  { key: 'templates', label: __('Šablony') },
])
</script>
