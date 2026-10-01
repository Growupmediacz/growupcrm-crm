<template>
  <!-- GrowUp: pravý sloupec detailu zakázky (design 2. kolo): Detaily (čtení / úpravy přímo v kartě) a Kontakt. -->
  <div class="flex shrink-0 flex-col gap-3 overflow-y-auto pb-1" :class="mobile ? 'w-full' : 'w-[360px]'">
    <!-- Detaily: jen ke čtení -->
    <div v-if="!editing" class="gl-card p-6">
      <div class="mb-3 flex items-baseline justify-between">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Detaily') }}</h2>
        <button class="gl-fill text-[15px]" @click="startEdit">{{ __('Upravit') }}</button>
      </div>
      <dl class="flex flex-col">
        <div v-for="row in rows" :key="row.label" class="flex items-baseline justify-between gap-4 py-[7px]">
          <dt class="shrink-0 text-[14px] text-ink-gray-5">{{ row.label }}</dt>
          <dd class="min-w-0 text-right">
            <template v-if="row.value">
              <div class="num truncate text-[14px] font-medium text-ink-gray-9">{{ row.value }}</div>
              <div v-if="row.sub" class="truncate text-[12px] text-ink-gray-5">{{ row.sub }}</div>
            </template>
            <span v-else class="gl-empty">{{ __('Bez hodnoty') }}</span>
          </dd>
        </div>
      </dl>
    </div>

    <!-- Detaily: úpravy (oprava 9) -->
    <form v-else class="gl-card flex flex-col gap-4 p-6 ring-2 ring-[rgba(79,70,229,.35)]" @submit.prevent="save">
      <div class="flex items-center justify-between">
        <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Detaily') }}</h2>
        <span class="rounded-full bg-[rgba(79,70,229,.1)] px-2.5 py-0.5 text-[12px] font-semibold text-[#4338ca]">{{ __('Úpravy') }}</span>
      </div>
      <label>
        <span class="gl-label">{{ __('Hodnota') }}</span>
        <span class="relative block">
          <input v-model="form.order_value" class="gl-field w-full pr-12 tabular-nums" inputmode="numeric" :placeholder="__('Např. 120 000')" />
          <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-gray-5">Kč</span>
        </span>
      </label>
      <div>
        <span class="gl-label">{{ __('Pravděpodobnost') }}</span>
        <div class="gl-segf" role="group" :aria-label="__('Pravděpodobnost')">
          <button
            v-for="p in PROBABILITIES"
            :key="p"
            type="button"
            :aria-pressed="Number(form.probability) === p"
            @click="form.probability = Number(form.probability) === p ? 0 : p"
          >
            {{ p }} %
          </button>
        </div>
      </div>
      <div>
        <span class="gl-label">{{ __('Očekávané uzavření') }}</span>
        <GlDatePicker v-model="form.expected_closure_date" :label="__('Očekávané uzavření')" :withWeekday="false" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label>
          <span class="gl-label">{{ __('Zdroj') }}</span>
          <select v-model="form.source" class="gl-field w-full">
            <option value="">{{ __('Bez zdroje') }}</option>
            <option v-for="s in sources.data || []" :key="s.name" :value="s.name">{{ __(s.name) }}</option>
          </select>
        </label>
        <label>
          <span class="gl-label">{{ __('Vlastník') }}</span>
          <select v-model="form.lead_owner" class="gl-field w-full">
            <option value="">{{ __('Bez vlastníka') }}</option>
            <option v-for="u in owners" :key="u.name" :value="u.name">{{ u.full_name }}</option>
          </select>
        </label>
      </div>
      <label>
        <span class="gl-label">{{ __('Popis') }}</span>
        <textarea v-model="form.order_description" lang="cs" class="gl-field gl-text w-full" rows="3" />
      </label>
      <div class="flex items-center justify-between gap-2">
        <button type="button" class="text-[13px] font-medium text-ink-gray-5 hover:text-ink-gray-9" @click="$emit('allFields')">
          {{ __('Všechna pole') }}
        </button>
        <div class="flex gap-2">
          <Button :label="__('Zrušit')" @click="editing = false" />
          <Button variant="solid" type="submit" :label="__('Uložit')" :loading="saving" />
        </div>
      </div>
    </form>

    <!-- Kontakt -->
    <div class="gl-card p-6">
      <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Kontakt') }}</h2>
      <div v-if="person.name" class="flex items-center gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[13px] font-bold text-[#2e4bb8]">
          {{ initials(person.name) }}
        </div>
        <div class="min-w-0 flex-1">
          <component
            :is="doc.contact_person ? 'router-link' : 'div'"
            :to="doc.contact_person ? { name: 'Contact', params: { contactId: doc.contact_person } } : undefined"
            class="block truncate text-[16px] font-semibold text-ink-gray-9 hover:text-[#4f46e5]"
          >
            {{ person.name }}
          </component>
          <div class="truncate text-[13px] text-ink-gray-5">{{ person.role || person.phone || person.email }}</div>
        </div>
        <a
          v-if="person.phone"
          :href="callEnabled ? undefined : `tel:${person.phone}`"
          class="gl-round flex size-11 items-center justify-center rounded-full"
          :aria-label="__('Zavolat')"
          :title="person.phone"
          @click="onCall"
        >
          <GlIcon name="phone" :size="18" />
        </a>
        <button
          v-if="person.email"
          class="gl-round flex size-11 items-center justify-center rounded-full"
          :aria-label="__('Napsat e-mail')"
          :title="person.email"
          @click="$emit('email')"
        >
          <GlIcon name="mail" :size="18" />
        </button>
      </div>
      <!-- oprava 11: bez osoby nabídnout kontakty firmy -->
      <template v-else>
        <p class="text-[13px] text-ink-gray-5">
          {{ suggestions.length ? __('Zakázka zatím nemá kontaktní osobu. Kontakty firmy:') : __('Zakázka zatím nemá kontaktní osobu.') }}
        </p>
        <ul v-if="suggestions.length" class="mt-2 flex flex-col">
          <li v-for="c in suggestions" :key="c.name" class="flex items-center gap-3 py-1.5">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[12px] font-bold text-[#2e4bb8]">
              {{ initials(c.full_name) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[15px] font-semibold text-ink-gray-9">{{ c.full_name }}</span>
              <span v-if="c.designation || c.contact_type" class="block truncate text-[12px] text-ink-gray-5">
                {{ c.designation || __(c.contact_type) }}
              </span>
            </span>
            <button
              class="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/85 px-3.5 text-[13px] font-semibold text-ink-gray-9 shadow-[0_2px_10px_-4px_rgba(64,72,160,.3)] hover:bg-white disabled:opacity-50"
              :disabled="attaching === c.name"
              @click="attach(c.name)"
            >
              <GlIcon name="plus" :size="14" />{{ __('Přidat') }}
            </button>
          </li>
        </ul>
        <button
          class="mt-2 inline-flex items-center gap-2 py-1 text-[15px] font-medium text-ink-gray-9 hover:text-[#4f46e5]"
          @click="showNewContact = true"
        >
          <GlIcon name="plus" :size="16" class="text-ink-gray-5" />{{ __('Nový kontakt') }}
        </button>
      </template>
    </div>
  </div>
  <ContactModal
    v-if="showNewContact"
    v-model="showNewContact"
    :contact="{ company_name: doc.organization || '' }"
    :options="{ redirect: false, afterInsert: (c) => attach(c.name, true) }"
  />
</template>

<script setup>
import { saveFailed } from '@/composables/glToast'
import GlIcon from '@/components/GlIcon.vue'
import GlDatePicker from '@/components/GlDatePicker.vue'
import ContactModal from '@/components/Modals/ContactModal.vue'
import { callEnabled } from '@/composables/telephony'
import { formatDateCz } from '@/utils/glDate'
import { usersStore } from '@/stores/users'
import { globalStore } from '@/stores/global'
import { call, createListResource, createResource, toast } from 'frappe-ui'
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({ doc: { type: Object, required: true }, mobile: { type: Boolean, default: false } })
const emit = defineEmits(['email', 'call', 'saved', 'allFields'])
const editing = defineModel('editing', { type: Boolean, default: false })

const { getUser, users } = usersStore()

const contact = createResource({ url: 'frappe.client.get' })
watch(
  () => props.doc.contact_person,
  (name) => name && contact.fetch({ doctype: 'Contact', name }),
  { immediate: true },
)

const branch = createResource({ url: 'frappe.client.get_value' })
watch(
  () => props.doc.branch,
  (name) =>
    name &&
    branch.fetch({ doctype: 'GrowUp Branch', filters: { name }, fieldname: ['branch_name', 'street', 'zip_code', 'city'] }),
  { immediate: true },
)

const person = computed(() => {
  const c = props.doc.contact_person ? contact.data : null
  const name = c?.full_name || [props.doc.first_name, props.doc.last_name].filter(Boolean).join(' ')
  return {
    name,
    role: c?.designation || props.doc.job_title || '',
    phone: c?.mobile_no || c?.phone || props.doc.mobile_no || props.doc.phone || '',
    email: props.doc.email || c?.email_id || '',
  }
})

const rows = computed(() => {
  const d = props.doc
  const out = [
    { label: __('Vlastník'), value: d.lead_owner ? getUser(d.lead_owner).full_name : '' },
    { label: __('Vytvořeno'), value: formatDateCz(d.creation) },
  ]
  if (d.territory) out.push({ label: __('Kraj'), value: d.territory })
  // oprava 14: pobočka názvem a adresou, nikdy interním kódem; bez pobočky se řádek nezobrazí
  if (d.branch) {
    const b = branch.data || {}
    const addr = [b.street, [b.zip_code, b.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    out.push({ label: __('Pobočka'), value: b.branch_name || '', sub: addr })
  }
  out.push(
    { label: __('Zdroj'), value: d.source ? __(d.source) : '' },
    { label: __('Pravděpodobnost'), value: d.probability ? `${Math.round(d.probability)} %` : '' },
    { label: __('Očekávané uzavření'), value: formatDateCz(d.expected_closure_date) },
  )
  if (d.signed_date) out.push({ label: __('Datum podpisu'), value: formatDateCz(d.signed_date) })
  return out
})

// --- úpravy v kartě ---
const PROBABILITIES = [20, 40, 60, 80]
const form = reactive({})
const saving = ref(false)
const sources = createResource({
  url: 'frappe.client.get_list',
  params: { doctype: 'CRM Lead Source', fields: ['name'], limit_page_length: 100, order_by: 'name asc' },
  cache: 'gl-lead-sources',
})
const owners = computed(() =>
  (users.data?.crmUsers || []).filter((u) => u.name !== 'Administrator' || props.doc.lead_owner === u.name),
)

function fillForm() {
  const d = props.doc
  Object.assign(form, {
    order_value: d.order_value ? new Intl.NumberFormat('cs-CZ').format(d.order_value) : '',
    probability: Math.round(d.probability || 0),
    expected_closure_date: d.expected_closure_date || '',
    source: d.source || '',
    lead_owner: d.lead_owner || '',
    order_description: d.order_description || '',
  })
  sources.fetch()
}
function startEdit() {
  fillForm()
  editing.value = true
}
// „Upravit“ v hlavičce stránky přepne kartu do úprav zvenku
watch(editing, (on) => on && fillForm(), { immediate: true })
defineExpose({ startEdit })

const parseMoney = (v) => Number(String(v || '').replace(/\s| /g, '').replace(',', '.')) || 0

async function save() {
  saving.value = true
  try {
    await call('frappe.client.set_value', {
      doctype: 'CRM Lead',
      name: props.doc.name,
      fieldname: {
        order_value: parseMoney(form.order_value),
        probability: Number(form.probability) || 0,
        expected_closure_date: form.expected_closure_date || null,
        source: form.source || null,
        lead_owner: form.lead_owner || null,
        order_description: form.order_description || '',
      },
    })
    editing.value = false
    emit('saved')
    toast.success(__('Uloženo'))
  } catch (e) {
    saveFailed(e, save)
  } finally {
    saving.value = false
  }
}

// --- kontakt bez osoby (oprava 11) ---
const showNewContact = ref(false)
const attaching = ref('')
const orgContacts = createListResource({
  doctype: 'Contact',
  fields: ['name', 'full_name', 'designation', 'contact_type'],
  orderBy: 'modified desc',
  pageLength: 4,
})
watch(
  () => [props.doc.organization_link, props.doc.contact_person],
  ([org, cp]) => {
    if (!org || cp) return
    orgContacts.update({ filters: { crm_organization: org } })
    orgContacts.reload()
  },
  { immediate: true },
)
const suggestions = computed(() => (props.doc.organization_link ? orgContacts.data || [] : []))

async function attach(name, created = false) {
  attaching.value = name
  try {
    if (created && props.doc.organization_link) {
      // nový kontakt z dialogu: patří k firmě zakázky
      await call('frappe.client.set_value', {
        doctype: 'Contact',
        name,
        fieldname: 'crm_organization',
        value: props.doc.organization_link,
      })
    }
    await call('growupcrm.contacts.attach_to_lead', { lead: props.doc.name, contact: name })
    emit('saved')
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    attaching.value = ''
  }
}

// Zavolat: telefonie CRM (je-li zapnutá), jinak odkaz tel: a k tomu dialog „Zapsat hovor“
const { makeCall } = globalStore()
function onCall(event) {
  if (callEnabled.value) {
    event.preventDefault()
    makeCall(person.value.phone)
  }
  emit('call', person.value)
}

const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
</script>
