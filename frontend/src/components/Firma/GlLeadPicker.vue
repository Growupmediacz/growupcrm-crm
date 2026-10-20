<template>
  <!-- GrowUp: k čemu záznam z Firmy patří – Zakázka firmy (uvidí ji i Zakázka, Úkoly, kalendář), nebo jen firma -->
  <div>
    <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Zakázka') }}</div>
    <select v-model="value" class="gl-field w-full">
      <option value="">{{ __('Bez zakázky (jen k firmě)') }}</option>
      <option v-for="l in leads" :key="l.name" :value="l.name">{{ l.order_title || l.lead_name || l.name }}{{ l.status ? ` · ${__(l.status)}` : '' }}</option>
    </select>
  </div>
</template>

<script setup>
defineProps({ leads: { type: Array, default: () => [] } })
const value = defineModel({ type: String, default: '' })
</script>
