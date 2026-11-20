<template>
  <div class="flex h-screen w-screen">
    <MobileSidebar />
    <div class="flex h-full flex-1 flex-col overflow-auto">
      <!-- zadání 2027 E3: Nastavení je stránka /settings/… (GlSettings), ne překrytí -->
      <template v-if="true"><!-- jedna větev (dřív v-else za Nastavením) -->
        <!-- zadání 2027 E2: v detailu (zakázka, vlákno) spodní navigace není – nahrazuje ji lišta akcí stránky;
             vlákno má vlastní hlavičku se šipkou zpět, zakázka hlavičku přes LayoutHeader (#app-header) -->
        <MobileAppHeader v-if="!ownHeader" />
        <GlSectionPills v-if="!isDetail" />
        <div class="flex min-h-0 flex-1 flex-col" :class="!isDetail && 'pb-24'"><slot /></div>
      </template>
    </div>
    <MobileTabBar v-if="!isDetail" />
    <GlobalModals />
  </div>
</template>
<script setup>
import MobileSidebar from '@/components/Mobile/MobileSidebar.vue'
import MobileAppHeader from '@/components/Mobile/MobileAppHeader.vue'
import MobileTabBar from '@/components/Mobile/MobileTabBar.vue'
import GlSectionPills from '@/components/Mobile/GlSectionPills.vue'
import GlobalModals from '@/components/Modals/GlobalModals.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const DETAIL_ROUTES = ['Lead', 'GlMailThread']
const isDetail = computed(() => DETAIL_ROUTES.includes(route.name))
const ownHeader = computed(() => isDetail.value && route.name === 'GlMailThread')
</script>
