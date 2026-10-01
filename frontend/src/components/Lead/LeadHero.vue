<template>
  <div class="gl-card" :class="compact ? 'p-4' : 'p-6'">
    <div class="flex items-start justify-between gap-6">
      <div class="min-w-0">
        <div class="flex items-center gap-2 text-[13px] font-medium text-ink-gray-7">
          <span class="dot size-2 rounded-full" :style="{ background: stageColor }" />
          {{ __(doc.status) }}
        </div>
        <h1 class="mt-1 truncate font-bold leading-tight tracking-tight text-ink-gray-9" :class="compact ? 'text-[24px]' : 'text-[34px]'">
          {{ doc.order_title || doc.lead_name || doc.name }}
        </h1>
        <div class="mt-1 truncate text-[17px] text-ink-gray-7">
          <router-link
            v-if="doc.organization_link"
            :to="{ name: 'Organization', params: { organizationId: doc.organization_link } }"
            class="hover:text-ink-gray-9"
          >
            {{ doc.organization || doc.organization_link }}
          </router-link>
          <span v-else>{{ doc.organization }}</span>
          <span v-if="person"> · {{ person }}</span>
        </div>
      </div>
      <div class="shrink-0 text-right">
        <div class="text-[13px] text-ink-gray-5">{{ __('Hodnota') }}</div>
        <div v-if="doc.order_value" class="num font-bold leading-tight tracking-tight text-ink-gray-9" :class="compact ? 'text-[22px]' : 'text-[38px]'">{{ money }}</div>
        <!-- oprava 7: prázdná hodnota = tlumené „Bez hodnoty“ + „Doplnit“ -->
        <template v-else>
          <div class="font-semibold leading-tight text-[var(--empty-color,#5B6285)]" :class="compact ? 'text-[16px]' : 'text-[20px]'">{{ __('Bez hodnoty') }}</div>
          <button class="gl-fill" @click="emit('fill')">{{ __('Doplnit') }}</button>
        </template>
      </div>
    </div>

    <div class="mt-5 grid gap-2" :style="{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }">
      <button
        v-for="(s, i) in stages"
        :key="s.name"
        class="flex flex-col gap-2 text-left"
        :aria-label="__('Posunout do fáze {0}', [__(s.name)])"
        @click="move(s)"
      >
        <span class="h-1.5 rounded-full" :style="{ background: i <= currentIndex ? '#4f46e5' : 'rgba(110,120,200,.16)' }" />
        <span v-if="!compact || i === currentIndex" class="text-[13px]" :class="i === currentIndex ? 'font-bold text-ink-gray-9' : 'text-ink-gray-5'">{{ __(s.name) }}</span>
      </button>
    </div>

    <div
      v-if="next"
      class="mt-5 flex items-center gap-4 rounded-[18px] px-4 py-3"
      :class="overdue ? 'bg-[rgba(200,50,31,.09)]' : 'bg-[rgba(224,161,0,.14)]'"
    >
      <GlIcon name="clock" :size="22" :class="overdue ? 'text-[#c8321f]' : 'text-[#915200]'" />
      <div class="min-w-0 flex-1">
        <div class="truncate text-[16px] font-bold" :class="overdue ? 'text-[#c8321f]' : 'text-[#915200]'">
          {{ __('Další krok') }}: {{ next.title }}
        </div>
        <div class="truncate text-[13px] text-ink-gray-7">{{ nextSub }}</div>
      </div>
      <button
        class="inline-flex h-9 items-center gap-2 rounded-full bg-white/80 px-4 text-[14px] font-semibold text-ink-gray-9 shadow-[0_2px_10px_-4px_rgba(64,72,160,.3)] hover:bg-white"
        @click="done"
      >
        <GlIcon name="check" :size="16" />{{ __('Hotovo') }}
      </button>
    </div>
  </div>
</template>
<script setup>
// GrowUp: hlavička detailu zakázky (design Liquid Glass): název, hodnota, průběh fázemi a další krok.
import GlIcon from '@/components/GlIcon.vue'
import { statusesStore } from '@/stores/statuses'
import { htmlToText } from '@/utils'
import { formatDateCz, formatTimeCz } from '@/utils/glDate'
import { usersStore } from '@/stores/users'
import { completeTaskWithUndo } from '@/composables/glTaskDone'
import { call, createListResource, toast } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  doc: { type: Object, required: true },
  stageOptions: { type: Array, default: () => [] },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['changed', 'fill'])

const { leadStatuses } = statusesStore()

// Fáze průběhu: všechny kromě „prohráno“ (ta je vedlejší větev)
const stages = computed(() =>
  (leadStatuses.data || []).filter((s) => s.type !== 'Lost' && !/prohr/i.test(s.name)),
)
const currentIndex = computed(() => stages.value.findIndex((s) => s.name === props.doc.status))
const STAGE_COLORS = {
  'Nová': '#3b82f6',
  'Kontaktováno': '#8b5cf6',
  'Nabídka odeslána': '#e0a100',
  'Jednání': '#f97316',
  'Vyhráno': '#22b35e',
  'Prohráno': '#9ca3af',
}
const stageColor = computed(() => STAGE_COLORS[props.doc.status] || '#9ca3af')
const person = computed(() => [props.doc.first_name, props.doc.last_name].filter(Boolean).join(' '))
const money = computed(() =>
  props.doc.order_value ? `${new Intl.NumberFormat('cs-CZ').format(props.doc.order_value)} Kč` : '',
)

function move(stage) {
  if (stage.name === props.doc.status) return
  const opt = props.stageOptions.find((o) => (o.value || o.label) === stage.name)
  opt?.onClick?.()
}

const tasks = createListResource({
  doctype: 'CRM Task',
  filters: {
    reference_doctype: 'CRM Lead',
    reference_docname: props.doc.name,
    status: ['not in', ['Done', 'Canceled']],
    due_date: ['is', 'set'],
  },
  fields: ['name', 'title', 'description', 'due_date', 'assigned_to'],
  orderBy: 'due_date asc',
  pageLength: 1,
  auto: true,
})
const next = computed(() => tasks.data?.[0])
const overdue = computed(() => next.value && new Date(String(next.value.due_date).replace(' ', 'T')) < new Date())
const plain = computed(() => htmlToText(next.value?.description || ''))
const dueLabel = computed(() => {
  const d = new Date(String(next.value.due_date).replace(' ', 'T'))
  const s = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((s(d) - s(new Date())) / 86400000)
  if (diff === 0) return 'dnes'
  if (diff === 1) return 'zítra'
  if (diff === -1) return 'včera'
  return formatDateCz(d)
})

const { getUser } = usersStore()
const nextSub = computed(() => {
  const d = new Date(String(next.value.due_date).replace(' ', 'T'))
  const time = d.getHours() || d.getMinutes() ? ` ${formatTimeCz(d)}` : ''
  const who = next.value.assigned_to ? getUser(next.value.assigned_to)?.full_name : ''
  return [`${dueLabel.value}${time}`, who].filter(Boolean).join(' · ') + (plain.value ? ` · ${plain.value}` : '')
})

async function done() {
  try {
    await completeTaskWithUndo(next.value.name, next.value.title, () => {
      tasks.reload()
      emit('changed')
    })
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}
</script>
