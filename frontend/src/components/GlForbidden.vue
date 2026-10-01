<template>
  <!-- GrowUp (design 2. kolo, C9): „Sem nemáte přístup“ místo holé chyby -->
  <div class="grid h-full place-items-center px-4 py-16">
    <div class="gl-card flex w-full max-w-[600px] flex-col items-center gap-3 !rounded-[34px] px-8 py-12 text-center">
      <GlIcon name="lock" :size="46" class="text-[#4F46E5]" />
      <h1 class="text-[26px] font-bold tracking-tight text-ink-gray-9">{{ __('Sem nemáte přístup') }}</h1>
      <p class="max-w-[460px] text-[16px] leading-relaxed text-ink-gray-7">{{ message || __('Tuhle část vidí jen správci. Pokud ji potřebujete, požádejte o změnu role.') }}</p>
      <div class="mt-2 flex flex-wrap justify-center gap-3">
        <a :href="`mailto:${contact}?subject=${encodeURIComponent('GrowUpCRM – žádost o přístup')}`" class="gl-quick !h-12 !px-5 !text-[15px]"><GlIcon name="mail" :size="16" />{{ __('Požádat o přístup') }}</a>
        <router-link :to="{ name: 'Today' }" class="inline-flex h-12 items-center rounded-full bg-[#4F46E5] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,.7)]">{{ __('Zpět na Dnes') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'

defineProps({ message: { type: String, default: '' } })
const contact = 'dancenko@growupmedia.cz'
</script>
