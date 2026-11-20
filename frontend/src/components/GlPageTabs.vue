<template>
  <!-- GrowUp (zadání 2027 E3, rozhodnutí Ivana 20. 11.): stránky skupiny v hlavičce stránky, v toku obsahu.
       Nahrazuje spodní plovoucí lištu (GlTabBar), nic nepřekrývá obsah. Řada se zalamuje (nic oříznutého). -->
  <nav v-if="show" class="gl-pt" :aria-label="__(group.label)">
    <router-link
      v-for="p in group.pages"
      :key="p.key"
      :to="{ name: p.key }"
      class="gl-pt-tab"
      :class="activePage?.key === p.key && 'is-active'"
      :aria-current="activePage?.key === p.key ? 'page' : undefined"
    >
      {{ __(p.label) }}
    </router-link>
  </nav>
</template>
<script setup>
import { useGlNav } from '@/composables/glNav'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { activeGroup: group, activePage } = useGlNav()
// v detailu (zakázka, firma, projekt, vlákno, jeden e-mail) se stránky skupiny neukazují: detail má vlastní hlavičku a cestu zpět
const DETAIL = ['Lead', 'Deal', 'Organization', 'Project', 'GlMailThread', 'OutreachReview', 'OutreachCampaign', 'OutreachTemplate']
const show = computed(
  () => group.value && group.value.key !== 'today' && group.value.pages.length > 1 && !DETAIL.includes(route.name),
)
</script>
<style scoped>
.gl-pt {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: 24px;
  background: var(--mat-bar);
  border: var(--mat-card-border);
  box-shadow: 0 4px 16px rgba(40, 50, 120, 0.06);
}
.gl-pt-tab {
  display: inline-flex;
  align-items: center;
  min-height: var(--hit-sm, 36px);
  padding: 0 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-2);
  white-space: nowrap;
  transition: color var(--t-fast, 120ms), background-color var(--t-fast, 120ms);
}
.gl-pt-tab:hover {
  color: var(--text-1);
  background: var(--fill-tinted, rgba(110, 120, 200, 0.075));
}
.gl-pt-tab.is-active {
  background: var(--accent-600);
  color: #fff;
}
.gl-pt-tab:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
@media (pointer: coarse) {
  .gl-pt-tab { min-height: var(--hit, 44px); }
}
</style>
