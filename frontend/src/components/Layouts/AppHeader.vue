<template>
  <!-- GrowUp: hledání a zvonek nejsou v horní liště (zvonek je v postranním menu, hledání v sekcích) -->
  <div class="flex pr-2 pt-1">
    <div id="app-header" class="flex-1"></div>
    <div class="flex items-center justify-center gap-2 pl-2">
      <CallUI />
    </div>
  </div>
</template>

<script setup>
import CallUI from '@/components/Telephony/CallUI.vue'
</script>
