<template>
  <!-- GrowUp (design 2. kolo, O3): nová kampaň a úprava sekvence -->
  <Dialog v-model:open="show" :title="campaign ? __('Upravit sekvenci') : __('Nová kampaň')" :options="{ size: '3xl' }">
    <template #default>
      <div class="flex flex-col gap-4">
        <label>
          <span class="gl-label">{{ __('Název kampaně') }}</span>
          <input v-model="name" class="gl-field w-full" :placeholder="__('Např. Stavebnictví Praha – nový web')" />
        </label>
        <div>
          <span class="gl-label">{{ __('Sekvence kroků') }}</span>
          <div class="flex flex-col gap-2.5">
            <div v-for="(s, i) in steps" :key="s.id" class="flex flex-wrap items-center gap-2 rounded-2xl bg-[rgba(110,120,200,.08)] p-2.5">
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-ink-gray-7">{{ i + 1 }}</span>
              <select v-model="s.step_type" class="gl-field !w-[130px]" @change="s.template = ''">
                <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
              <label class="flex items-center gap-1.5 text-[13px] text-ink-gray-5">{{ __('den') }}
                <input v-model.number="s.day_offset" class="gl-field !w-[70px] tabular-nums" inputmode="numeric" />
              </label>
              <select v-model="s.template" class="gl-field min-w-[180px] flex-1">
                <option value="">{{ s.step_type === 'E-mail' ? __('Vyberte šablonu') : __('Bez šablony') }}</option>
                <option v-for="t in templatesFor(s.step_type)" :key="t.name" :value="t.name">{{ t.template_name }}</option>
              </select>
              <input v-if="s.step_type !== 'E-mail'" v-model="s.title" class="gl-field min-w-[160px] flex-1" :placeholder="__('Název úkolu, např. Zavolat')" />
              <button class="flex size-8 items-center justify-center rounded-full text-ink-gray-5 hover:bg-black/5" :aria-label="__('Odebrat krok')" @click="steps.splice(i, 1)"><GlIcon name="x" :size="15" /></button>
            </div>
          </div>
          <button class="mt-2 inline-flex items-center gap-2 px-1 py-1.5 text-[14px] font-semibold text-ink-gray-9 hover:text-[#4F46E5]" @click="addStep">
            <GlIcon name="plus" :size="16" class="text-ink-gray-5" />{{ __('Přidat krok') }}
          </button>
        </div>
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" :loading="saving" :label="campaign ? __('Uložit') : __('Vytvořit kampaň')" @click="save" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { api } from '@/composables/outreach'
import { Button, Dialog, ErrorMessage, createResource } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({ campaign: { type: String, default: '' } })
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })
const TYPES = ['E-mail', 'Hovor', 'LinkedIn']
let uid = 0
const mk = (o) => ({ id: ++uid, step_type: 'E-mail', day_offset: 0, template: '', title: '', ...o })

const name = ref('')
const steps = ref([])
const saving = ref(false)
const error = ref('')
const templates = createResource({ url: 'growupcrm.outreach.get_templates', auto: true })
const all = computed(() => templates.data || [])
const templatesFor = (t) => all.value.filter((x) => x.step_type === t)
const firstOf = (t) => templatesFor(t)[0]?.name || ''

function addStep() {
  const last = steps.value[steps.value.length - 1]
  steps.value.push(mk({ day_offset: last ? Number(last.day_offset || 0) + 3 : 0, template: '' }))
}

// výchozí sekvence z designu: e-mail den 0, telefonát den 3, follow-up den 7, LinkedIn den 10
function defaults() {
  steps.value = [
    mk({ step_type: 'E-mail', day_offset: 0, template: all.value.find((t) => t.category === 'Úvodní e-maily')?.name || firstOf('E-mail') }),
    mk({ step_type: 'Hovor', day_offset: 3, template: firstOf('Hovor'), title: __('Zavolat') }),
    mk({ step_type: 'E-mail', day_offset: 7, template: all.value.find((t) => t.category === 'Follow-up')?.name || '' }),
    mk({ step_type: 'LinkedIn', day_offset: 10, template: firstOf('LinkedIn'), title: __('Napsat na LinkedInu') }),
  ]
}

const detail = createResource({ url: 'growupcrm.outreach.get_campaign' })
async function load() {
  if (!props.campaign) return
  const d = await detail.fetch({ name: props.campaign, page_length: 1 })
  name.value = d.campaign_name
  steps.value = d.steps.map((s) => mk({ step_type: s.step_type, day_offset: s.day_offset, template: s.template || '', title: s.title || '' }))
}
watch(
  () => templates.data,
  (t) => {
    if (!t) return
    if (props.campaign) load()
    else if (!steps.value.length) defaults()
  },
  { immediate: true },
)

async function save() {
  error.value = ''
  saving.value = true
  try {
    const payload = steps.value.map((s) => ({ step_type: s.step_type, day_offset: Number(s.day_offset) || 0, template: s.template, title: s.title }))
    if (payload.some((s) => s.step_type === 'E-mail' && !s.template)) throw new Error(__('U e-mailových kroků vyberte šablonu.'))
    const n = await api('save_campaign', { campaign_name: name.value, steps: JSON.stringify(payload), name: props.campaign || undefined })
    show.value = false
    emit('saved', n)
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}
</script>
