<template>
  <!-- GrowUp (design 3. kolo): spodní plovoucí lišta se stránkami aktivní skupiny a avatarem. -->
  <nav
    v-if="group"
    class="gl3-tabbar pointer-events-auto flex h-[var(--gl-tabbar-h)] items-center gap-1 rounded-full px-2"
    :aria-label="__(group.label)"
  >
    <router-link
      v-for="p in group.pages"
      :key="p.key"
      :to="{ name: p.key }"
      class="gl3-tab"
      :class="activePage?.key === p.key && 'is-active'"
      :aria-current="activePage?.key === p.key ? 'page' : undefined"
    >
      {{ __(p.label) }}
    </router-link>
    <span class="mx-1 h-7 w-px bg-[var(--line)]" aria-hidden="true" />
    <UserDropdown footer :isCollapsed="true" placement="right" />
  </nav>
</template>

<script setup>
import UserDropdown from '@/components/UserDropdown.vue'
import { useGlNav } from '@/composables/glNav'

const { activeGroup: group, activePage } = useGlNav()
</script>
