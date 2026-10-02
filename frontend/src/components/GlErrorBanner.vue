<template>
  <!-- GrowUp (design systém 2. kola): chyba nahoře v obsahu – co se stalo, co dělat, „Zkusit znovu“ -->
  <div class="flex flex-wrap items-center gap-3 rounded-[18px] bg-[rgba(200,50,31,.09)] px-4 py-3" role="alert">
    <GlIcon name="alert" :size="20" class="shrink-0 text-[#a82614]" />
    <div class="min-w-0 flex-1">
      <div class="text-[15px] font-bold text-[#a82614]">{{ title }}</div>
      <div v-if="text" class="text-[13px] text-ink-gray-7">{{ text }}</div>
    </div>
    <button v-if="retry" class="gl-quick shrink-0" @click="$emit('retry')"><GlIcon name="refresh" :size="15" />{{ __('Zkusit znovu') }}</button>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'

defineProps({ title: { type: String, required: true }, text: { type: String, default: '' }, retry: { type: Boolean, default: true } })
defineEmits(['retry'])
</script>
