<template>
  <div class="flex pr-2 pt-1">
    <div id="app-header" class="flex-1"></div>
    <div class="flex items-center justify-center gap-2 pl-2">
      <GlSearch />
      <GlBell />
      <CallUI />
    </div>
  </div>
</template>

<script setup>
import GlBell from '@/components/GlBell.vue'
import GlSearch from '@/components/GlSearch.vue'
import CallUI from '@/components/Telephony/CallUI.vue'
</script>
