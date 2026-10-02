<template>
  <!-- GrowUp (design 2. kolo, O1/O3): tabulka kampaní se stavem, postupem a počtem odpovědí -->
  <div class="gl-card p-5 md:p-6">
    <div class="mb-2 flex items-baseline justify-between">
      <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Kampaně') }}</h2>
      <button class="gl-fill text-[15px]" @click="$emit('new')">{{ __('Nová kampaň') }}</button>
    </div>
    <p v-if="!rows.length" class="py-8 text-center text-[14px] text-ink-gray-5">{{ __('Zatím žádná kampaň. Založte první a přidejte do ní kontakty z CRM.') }}</p>
    <div v-else class="flex flex-col">
      <div class="hidden grid-cols-[1fr_110px_190px_80px] gap-3 pb-1 text-[12px] font-semibold text-ink-gray-5 md:grid">
        <span>{{ __('Kampaň') }}</span><span>{{ __('Stav') }}</span><span>{{ __('Postup') }}</span><span class="text-right">{{ __('Odpovědi') }}</span>
      </div>
      <router-link
        v-for="c in rows"
        :key="c.name"
        :to="{ name: 'OutreachCampaign', params: { name: c.name } }"
        class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t border-[rgba(110,120,200,.12)] py-3 first:border-0 md:grid-cols-[1fr_110px_190px_80px]"
      >
        <span class="min-w-0">
          <span class="block truncate text-[16px] font-bold text-ink-gray-9">{{ c.campaign_name }}</span>
          <span class="block truncate text-[13px] text-ink-gray-5">{{ __('{0} kontaktů · krok {1} ze {2}', [c.contacts, Math.min(c.step, c.steps), c.steps]) }}</span>
        </span>
        <span class="flex items-center gap-1.5 text-[14px] font-medium text-ink-gray-9 md:order-none">
          <span class="size-2 rounded-full" :style="{ background: STATUS[c.status] }" />{{ __(c.status) }}
        </span>
        <span class="col-span-2 flex items-center gap-2 md:col-span-1">
          <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><span class="block h-full rounded-full bg-[#4F46E5]" :style="{ width: `${c.progress}%` }" /></span>
          <span class="num w-10 text-right text-[12px] text-ink-gray-5">{{ c.progress }} %</span>
        </span>
        <span class="num hidden text-right text-[15px] font-bold text-ink-gray-9 md:block">{{ c.replies }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
defineProps({ rows: { type: Array, default: () => [] } })
defineEmits(['new'])
const STATUS = { 'Běží': '#22b35e', Pozastaveno: '#e0a100', Koncept: '#9ca3af', 'Dokončeno': '#3b30b8' }
</script>
