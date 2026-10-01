<template>
  <!-- GrowUp (oprava 21): bez hamburgeru, menu je pod „Více“ ve spodní liště; nadpis začíná u okraje -->
  <div class="flex pl-2 pr-3">
    <div id="app-header" class="min-w-0 flex-1" />
    <div class="flex items-center"><GlSearch /></div>
  </div>
  <CallUI class="mr-3 mt-2" />
</template>

<script setup>
import GlSearch from '@/components/GlSearch.vue'
import CallUI from '@/components/Telephony/CallUI.vue'
</script>
