<template>
  <!-- GrowUp: „Nový klient“ (design). Data: growupcrm.clients.create_client -->
  <Dialog v-model:open="show" :title="__('Nový klient')" :options="{ size: 'lg' }">
    <template #default>
      <div class="flex flex-col gap-4">
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Firma') }}</div>
          <GlOrgPicker v-model="org" />
          <div class="mt-1 text-[12px] text-ink-gray-5">{{ __('Vybírejte z firem v CRM, nebo firmu nejdřív založte.') }}</div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="start" type="date" :label="__('Začátek spolupráce')" :placeholder="__('Vyberte datum')" />
          <FormControl v-model="responsible" type="select" :label="__('Odpovědná osoba')" :options="userOptions" />
        </div>
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Typ spolupráce') }}</div>
          <div class="gl-seg flex w-full">
            <button
              v-for="k in KINDS"
              :key="k"
              type="button"
              class="gl-seg-btn flex-1 justify-center"
              :class="kind === k && 'gl-seg-on'"
              @click="kind = k"
            >
              {{ __(k) }}
            </button>
          </div>
        </div>
        <FormControl v-if="kind === 'Měsíční retainer'" v-model="amount" type="text" :label="__('Měsíční částka')" :placeholder="__('Např. 35 000')">
          <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
        </FormControl>
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Služby') }}</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in SERVICES"
              :key="s"
              type="button"
              class="gl-chip flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium"
              :class="services.includes(s) && '!bg-[#0e1330] !text-white'"
              @click="toggle(s)"
            >
              {{ __(s) }}
            </button>
          </div>
        </div>
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" :label="__('Přidat klienta')" :loading="saving" @click="save" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlOrgPicker from '@/components/GlOrgPicker.vue'
import { sessionStore } from '@/stores/session'
import { Button, Dialog, ErrorMessage, FormControl, call, createResource, toast } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({ organization: { type: Object, default: null } })
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const KINDS = ['Jednorázový projekt', 'Měsíční retainer']
const SERVICES = ['Web', 'Sociální sítě', 'Reklama', 'Video', 'Leadgen']

const today = new Date()
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const org = ref(props.organization)
const start = ref(iso(today))
const responsible = ref(sessionStore().user)
const kind = ref('Měsíční retainer')
const amount = ref('')
const services = ref([])
const saving = ref(false)
const error = ref('')

const users = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const userOptions = computed(() => (users.data || []).map((u) => ({ label: u.full_name || u.name, value: u.name })))

function toggle(s) {
  services.value = services.value.includes(s) ? services.value.filter((x) => x !== s) : [...services.value, s]
}

async function save() {
  error.value = ''
  if (!org.value) {
    error.value = __('Vyberte firmu.')
    return
  }
  const value = Number(String(amount.value).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
  if (kind.value === 'Měsíční retainer' && value <= 0) {
    error.value = __('Vyplňte měsíční částku retaineru.')
    return
  }
  saving.value = true
  try {
    await call('growupcrm.clients.create_client', {
      organization: org.value.name,
      start_date: start.value,
      responsible: responsible.value,
      kind: kind.value,
      amount: value,
      services: services.value,
    })
    toast.success(__('{0} je teď klient', [org.value.label]))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
  } finally {
    saving.value = false
  }
}
</script>
