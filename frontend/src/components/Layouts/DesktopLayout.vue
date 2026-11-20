<template>
  <!-- GrowUp (zadání 2027 E3): jedna navigace. Levá lišta skupin (GlRail) je jediná pevná navigace,
       stránky skupiny jsou pilulky v hlavičce stránky (GlPageTabs); spodní plovoucí lišta (GlTabBar) se ruší,
       obsah už nemá dolní rezervu. Nastavení je stránka s adresou /settings/… (GlSettings), ne překrytí. -->
  <div class="flex h-screen w-screen gap-6 p-[var(--gl-page-m)]">
    <GlRail />
    <div class="relative flex h-full min-w-0 flex-1 flex-col">
      <div class="flex h-full min-h-0 flex-1 flex-col overflow-auto">
        <div v-if="hasTabs" class="flex shrink-0 flex-wrap items-center gap-3 pb-1 pt-1">
          <GlPageTabs />
        </div>
        <AppHeader />
        <slot />
      </div>
    </div>
    <GlobalModals />
  </div>
</template>
<script setup>
import GlRail from '@/components/Layouts/GlRail.vue'
import GlPageTabs from '@/components/GlPageTabs.vue'
import AppHeader from '@/components/Layouts/AppHeader.vue'
import GlobalModals from '@/components/Modals/GlobalModals.vue'
import { useGlNav } from '@/composables/glNav'
import { useGlShortcuts } from '@/composables/glShortcuts'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { activeGroup } = useGlNav()
const route = useRoute()
const DETAIL = ['Lead', 'Deal', 'Organization', 'Project', 'GlMailThread', 'OutreachReview', 'OutreachCampaign', 'OutreachTemplate']
const hasTabs = computed(
  () => activeGroup.value && activeGroup.value.key !== 'today' && activeGroup.value.pages.length > 1 && !DETAIL.includes(route.name),
)
// klávesové zkratky aplikace (g d = Dnes, g z = Zakázky …, ? = nápověda); ⌘K řeší GlSearch
useGlShortcuts()
</script>
