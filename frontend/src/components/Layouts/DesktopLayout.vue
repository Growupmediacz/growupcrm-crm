<template>
  <!-- GrowUp (design 3. kolo): levá plovoucí lišta skupin + spodní plovoucí lišta stránek skupiny.
       Obsah má dole místo pro spodní lištu, aby ji nikdy nepřekrýval. -->
  <div class="flex h-screen w-screen gap-6 p-[var(--gl-page-m)]">
    <GlRail />
    <div class="relative flex h-full min-w-0 flex-1 flex-col">
      <!-- Nastavení jako celá stránka místo obsahu (design 3. kolo, 07) -->
      <Settings v-if="showSettings" />
      <div
        v-show="!showSettings"
        class="flex h-full min-h-0 flex-1 flex-col overflow-auto"
        :class="hasTabBar && 'pb-[calc(var(--gl-tabbar-h)+24px)]'"
      >
        <AppHeader />
        <slot />
      </div>
      <div v-if="!showSettings" class="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <GlTabBar />
      </div>
    </div>
    <GlobalModals />
  </div>
</template>
<script setup>
import GlRail from '@/components/Layouts/GlRail.vue'
import GlTabBar from '@/components/Layouts/GlTabBar.vue'
import AppHeader from '@/components/Layouts/AppHeader.vue'
import GlobalModals from '@/components/Modals/GlobalModals.vue'
import Settings from '@/components/Settings/Settings.vue'
import { useGlNav } from '@/composables/glNav'
import { showSettings, activeSettingsPage } from '@/composables/settings'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const { activeGroup } = useGlNav()
const route = useRoute()
// přechod na jinou stránku nastavení zavře
watch(
  () => route.fullPath,
  () => ((showSettings.value = false), (activeSettingsPage.value = '')),
)
const hasTabBar = computed(() => Boolean(activeGroup.value))
</script>
