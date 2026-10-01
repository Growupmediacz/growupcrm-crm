<template>
  <!-- GrowUp: zvonek v horní liště (design). Otevírá panel oznámení CRM vedle menu. -->
  <button
    id="notifications-btn"
    class="gl-round relative flex size-10 items-center justify-center rounded-full"
    :aria-label="__('Oznámení')"
    :title="__('Oznámení')"
    @click="toggle()"
  >
    <GlIcon name="bell" :size="18" />
    <span
      v-if="unreadNotificationsCount"
      class="absolute right-2 top-2 size-2.5 rounded-full border-2 border-white bg-[#e5484d]"
    />
  </button>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { notificationsStore, unreadNotificationsCount } from '@/stores/notifications'

const { toggle } = notificationsStore()
</script>
