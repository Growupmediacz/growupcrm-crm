<template>
  <!-- GrowUp (zadání 2027 E3): Nastavení jako stránka s adresou /settings/<sekce>. Změna sekce = router.push (Zpět funguje). -->
  <LayoutHeader>
    <template #left-header>
      <h1 class="text-[17px] font-semibold text-ink-gray-9">{{ __('Nastavení') }}</h1>
    </template>
  </LayoutHeader>
  <div class="flex min-h-0 flex-1 flex-col px-1 pb-2">
    <Settings :section="section" hide-title />
  </div>
</template>
<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import Settings from '@/components/Settings/Settings.vue'

defineProps({ section: { type: String, default: '' } })
</script>
