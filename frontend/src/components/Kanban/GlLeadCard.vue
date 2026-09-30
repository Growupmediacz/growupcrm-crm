<template>
  <div class="flex flex-col gap-2">
    <div class="text-[15px] font-bold leading-snug text-ink-gray-9">{{ title }}</div>
    <div v-if="lead.organization && lead.organization !== title" class="truncate text-[13px] text-ink-gray-5">
      {{ lead.organization }}
    </div>
    <div v-if="lead.territory" class="flex items-center gap-1.5 text-[13px] text-ink-gray-5">
      <GlIcon name="pin" :size="14" />
      <span class="truncate">{{ lead.territory }}</span>
    </div>
    <div v-if="next" class="flex items-center gap-1.5 text-[13px] font-semibold" :class="nextClass">
      <GlIcon name="clock" :size="14" />
      <span class="truncate">{{ nextText }}</span>
    </div>
    <div class="mt-1 flex items-center justify-between gap-2">
      <div class="num text-[15px] font-bold text-ink-gray-9">{{ money }}</div>
      <UserAvatar v-if="lead.lead_owner" :user="lead.lead_owner" size="md" />
    </div>
  </div>
</template>
<script setup>
// GrowUp: karta zakázky v Kanbanu (design Liquid Glass). Data dodává growupcrm.overrides.list_data.get_data.
import GlIcon from '@/components/GlIcon.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { computed } from 'vue'

const props = defineProps({ lead: { type: Object, required: true } })

const title = computed(() => props.lead.order_title || props.lead.lead_name || props.lead.name)
const money = computed(() =>
  props.lead.order_value
    ? `${new Intl.NumberFormat('cs-CZ').format(props.lead.order_value)} Kč`
    : '–',
)
const next = computed(() => props.lead.next_action)

function dayLabel(iso) {
  const d = new Date(String(iso).replace(' ', 'T'))
  const today = new Date()
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(d) - start(today)) / 86400000)
  if (diff === 0) return 'dnes'
  if (diff === -1) return 'včera'
  if (diff === 1) return 'zítra'
  if (diff < 0) return `před ${-diff} dny`
  return `${d.getDate()}. ${d.getMonth() + 1}.`
}
const nextText = computed(() =>
  next.value.kind === 'event'
    ? `Schůzka ${dayLabel(next.value.at)}`
    : `${next.value.label} – ${dayLabel(next.value.at)}`,
)
const nextClass = computed(() =>
  next.value.overdue ? 'text-[#c8321f]' : next.value.kind === 'event' ? 'text-[#2e5bd8]' : 'text-[#915200]',
)
</script>
