<template>
  <!-- GrowUp (design systém 2. kola): prázdný seznam = ikona, věta, co dělat. Vždy česky, nikdy „No Leads Found“ -->
  <div class="mx-auto w-full max-w-[460px] px-4 py-10">
    <GlEmptyState class="w-full" :icon="glIcon" :title="computedTitle" :text="computedDescription" />
  </div>
</template>
<script setup>
import GlEmptyState from '@/components/GlEmptyState.vue'
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: [String, Object], default: 'file-text' },
  top: { type: String, default: '35%' },
  width: { type: String, default: 'md' },
})

// názvy seznamů: „Leads“ → „zakázky“ (skloňování v české větě)
const NAMES = {
  Leads: 'zakázky', Deals: 'obchody', Contacts: 'kontakty', Organizations: 'firmy', Notes: 'zápisy', Tasks: 'úkoly',
  'Call Logs': 'hovory', Calls: 'hovory',
}
const ICONS = { Leads: 'brief', Contacts: 'users', Organizations: 'building', Notes: 'doc', Tasks: 'check', 'Call Logs': 'phone' }
const what = computed(() => NAMES[props.name] || __(props.name).toLowerCase())
const glIcon = computed(() => ICONS[props.name] || 'inbox')
const computedTitle = computed(() => props.title || __('Zatím žádné {0}', [what.value]))
const computedDescription = computed(() => props.description || __('Nic tu zatím není. Vytvořte první tlačítkem nahoře, nebo zkuste upravit filtry.'))
</script>
