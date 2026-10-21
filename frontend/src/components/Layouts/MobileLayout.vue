<template>
  <div class="flex h-screen w-screen">
    <MobileSidebar />
    <div class="flex h-full flex-1 flex-col overflow-auto">
      <div v-if="showSettings" class="flex min-h-0 flex-1 flex-col px-4 pb-24 pt-4"><Settings /></div>
      <template v-else>
        <MobileAppHeader />
        <GlSectionPills />
        <div class="flex min-h-0 flex-1 flex-col pb-24"><slot /></div>
      </template>
    </div>
    <MobileTabBar />
    <GlobalModals />
  </div>
</template>
<script setup>
import MobileSidebar from '@/components/Mobile/MobileSidebar.vue'
import MobileAppHeader from '@/components/Mobile/MobileAppHeader.vue'
import MobileTabBar from '@/components/Mobile/MobileTabBar.vue'
import GlSectionPills from '@/components/Mobile/GlSectionPills.vue'
import GlobalModals from '@/components/Modals/GlobalModals.vue'
import Settings from '@/components/Settings/Settings.vue'
import { showSettings, activeSettingsPage } from '@/composables/settings'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
watch(
  () => route.fullPath,
  () => ((showSettings.value = false), (activeSettingsPage.value = '')),
)
</script>
