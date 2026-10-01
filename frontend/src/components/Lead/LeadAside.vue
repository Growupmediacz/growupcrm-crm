<template>
  <!-- GrowUp: pravý sloupec detailu zakázky (design Liquid Glass): Detaily a Kontakt. Úpravy přes „Upravit“. -->
  <div class="flex w-[360px] shrink-0 flex-col gap-3 overflow-y-auto">
    <div class="gl-card p-6">
      <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Detaily') }}</h2>
      <dl class="flex flex-col">
        <div v-for="row in rows" :key="row.label" class="flex items-baseline justify-between gap-4 py-[7px]">
          <dt class="text-[14px] text-ink-gray-5">{{ row.label }}</dt>
          <dd class="num truncate text-right text-[14px] font-medium text-ink-gray-9">
            <router-link v-if="row.to" :to="row.to" class="hover:text-[#4f46e5]">{{ row.value }}</router-link>
            <template v-else>{{ row.value }}</template>
          </dd>
        </div>
      </dl>
    </div>

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
          @click="callEnabled && (makeCall(person.phone), $event.preventDefault())"
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
      <div v-else class="text-[14px] text-ink-gray-5">
        {{ __('Zakázka zatím nemá kontaktní osobu. Doplníte ji přes Upravit.') }}
      </div>
    </div>
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { callEnabled } from '@/composables/telephony'
import { globalStore } from '@/stores/global'
import { usersStore } from '@/stores/users'
import { createResource } from 'frappe-ui'
import { computed, watch } from 'vue'

const props = defineProps({ doc: { type: Object, required: true } })
defineEmits(['email'])

const { makeCall } = globalStore()
const { getUser } = usersStore()

const contact = createResource({ url: 'frappe.client.get' })
watch(
  () => props.doc.contact_person,
  (name) => name && contact.fetch({ doctype: 'Contact', name }),
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

const dash = '–'
const date = (v) => (v ? new Date(String(v).replace(' ', 'T')).toLocaleDateString('cs-CZ') : dash)

const rows = computed(() => {
  const d = props.doc
  const out = [
    { label: __('Vlastník'), value: d.lead_owner ? getUser(d.lead_owner).full_name : dash },
    { label: __('Zdroj'), value: d.source ? __(d.source) : dash },
    { label: __('Vytvořeno'), value: date(d.creation) },
    { label: __('Pravděpodobnost'), value: d.probability ? `${Math.round(d.probability)} %` : dash },
    { label: __('Očekávané uzavření'), value: date(d.expected_closure_date) },
  ]
  if (d.signed_date) out.push({ label: __('Datum podpisu'), value: date(d.signed_date) })
  if (d.territory) out.push({ label: __('Kraj'), value: d.territory })
  if (d.branch) out.push({ label: __('Pobočka'), value: d.branch })
  return out
})

const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
</script>
