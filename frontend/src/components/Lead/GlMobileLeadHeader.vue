<template>
  <!-- GrowUp (zadání 2027 E2, návrh e): nízká hlavička zakázky na telefonu. Název (max 2 řádky), firma · hodnota,
       čip fáze (otevře spodní panel ve stránce), teplota a jeden řádek „Další krok“ / „Bez dalšího kroku“.
       Místo LeadHero (průběh fázemi a velká karta) – LeadHero se tu nepoužívá. -->
  <header class="gl-mlh px-4 pb-3 pt-1">
    <h1 class="gl-mlh-title text-[22px] font-bold leading-tight tracking-tight text-ink-gray-9">{{ title }}</h1>
    <div class="mt-1 break-words text-[15px] text-ink-gray-7">
      <router-link
        v-if="doc.organization_link"
        :to="{ name: 'Organization', params: { organizationId: doc.organization_link } }"
        class="-my-[13px] inline-block max-w-full break-words py-[13px] font-medium text-[var(--accent-700)]"
      >{{ doc.organization || doc.organization_link }}</router-link>
      <span v-else>{{ doc.organization }}</span>
      <span v-if="doc.organization || doc.organization_link"> · </span>
      <b v-if="doc.order_value" class="num text-ink-gray-9">{{ money }}</b>
      <button v-else type="button" class="inline-flex min-h-[44px] items-center font-semibold text-[var(--accent-700)]" @click="emit('fill')">{{ __('Doplnit hodnotu') }}</button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" class="gl-mlh-stage" :aria-label="__('Změnit fázi: {0}', [__(doc.status)])" @click="emit('stage')">
        <span class="size-2 rounded-full" :style="{ background: stageColor }" aria-hidden="true" />
        {{ __(doc.status) }}
        <GlIcon name="down" :size="14" class="opacity-70" />
      </button>
      <GlTemperature :value="doc.temperature" :lead="doc.name" editable @changed="(v) => ((doc.temperature = v), emit('changed'))" />
    </div>

    <!-- jeden řádek: další krok (s kolečkem Hotovo) nebo upozornění -->
    <div v-if="next" class="gl-mlh-next mt-2" :class="overdue ? 'is-overdue' : ''">
      <GlIcon name="clock" :size="18" class="shrink-0" />
      <span class="min-w-0 flex-1 truncate">{{ __('Další krok') }}: {{ next.title }} · {{ dueLabel }}</span>
      <button type="button" class="gl-mlh-done" :aria-label="__('Hotovo')" @click="done"><GlIcon name="check" :size="18" /></button>
    </div>
    <button v-else-if="!doc.next_step && isOpen && tasks.data" type="button" class="gl-mlh-next is-empty mt-2 w-full text-left" @click="emit('plan')">
      <GlIcon name="alert" :size="18" class="shrink-0" />
      <span class="min-w-0 flex-1 truncate">{{ __('Bez dalšího kroku') }}</span>
      <span class="shrink-0 font-semibold">{{ __('Přidat úkol') }}</span>
    </button>
  </header>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlTemperature from '@/components/GlTemperature.vue'
import { statusesStore } from '@/stores/statuses'
import { formatDateCz, formatTimeCz } from '@/utils/glDate'
import { completeTaskWithUndo } from '@/composables/glTaskDone'
import { createListResource, toast } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  doc: { type: Object, required: true },
  title: { type: String, default: '' },
})
const emit = defineEmits(['changed', 'fill', 'plan', 'stage'])
const { leadStatuses } = statusesStore()

// barvy fází stejné jako v LeadHero (jen tečka čipu)
const STAGE_COLORS = { 'Nová': 'var(--stage-nova)', 'Kontaktováno': 'var(--stage-kontaktovano)', 'Nabídka odeslána': 'var(--stage-nabidka)', 'Jednání': 'var(--stage-jednani)', 'Vyhráno': 'var(--stage-vyhrano)', 'Prohráno': 'var(--stage-prohrano)' }
const stageColor = computed(() => STAGE_COLORS[props.doc.status] || 'var(--stage-prohrano)')
const money = computed(() => `${new Intl.NumberFormat('cs-CZ').format(props.doc.order_value || 0)} Kč`)
const isOpen = computed(() => {
  const s = (leadStatuses.data || []).find((x) => x.name === props.doc.status)
  return !!s && !['Won', 'Lost'].includes(s.type)
})

const tasks = createListResource({
  doctype: 'CRM Task',
  filters: {
    reference_doctype: 'CRM Lead',
    reference_docname: props.doc.name,
    status: ['not in', ['Done', 'Canceled']],
    due_date: ['is', 'set'],
  },
  fields: ['name', 'title', 'due_date'],
  orderBy: 'due_date asc',
  pageLength: 1,
  auto: true,
})
const next = computed(() => tasks.data?.[0])
const dueDate = computed(() => new Date(String(next.value.due_date).replace(' ', 'T')))
const overdue = computed(() => next.value && dueDate.value < new Date())
const dueLabel = computed(() => {
  const d = dueDate.value
  const s = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((s(d) - s(new Date())) / 86400000)
  const day = diff === 0 ? __('dnes') : diff === 1 ? __('zítra') : diff === -1 ? __('včera') : formatDateCz(d)
  return d.getHours() || d.getMinutes() ? `${day} ${formatTimeCz(d)}` : day
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
defineExpose({ reload: () => tasks.reload() })
</script>
<style scoped>
.gl-mlh-title { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.gl-mlh-stage {
  display: inline-flex; align-items: center; gap: 8px; min-height: var(--hit, 44px); padding: 0 14px;
  border-radius: 999px; font-size: 15px; font-weight: 600; color: var(--text-1); background: var(--accent-soft);
}
.gl-mlh-stage:focus-visible, .gl-mlh-done:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-mlh-next {
  display: flex; align-items: center; gap: 8px; min-height: var(--hit, 44px); padding: 0 6px 0 12px;
  border-radius: 14px; font-size: 14px; color: var(--text-1); background: var(--accent-soft);
}
.gl-mlh-next.is-empty { padding-right: 12px; }
.gl-mlh-next.is-overdue { color: var(--text-1); box-shadow: inset 0 0 0 1.5px var(--accent-600); }
.gl-mlh-done { display: grid; place-items: center; width: var(--hit, 44px); height: var(--hit, 44px); border-radius: 14px; color: var(--accent-700); }
.gl-mlh :deep(.gl-temp) { min-height: var(--hit, 44px); font-size: 13px; }
</style>
