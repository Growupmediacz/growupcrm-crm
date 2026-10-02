<template>
  <!-- GrowUp (design 2. kolo, C6): karta Tarif a Uživatelé (obsazená místa). Data: growupcrm.plans.seat_usage
       (obsazená místa = aktivní uživatelé + čekající pozvánky). -->
  <div v-if="usage.data" class="mt-3 grid gap-3 sm:grid-cols-[1.6fr_1fr]">
    <div class="rounded-[20px] bg-[rgba(110,120,200,.09)] p-5">
      <div class="text-[12px] font-semibold text-ink-gray-5">{{ __('Tarif') }}</div>
      <div class="text-[24px] font-bold tracking-tight text-ink-gray-9">{{ usage.data.name }}</div>
      <div class="mt-1 text-[13px] text-ink-gray-6">
        {{ usage.data.max_users ? __('až {0} uživatelů', [usage.data.max_users]) : __('bez limitu uživatelů') }}<template v-if="usage.data.price"> · {{ usage.data.price }} Kč / {{ __('měsíc') }}</template>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <a :href="`mailto:${usage.data.contact_email}?subject=${encodeURIComponent('GrowUpCRM – změna tarifu')}`" class="gl-quick">{{ __('Změnit tarif') }}</a>
      </div>
    </div>
    <div class="rounded-[20px] bg-[rgba(110,120,200,.09)] p-5">
      <div class="text-[12px] font-semibold text-ink-gray-5">{{ __('Uživatelé') }}</div>
      <div class="num text-[28px] font-bold leading-tight text-ink-gray-9" :class="full && '!text-[#a82614]'">
        {{ usage.data.used }}<span v-if="usage.data.max_users" class="text-[18px] font-medium text-ink-gray-5"> / {{ usage.data.max_users }}</span>
      </div>
      <div v-if="usage.data.max_users" class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(110,120,200,.2)]">
        <div class="h-full rounded-full" :class="full ? 'bg-[#c8321f]' : 'bg-[#4F46E5]'" :style="{ width: `${Math.min(100, (usage.data.used * 100) / usage.data.max_users)}%` }" />
      </div>
      <div class="mt-1.5 text-[12px] text-ink-gray-5">{{ free }}</div>
    </div>
  </div>
</template>
<script setup>
import { createResource } from 'frappe-ui'
import { computed, watch } from 'vue'

const props = defineProps({ refreshKey: { type: [Number, String], default: 0 } })

const usage = createResource({ url: 'growupcrm.plans.seat_usage', auto: true })
const full = computed(() => usage.data?.max_users && usage.data.used >= usage.data.max_users)
const free = computed(() => {
  if (!usage.data?.max_users) return __('místa bez omezení')
  const n = usage.data.max_users - usage.data.used
  return n <= 0 ? __('tarif je plný') : n === 1 ? __('1 volné místo') : n < 5 ? __('{0} volná místa', [n]) : __('{0} volných míst', [n])
})

watch(() => props.refreshKey, () => usage.reload())
</script>
