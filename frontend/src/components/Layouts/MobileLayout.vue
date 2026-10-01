<template>
  <div class="flex h-screen w-screen">
    <MobileSidebar />
    <div class="flex h-full flex-1 flex-col overflow-auto">
      <MobileAppHeader />
      <div class="flex min-h-0 flex-1 flex-col" :class="isDetail ? '' : 'pb-24'"><slot /></div>
    </div>
    <MobileTabBar />
    <GlobalModals />
  </div>
</template>
<script setup>
import MobileSidebar from '@/components/Mobile/MobileSidebar.vue'
import MobileAppHeader from '@/components/Mobile/MobileAppHeader.vue'
import MobileTabBar from '@/components/Mobile/MobileTabBar.vue'
import GlobalModals from '@/components/Modals/GlobalModals.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// místo pro spodní lištu jen tam, kde lišta je (viz MobileTabBar)
const isDetail = computed(() => ['Lead', 'Organization', 'Contact', 'Deal'].includes(route.name))
</script>
