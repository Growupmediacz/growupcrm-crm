<template>
  <!-- GrowUp (design systém 2. kola): prázdný stav = ikona, jedna věta, co dělat, jedna akce. Vždy česky, nikdy „nic nenalezeno (Záznamy)“ -->
  <div class="flex flex-col items-center gap-2 rounded-[22px] bg-[rgba(110,120,200,.07)] px-6 py-9 text-center">
    <span class="flex size-12 items-center justify-center rounded-2xl bg-[rgba(79,70,229,.1)] text-[#4338ca]"><GlIcon :name="icon" :size="22" /></span>
    <div class="text-[16px] font-bold text-ink-gray-9">{{ title }}</div>
    <p v-if="text" class="max-w-[320px] text-[13px] leading-relaxed text-ink-gray-6">{{ text }}</p>
    <div v-if="$slots.default || action" class="mt-1">
      <slot>
        <button v-if="primary" class="inline-flex h-10 items-center gap-2 rounded-full bg-[#4F46E5] px-5 text-[14px] font-semibold text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,.6)]" @click="$emit('action')">{{ action }}</button>
        <button v-else class="gl-quick" @click="$emit('action')">{{ action }}</button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'

defineProps({
  icon: { type: String, default: 'inbox' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
  action: { type: String, default: '' },
  primary: { type: Boolean, default: false },
})
defineEmits(['action'])
</script>
