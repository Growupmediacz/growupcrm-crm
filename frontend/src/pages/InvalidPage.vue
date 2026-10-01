<template>
  <!-- GrowUp (design 2. kolo, C9): 404 – stránka neexistuje -->
  <div class="grid h-full place-items-center px-4 py-16">
    <div class="gl-card flex w-full max-w-[600px] flex-col items-center gap-3 !rounded-[34px] px-8 py-12 text-center">
      <div class="bg-gradient-to-b from-[#6e6af6] to-[#4338ca] bg-clip-text text-[72px] font-extrabold leading-none tracking-tight text-transparent">404</div>
      <h1 class="text-[26px] font-bold tracking-tight text-ink-gray-9">{{ __('Tahle stránka neexistuje') }}</h1>
      <p class="max-w-[440px] text-[16px] leading-relaxed text-ink-gray-7">{{ __('Odkaz je možná starý nebo záznam někdo smazal. Zkuste ho najít přes hledání.') }}</p>
      <div class="mt-2 flex flex-wrap justify-center gap-3">
        <button class="gl-quick !h-12 !px-5 !text-[15px]" @click="openSearch"><GlIcon name="search" :size="16" />{{ __('Hledat') }} ⌘K</button>
        <router-link :to="{ name: 'Today' }" class="inline-flex h-12 items-center rounded-full bg-[#4F46E5] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,.7)]">{{ __('Zpět na Dnes') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'

// hledání ⌘K poslouchá klávesovou zkratku, proto ji stejně vyvoláme
const openSearch = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }))
</script>
