<template>
  <!-- GrowUp (zadání 2027 E3): Nastavení jako stránka s adresou /settings/<sekce>. Změna sekce = router.push (Zpět funguje).
       Kolo 2 V2: hlavička jako ostatní stránky, bez ✕ (navigace je v liště a Zpět v prohlížeči), tichý štítek tarifu. -->
  <LayoutHeader>
    <template #left-header>
      <span class="gl-page-title text-lg-medium text-ink-gray-9">{{ __('Nastavení') }}</span>
      <span v-if="planLabel" class="ml-3 rounded-full bg-[color-mix(in_srgb,var(--text-2)_10%,transparent)] px-2.5 py-0.5 text-[13px] font-medium text-ink-gray-6">{{ planLabel }}</span>
    </template>
  </LayoutHeader>
  <div class="flex min-h-0 flex-1 flex-col">
    <Settings :section="section" hide-title />
  </div>
</template>
<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import Settings from '@/components/Settings/Settings.vue'
import { usersStore } from '@/stores/users'
import { createResource } from 'frappe-ui'
import { computed } from 'vue'

defineProps({ section: { type: String, default: '' } })

const { isManager } = usersStore()
// tarif do štítku v hlavičce („tarif Tým“)
const plan = createResource({ url: 'growupcrm.plans.seat_usage', auto: isManager() })
const planLabel = computed(() => (plan.data?.name ? __('tarif {0}', [plan.data.name]) : ''))
</script>
