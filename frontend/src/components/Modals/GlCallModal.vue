<template>
  <!-- GrowUp: „Zapsat hovor“ (design). Data: growupcrm.calls.log_call -->
  <Dialog v-model:open="show" :options="{ size: 'lg' }">
    <template #body-title>
      <!-- design 3. kolo (24): oranžová ikona telefonu v hlavičce -->
      <div class="flex items-center gap-3.5">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#f97316] text-white shadow-[0_8px_18px_-8px_rgba(249,115,22,.7)]"><GlIcon name="phone" :size="22" /></span>
        <div class="flex min-w-0 flex-col">
          <h3 class="text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink-gray-9">{{ __('Zapsat hovor') }}</h3>
          <span v-if="leadTitle" class="truncate text-[13px] text-ink-gray-5">{{ [person.name, leadTitle].filter(Boolean).join(' · ') }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <div class="flex flex-col gap-4">
        <!-- z Firmy: k Zakázce firmy, nebo jen k firmě -->
        <GlLeadPicker v-if="organization" v-model="pickedLead" :leads="leads" />
        <div class="flex items-center gap-3 rounded-2xl bg-[rgba(110,120,200,.08)] px-4 py-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[12px] font-bold text-[#2440a6]">
            {{ initials(person.name || leadTitle) }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[15px] font-semibold text-ink-gray-9">{{ person.name || leadTitle }}</div>
            <div class="truncate text-[12.5px] text-ink-gray-5">{{ [person.phone, person.role].filter(Boolean).join(' · ') }}</div>
          </div>
          <span class="num flex items-center gap-1 rounded-full bg-[rgba(91,91,246,.12)] px-2.5 py-1 text-[13px] font-bold text-[#4644d9]">
            <GlIcon name="clock" :size="14" />{{ timer }}
          </span>
        </div>

        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Jak hovor dopadl?') }}</div>
          <div class="gl-seg flex w-full">
            <button
              v-for="o in OUTCOMES"
              :key="o.value"
              type="button"
              class="gl-seg-btn flex-1 justify-center"
              :class="outcome === o.value && 'gl-seg-on !bg-[var(--accent-600)] !text-white'"
              @click="outcome = o.value"
            >
              {{ o.label }}
            </button>
          </div>
        </div>

        <FormControl v-model="note" type="textarea" :label="__('Poznámka')" :rows="3" :placeholder="__('Co zaznělo, na čem jste se domluvili…')" />

        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Další krok') }}</div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="c in CHOICES"
              :key="c.value"
              type="button"
              class="gl-chip flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium"
              :class="choice === c.value && '!bg-[#0e1330] !text-white'"
              @click="choice = c.value"
            >
              {{ c.label }}
            </button>
            <FormControl v-if="choice === 'custom'" v-model="customDate" type="date" class="w-40" :placeholder="__('Vyberte datum')" />
          </div>
        </div>

        <label class="flex cursor-pointer items-center justify-between gap-3">
          <span class="flex flex-col">
            <span class="text-[15px] text-ink-gray-9">{{ __('Vytvořit úkol v kalendáři') }}</span>
            <span class="text-[12.5px] text-ink-gray-5">{{ taskHint }}</span>
          </span>
          <Switch v-model="createTask" />
        </label>

        <label v-if="nextStage" class="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink-gray-9">
          <input v-model="moveStage" type="checkbox" class="size-4 rounded" />
          {{ __('Posunout zakázku do fáze') }}
          <span class="flex items-center gap-1.5 font-semibold"><span class="size-2 rounded-full" :style="{ background: stageHex(nextStage.color) }" />{{ __(nextStage.name) }}</span>
        </label>

        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" :label="__('Uložit hovor')" :loading="saving" @click="save" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlLeadPicker from '@/components/Firma/GlLeadPicker.vue'
import { usersStore } from '@/stores/users'
import { statusesStore } from '@/stores/statuses'
import { stageHex } from '@/utils/glStage'
import { Button, Dialog, ErrorMessage, FormControl, Switch, call, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  lead: { type: Object, default: () => ({}) },
  person: { type: Object, default: () => ({}) },
  // z Firmy: název firmy, její Zakázky pro výběr a předvybraná Zakázka
  organization: { type: String, default: '' },
  organizationName: { type: String, default: '' },
  leads: { type: Array, default: () => [] },
  defaultLead: { type: String, default: '' },
})
const pickedLead = ref(props.defaultLead)
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const { getUser } = usersStore()

const OUTCOMES = [
  { value: 'reached', label: __('Dovolal jsem se') },
  { value: 'no_answer', label: __('Nebral') },
  { value: 'call_back', label: __('Zavolat zpět') },
]
const CHOICES = [
  { value: 'tomorrow', label: __('Zítra') },
  { value: '3days', label: __('Za 3 dny') },
  { value: 'week', label: __('Příští týden') },
  { value: 'custom', label: __('Vybrat datum…') },
]

const outcome = ref('reached')

// posun zakázky do další otevřené fáze (ne Vyhráno/Prohráno – ty mají vlastní dialog)
const { leadStatuses } = statusesStore()
const nextStage = computed(() => {
  if (props.organization || !props.lead?.status) return null
  const list = leadStatuses.data || []
  const i = list.findIndex((x) => x.name === props.lead.status)
  const next = i >= 0 ? list[i + 1] : null
  return next && !['Won', 'Lost'].includes(next.type) ? next : null
})
const moveStage = ref(false)
const note = ref('')
const choice = ref('week')
const customDate = ref('')
const createTask = ref(true)
const saving = ref(false)
const error = ref('')

const leadTitle = computed(() => props.lead.order_title || props.lead.lead_name || props.lead.organization || props.organizationName || '')

// běžící čas hovoru (dialog se otevírá při volání)
const started = Date.now()
const seconds = ref(0)
const tick = setInterval(() => (seconds.value = Math.round((Date.now() - started) / 1000)), 1000)
onBeforeUnmount(() => clearInterval(tick))
const timer = computed(() => `${Math.floor(seconds.value / 60)}:${String(seconds.value % 60).padStart(2, '0')}`)

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const nextDate = computed(() => {
  const d = new Date()
  if (choice.value === 'tomorrow') d.setDate(d.getDate() + 1)
  else if (choice.value === '3days') d.setDate(d.getDate() + 3)
  else if (choice.value === 'week') d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  else return customDate.value || ''
  return iso(d)
})
const taskHint = computed(() => {
  if (!nextDate.value) return __('Vyberte datum dalšího kroku')
  const d = new Date(nextDate.value + 'T09:00')
  const day = d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })
  return `${day} · ${getUser().full_name}`
})

const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

async function save() {
  error.value = ''
  if (createTask.value && !nextDate.value) {
    error.value = __('Vyberte datum dalšího kroku, nebo vypněte vytvoření úkolu.')
    return
  }
  saving.value = true
  try {
    await call('growupcrm.calls.log_call', {
      lead: props.organization ? pickedLead.value || null : props.lead.name,
      organization: props.organization || null,
      outcome: outcome.value,
      phone: props.person.phone,
      note: note.value,
      next_date: nextDate.value,
      create_task: createTask.value ? 1 : 0,
      duration: seconds.value,
    })
    if (moveStage.value && nextStage.value) {
      await call('frappe.client.set_value', { doctype: 'CRM Lead', name: props.lead.name, fieldname: 'status', value: nextStage.value.name })
    }
    toast.success(__('Hovor byl zapsán'))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
  } finally {
    saving.value = false
  }
}
</script>
