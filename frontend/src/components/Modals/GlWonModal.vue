<template>
  <!-- GrowUp: „Zakázka vyhrána“ (design). Rodič uloží stav, datum podpisu, hodnotu a poznámku. -->
  <Dialog v-model:open="show" :options="{ size: 'md' }">
    <template #body-title>
      <!-- design 3. kolo (25): vycentrovaná hlavička s pohárem, názvem a hodnotou zakázky -->
      <div class="relative flex w-full flex-col items-center pt-2 text-center">
        <div class="pointer-events-none absolute -top-10 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(34,179,94,.22),transparent)]" aria-hidden="true" />
        <span class="relative flex size-16 items-center justify-center rounded-[20px] bg-[#22b35e] text-white shadow-[0_10px_24px_-10px_rgba(34,179,94,.8)]">
          <GlIcon name="star" :size="30" />
        </span>
        <h3 class="relative mt-3 text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink-gray-9">{{ __('Zakázka vyhrána') }}</h3>
        <span class="relative mt-1 text-[14px] text-ink-gray-5">{{ subtitle }}</span>
        <span v-if="valueText" class="num relative mt-2 text-[30px] font-bold tracking-tight text-ink-gray-9">{{ valueText }} Kč</span>
      </div>
    </template>
    <template #default>
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="signedDate" type="date" :label="__('Datum podpisu')" :placeholder="__('Vyberte datum')" />
          <FormControl v-model="valueText" type="text" :label="__('Finální hodnota')">
            <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
          </FormControl>
        </div>
        <!-- agenturní moduly: „Co dál“ – projekt a retainer jako dvě karty -->
        <div v-if="agencyEnabled" class="flex flex-col gap-2">
          <div class="text-[15px] font-semibold text-ink-gray-9">{{ __('Co dál') }}</div>
          <div class="grid grid-cols-2 gap-3">
            <label
              class="relative flex cursor-pointer flex-col gap-2 rounded-[16px] border p-4 transition"
              :class="createProject ? 'border-[var(--accent-600)] bg-[var(--accent-soft)]' : 'border-[var(--field-border)] bg-white/70 hover:bg-white'"
            >
              <input v-model="createProject" type="checkbox" class="absolute right-3 top-3 size-4 rounded" />
              <GlIcon name="folder" :size="22" class="text-[var(--accent-600)]" />
              <span class="text-[15px] font-semibold text-ink-gray-9">{{ __('Založit projekt') }}</span>
              <span class="text-[12.5px] text-ink-gray-5">{{ projectHint }}</span>
              <div v-if="createProject" class="flex flex-wrap gap-1.5" @click.prevent>
                <button
                  v-for="t in templates.data || []"
                  :key="t.name"
                  type="button"
                  class="gl-chip flex h-8 items-center rounded-full px-3 text-[13px] font-medium"
                  :class="template === t.name && '!bg-[#0e1330] !text-white'"
                  @click="template = t.name"
                >
                  {{ __(t.name) }}
                </button>
              </div>
            </label>
            <label
              class="relative flex cursor-pointer flex-col gap-2 rounded-[16px] border p-4 transition"
              :class="createRetainer ? 'border-[var(--accent-600)] bg-[var(--accent-soft)]' : 'border-[var(--field-border)] bg-white/70 hover:bg-white'"
            >
              <input v-model="createRetainer" type="checkbox" class="absolute right-3 top-3 size-4 rounded" />
              <GlIcon name="refresh" :size="22" class="text-[var(--accent-600)]" />
              <span class="text-[15px] font-semibold text-ink-gray-9">{{ __('Založit retainer') }}</span>
              <span class="text-[12.5px] text-ink-gray-5">{{ __('Pravidelná měsíční platba') }}</span>
              <div v-if="createRetainer" @click.prevent>
                <FormControl v-model="retainerText" type="text" :placeholder="__('Např. 25 000')">
                  <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
                </FormControl>
              </div>
            </label>
          </div>
          <div v-if="lead.organization" class="flex items-center gap-2 rounded-[14px] bg-[rgba(34,179,94,.1)] px-3.5 py-2.5 text-[13px] text-[#15803d]">
            <span class="size-2 rounded-full bg-[#22b35e]" />{{ __('Firma {0} se přesune mezi Klienty.', [lead.organization]) }}
          </div>
        </div>
        <FormControl v-model="note" type="textarea" :rows="3" :label="__('Poznámka')" :placeholder="__('Např. podpis na schůzce, fakturace 50 % předem')" />
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" iconLeft="check" :label="__('Potvrdit výhru')" :loading="saving" @click="confirm" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { agencyEnabled } from '@/composables/agency'
import { Button, Dialog, ErrorMessage, FormControl, Switch, createResource } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({
  lead: { type: Object, required: true },
  // async (values) => void; chyba se ukáže v dialogu
  onConfirm: { type: Function, required: true },
})
const show = defineModel({ type: Boolean })

const today = new Date()
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const signedDate = ref(props.lead.signed_date || iso(today))
const valueText = ref(props.lead.order_value ? new Intl.NumberFormat('cs-CZ').format(props.lead.order_value) : '')
const note = ref('')
const saving = ref(false)
const error = ref('')

const createProject = ref(false)
const createRetainer = ref(false)
const template = ref('')
const retainerText = ref('')
const templates = createResource({
  url: 'growupcrm.projects.get_templates',
  auto: agencyEnabled.value,
  onSuccess(rows) {
    if (!template.value && rows.length) template.value = rows[0].name
  },
})
const projectHint = computed(() => {
  if (!createProject.value) return __('Projekt s úkoly ze šablony')
  const t = (templates.data || []).find((x) => x.name === template.value)
  return t ? `${props.lead.order_title || props.lead.lead_name || ''} · ${__('šablona')} ${__(t.name)}` : ''
})

const subtitle = computed(() =>
  [props.lead.order_title || props.lead.lead_name, props.lead.organization].filter(Boolean).join(' · '),
)

async function confirm() {
  error.value = ''
  const value = Number(String(valueText.value).replace(/[^\d,.-]/g, '').replace(',', '.'))
  saving.value = true
  try {
    await props.onConfirm({
      signed_date: signedDate.value || null,
      order_value: Number.isFinite(value) && value > 0 ? value : props.lead.order_value || 0,
      note: note.value.trim(),
      project_template: agencyEnabled.value && createProject.value ? template.value : null,
      retainer_amount: agencyEnabled.value && createRetainer.value
        ? Number(String(retainerText.value).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
        : 0,
    })
    show.value = false
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
  } finally {
    saving.value = false
  }
}
</script>
