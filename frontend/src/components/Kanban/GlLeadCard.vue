<template>
  <div class="flex flex-col gap-2">
    <!-- design 3. kolo (02): název, firma, kraj, další krok, hodnota a vlastník; zdroj je v detailu -->
    <div class="line-clamp-2 text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-ink-gray-9" :title="title">{{ title }}</div>
    <div v-if="lead.organization && lead.organization !== title" class="-mt-1 truncate text-[13.5px] text-ink-gray-5">
      {{ lead.organization }}
    </div>
    <!-- příchozí zakázka čeká na první odpověď -->
    <div v-if="response && response.tone !== 'ok' && lead.gl_response_state === 'Čeká'" class="self-start rounded-full px-2 py-0.5 text-[12px] font-semibold" :class="BADGE_TONE[response.tone]" :title="response.title">
      {{ response.text }}
    </div>
    <div v-if="lead.territory" class="flex items-center gap-1.5 text-[13px] text-ink-gray-5">
      <GlIcon name="pin" :size="14" />
      <span class="truncate">{{ lead.territory }}</span>
    </div>
    <div v-if="next" class="flex items-center gap-1.5 text-[13px] font-semibold" :class="nextClass">
      <GlIcon name="clock" :size="14" />
      <span class="truncate">{{ nextText }}</span>
    </div>
    <div v-else-if="lead.no_next_step" class="flex items-center gap-1.5 text-[13px] font-semibold text-[#9a5b00]">
      <GlIcon name="alert" :size="14" />
      <span class="truncate">{{ __('Bez dalšího kroku') }}</span>
    </div>
    <div class="mt-1.5 flex items-center justify-between gap-2">
      <div v-if="lead.order_value" class="num text-[17px] font-bold text-ink-gray-9">{{ money }}</div>
      <!-- oprava 7: bez hodnoty nenápadné „+ hodnota“ (otevře detail s kartou Detaily v úpravách) -->
      <button v-else class="text-[13px] font-medium text-ink-gray-4 hover:text-[var(--accent-600)]" @click.stop.prevent="fillValue">+ {{ __('hodnota') }}</button>
      <span class="flex shrink-0 items-center gap-1.5">
        <GlTemperature :value="lead.temperature" size="sm" />
        <UserAvatar v-if="lead.lead_owner" :user="lead.lead_owner" size="md" />
      </span>
    </div>
  </div>
</template>
<script setup>
import { BADGE_TONE, responseBadge } from '@/composables/responseTime'
// GrowUp: karta zakázky v Kanbanu (design Liquid Glass). Data dodává growupcrm.overrides.list_data.get_data.
import GlIcon from '@/components/GlIcon.vue'
import GlTemperature from '@/components/GlTemperature.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ lead: { type: Object, required: true } })
const response = computed(() => responseBadge(props.lead))

const title = computed(() => props.lead.order_title || props.lead.lead_name || props.lead.name)
const money = computed(() =>
  props.lead.order_value
    ? `${new Intl.NumberFormat('cs-CZ').format(props.lead.order_value)} Kč`
    : '',
)
const router = useRouter()
function fillValue() {
  router.push({ name: 'Lead', params: { leadId: props.lead.name }, query: { edit: 1 } })
}
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
  next.value.overdue ? 'text-[#a82614]' : next.value.kind === 'event' ? 'text-[#1f48b8]' : 'text-[#7a4400]',
)
</script>
