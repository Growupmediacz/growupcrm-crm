<template>
  <!-- GrowUp: „Zakázka vyhrána“ (design). Rodič uloží stav, datum podpisu, hodnotu a poznámku. -->
  <Dialog v-model:open="show" :options="{ size: 'md' }">
    <template #body-title>
      <div class="flex items-center gap-3">
        <span class="flex size-11 items-center justify-center rounded-2xl bg-[#dcf5e6] text-[#15803d]">
          <GlIcon name="star" :size="20" />
        </span>
        <div class="flex flex-col">
          <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">{{ __('Zakázka vyhrána') }}</h3>
          <span class="mt-1 text-[13px] text-ink-gray-5">{{ subtitle }}</span>
        </div>
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
        <!-- agenturní moduly: projekt a retainer rovnou z výhry -->
        <div v-if="agencyEnabled" class="flex flex-col gap-3 rounded-2xl bg-[rgba(110,120,200,.08)] p-4">
          <label class="flex cursor-pointer items-center justify-between gap-3">
            <span class="flex flex-col">
              <span class="text-[15px] text-ink-gray-9">{{ __('Založit projekt') }}</span>
              <span class="text-[12.5px] text-ink-gray-5">{{ projectHint }}</span>
            </span>
            <Switch v-model="createProject" />
          </label>
          <div v-if="createProject" class="flex flex-wrap gap-1.5">
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
          <label class="flex cursor-pointer items-center justify-between gap-3">
            <span class="flex flex-col">
              <span class="text-[15px] text-ink-gray-9">{{ __('Opakovaná platba') }}</span>
              <span class="text-[12.5px] text-ink-gray-5">{{ __('Měsíční retainer') }}</span>
            </span>
            <Switch v-model="createRetainer" />
          </label>
          <FormControl v-if="createRetainer" v-model="retainerText" type="text" :placeholder="__('Měsíční částka, např. 25 000')">
            <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
          </FormControl>
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
