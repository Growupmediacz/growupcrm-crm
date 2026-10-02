<template>
  <!-- GrowUp: „Nový projekt“ (design). Data: growupcrm.projects.create_project -->
  <Dialog v-model:open="show" :title="__('Nový projekt')" :options="{ size: 'xl' }">
    <template #default>
      <div class="flex flex-col gap-4">
        <FormControl v-model="title" type="text" :label="__('Název projektu')" :placeholder="__('Např. Rebranding a web')" />
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Klient') }}</div>
            <GlOrgPicker v-model="org" :placeholder="__('Vyberte klienta')" />
          </div>
          <FormControl v-model="lead" type="select" :label="__('Navázat na zakázku')" :options="leadOptions" :disabled="!org" />
        </div>
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Šablona') }}</div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              v-for="t in templates.data || []"
              :key="t.name"
              type="button"
              class="flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[14px] font-bold transition"
              :class="template === t.name ? 'border-[#4f46e5] bg-[rgba(79,70,229,.08)] text-[#3b30b8]' : 'border-white/90 bg-white/70 text-ink-gray-9 hover:bg-white'"
              @click="pickTemplate(t)"
            >
              <GlIcon :name="ICONS[t.icon] || 'edit'" :size="20" />{{ __(t.name) }}
            </button>
          </div>
          <div class="mt-1 text-[12px] text-ink-gray-5">{{ templateHint }}</div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="start" type="date" :label="__('Začátek')" :placeholder="__('Vyberte datum')" />
          <FormControl v-model="deadline" type="date" :label="__('Termín')" :placeholder="__('Vyberte datum')" />
        </div>
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Tým') }}</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="u in users.data || []"
              :key="u.name"
              type="button"
              class="gl-chip flex h-9 items-center gap-2 rounded-full pl-1 pr-3.5 text-[14px] font-medium"
              :class="team.includes(u.name) && '!bg-[#0e1330] !text-white'"
              @click="toggle(u.name)"
            >
              <span class="flex size-7 items-center justify-center rounded-full bg-[#dde6ff] text-[10px] font-bold text-[#2440a6]">{{ initials(u.full_name || u.name) }}</span>
              {{ (u.full_name || u.name).split(' ')[0] }}
            </button>
          </div>
        </div>
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" :label="__('Založit projekt')" :loading="saving" @click="save" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlOrgPicker from '@/components/GlOrgPicker.vue'
import { sessionStore } from '@/stores/session'
import { Button, Dialog, ErrorMessage, FormControl, call, createResource, toast } from 'frappe-ui'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  organization: { type: String, default: null },
  lead: { type: String, default: null },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const ICONS = { globe: 'globe', send: 'send', play: 'play', edit: 'edit' }
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const title = ref('')
const org = ref(null)
const lead = ref(props.lead || '')
const template = ref('')
const start = ref(iso(new Date()))
const deadline = ref('')
const team = ref([sessionStore().user])
const saving = ref(false)
const error = ref('')

const templates = createResource({
  url: 'growupcrm.projects.get_templates',
  auto: true,
  onSuccess(rows) {
    if (!template.value && rows.length) pickTemplate(rows[0])
  },
})
const users = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const leads = ref([])
const leadOptions = computed(() => [
  { label: __('Bez zakázky'), value: '' },
  ...leads.value.map((l) => ({ label: l.order_title || l.lead_name || l.name, value: l.name })),
])

onMounted(async () => {
  if (props.organization) {
    const o = await call('frappe.client.get_value', {
      doctype: 'CRM Organization',
      filters: { name: props.organization },
      fieldname: ['organization_name'],
    })
    org.value = { name: props.organization, label: o?.organization_name || props.organization }
  }
})

watch(org, async (o) => {
  leads.value = o
    ? await call('frappe.client.get_list', {
        doctype: 'CRM Lead',
        filters: { organization_link: o.name },
        fields: ['name', 'order_title', 'lead_name'],
        order_by: 'modified desc',
        limit_page_length: 20,
      })
    : []
  if (!leads.value.some((l) => l.name === lead.value)) lead.value = props.lead || ''
})
watch(lead, (l) => {
  const row = leads.value.find((x) => x.name === l)
  if (row && !title.value) title.value = row.order_title || ''
})

function pickTemplate(t) {
  template.value = t.name
  if (t.duration_days && start.value) {
    const d = new Date(start.value + 'T00:00')
    d.setDate(d.getDate() + t.duration_days)
    deadline.value = iso(d)
  }
}
const templateHint = computed(() => {
  const t = (templates.data || []).find((x) => x.name === template.value)
  if (!t) return ''
  if (!t.tasks) return __('Projekt bez předem daných úkolů, úkoly přidáte sami.')
  return __('Šablona {0} založí {1} úkolů ve {2} fázích.', [__(t.name), t.tasks, t.phases])
})

function toggle(u) {
  team.value = team.value.includes(u) ? team.value.filter((x) => x !== u) : [...team.value, u]
}
const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

async function save() {
  error.value = ''
  if (!title.value.trim()) {
    error.value = __('Vyplňte název projektu.')
    return
  }
  if (!team.value.length) {
    error.value = __('Vyberte aspoň jednoho člena týmu.')
    return
  }
  saving.value = true
  try {
    const name = await call('growupcrm.projects.create_project', {
      project_name: title.value,
      organization: org.value?.name,
      lead: lead.value || null,
      template: template.value || null,
      start_date: start.value,
      deadline: deadline.value || null,
      team: team.value,
    })
    toast.success(__('Projekt {0} je založený', [title.value]))
    show.value = false
    emit('saved', name)
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
  } finally {
    saving.value = false
  }
}
</script>
