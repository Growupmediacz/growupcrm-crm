<template>
  <!-- GrowUp (zadání 2027 E2): přepínač stránek skupiny v hlavičce, zalamuje se (nic oříznutého, žádný vodorovný posun).
       Dřív (design 3. kolo, mobil): posuvné záložky se stránkami aktivní skupiny pod nadpisem.
       Jen na seznamech, na detailu ne. -->
  <nav
    v-if="show"
    class="gl3-pills gl-pills-wrap flex flex-wrap gap-2 px-4 pb-2 pt-1"
    :aria-label="__(group.label)"
  >
    <router-link
      v-for="p in group.pages"
      :key="p.key"
      :to="{ name: p.key }"
      class="gl3-pill"
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
// záložky jen na hlavní stránce sekce (Leads, Tasks…), ne na detailu ani na Dnes
const show = computed(
  () => group.value && group.value.key !== 'today' && activePage.value?.key === route.name && group.value.pages.length > 1,
)
</script>
<style scoped>
/* telefon: cíl 44 px (gl3-pill má 36 px pro desktop) */
.gl-pills-wrap .gl3-pill { height: 44px; padding: 0 16px; font-size: 15px; }
</style>
