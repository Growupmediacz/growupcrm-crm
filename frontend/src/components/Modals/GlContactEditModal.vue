<template>
  <!-- GrowUp (design 3. kolo, 35 a m6): Upravit kontakt – jméno, typ, e-maily a telefony (hlavní), LinkedIn,
       preferovaný kontakt, firma a pobočka. Na mobilu spodní panel. Nahrazuje starou stránku CRM /contacts/:id.
       Data: growupcrm.contacts.get_edit / save_edit / delete_contact. -->
  <Dialog v-model:open="show" :options="{ size: '2xl' }">
    <template #body-title>
      <div class="flex min-w-0 items-center gap-3.5">
        <img v-if="data?.contact.image" :src="data.contact.image" class="size-14 shrink-0 rounded-full object-cover" />
        <span v-else class="flex size-14 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-600)_12%,transparent)] text-[20px] font-bold text-[var(--accent-700)]">
          {{ initials(fullName) }}
        </span>
        <div class="flex min-w-0 flex-col">
          <h3 class="text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink-gray-9">{{ __('Upravit kontakt') }}</h3>
          <span class="truncate text-[13px] text-ink-gray-5">{{ [fullName, form.crm_organization].filter(Boolean).join(' · ') }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <GlSkeleton v-if="!data" :rows="5" />
      <div v-else class="flex flex-col gap-5">
        <div class="grid gap-3 sm:grid-cols-[1fr_1.3fr_1.3fr]">
          <FormControl v-model="form.salutation" type="select" :label="__('Oslovení')" :options="['', ...data.salutations].map((s) => ({ label: s ? __(s) : '–', value: s }))" />
          <FormControl v-model="form.first_name" :label="__('Jméno')" />
          <FormControl v-model="form.last_name" :label="__('Příjmení')" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <FormControl v-model="form.designation" :label="__('Pozice')" :placeholder="__('Např. jednatel, vedoucí servisu')" />
          <div>
            <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Typ kontaktu') }}</div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="t in data.contact_types"
                :key="t"
                type="button"
                class="gl-chip flex h-9 items-center rounded-full px-3 text-[13.5px] font-medium"
                :class="form.contact_type === t && '!bg-[var(--accent-600)] !text-white'"
                @click="form.contact_type = form.contact_type === t ? '' : t"
              >
                {{ __(t) }}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 text-[17px] font-bold text-ink-gray-9">{{ __('Spojení') }}</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="kind in KINDS" :key="kind.key">
              <div class="mb-1.5 text-xs text-ink-gray-5">{{ kind.label }}</div>
              <div class="flex flex-col rounded-[16px] border border-[var(--line)] bg-white/70">
                <div v-for="(r, i) in lists[kind.key]" :key="i" class="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2">
                  <input
                    v-model="r.value"
                    :type="kind.key === 'emails' ? 'email' : 'tel'"
                    class="gl-chip-input min-w-0 flex-1 text-[14px]"
                    :placeholder="kind.placeholder"
                    :aria-label="kind.label"
                  />
                  <button
                    type="button"
                    class="shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
                    :class="r.primary ? 'bg-[color-mix(in_srgb,var(--accent-600)_14%,transparent)] text-[var(--accent-700)]' : 'text-ink-gray-4 hover:text-ink-gray-7'"
                    :title="__('Nastavit jako hlavní')"
                    @click="setPrimary(lists[kind.key], i)"
                  >
                    {{ r.primary ? __('Hlavní') : __('Nastavit hlavní') }}
                  </button>
                  <button type="button" class="shrink-0 text-ink-gray-4 hover:text-[#c8321f]" :aria-label="__('Odebrat')" @click="remove(lists[kind.key], i)">
                    <GlIcon name="trash" :size="16" />
                  </button>
                </div>
                <button type="button" class="flex items-center gap-1.5 px-3 py-2.5 text-[14px] font-semibold text-[var(--accent-600)]" @click="add(lists[kind.key])">
                  <GlIcon name="plus" :size="15" />{{ kind.add }}
                </button>
              </div>
            </div>
          </div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <FormControl v-model="form.linkedin" :label="__('LinkedIn')" placeholder="linkedin.com/in/…" />
            <div>
              <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Preferovaný kontakt') }}</div>
              <div class="gl-seg flex w-full">
                <button
                  v-for="p in PREFS"
                  :key="p"
                  type="button"
                  class="gl-seg-btn flex-1 justify-center"
                  :class="form.preferred_contact === p && 'gl-seg-on !bg-[var(--accent-600)] !text-white'"
                  @click="form.preferred_contact = form.preferred_contact === p ? '' : p"
                >
                  {{ __(p) }}
                </button>
              </div>
              <div v-if="form.preferred_contact && !PREFS.includes(form.preferred_contact)" class="mt-1 text-[12.5px] text-ink-gray-5">
                {{ __('Dosud: {0}', [form.preferred_contact]) }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 text-[17px] font-bold text-ink-gray-9">{{ __('Firma') }}</h4>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Firma') }}</div>
              <Link v-model="form.crm_organization" doctype="CRM Organization" :placeholder="__('Vyberte firmu')" />
            </div>
            <FormControl
              v-model="form.branch"
              type="select"
              :label="__('Pobočka')"
              :disabled="!form.crm_organization || !branches.data?.length"
              :options="[{ label: branches.data?.length ? '–' : __('Firma nemá pobočky'), value: '' }, ...(branches.data || []).map((b) => ({ label: [b.branch_name, b.city].filter(Boolean).join(' · '), value: b.name }))]"
            />
          </div>
        </div>

        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <Button v-if="data?.can_delete" variant="ghost" theme="red" iconLeft="trash-2" :label="__('Smazat kontakt')" @click="removeContact" />
        <span v-else />
        <div class="flex gap-2">
          <Button :label="__('Zrušit')" @click="show = false" />
          <Button variant="solid" :label="__('Uložit')" :loading="saving" :disabled="!data" @click="save" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import Link from '@/components/Controls/Link.vue'
import { Button, Dialog, ErrorMessage, FormControl, call, createResource, toast } from 'frappe-ui'
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({ contact: { type: String, required: true } })
const emit = defineEmits(['saved', 'deleted'])
const show = defineModel({ type: Boolean })

const KINDS = [
  { key: 'emails', label: __('E-maily'), add: __('Přidat e-mail'), placeholder: 'jmeno@firma.cz' },
  { key: 'phones', label: __('Telefony'), add: __('Přidat telefon'), placeholder: '+420 …' },
]
const PREFS = ['E-mail', 'Telefon', 'LinkedIn']

const data = ref(null)
const form = reactive({})
const lists = reactive({ emails: [], phones: [] })
const error = ref('')
const saving = ref(false)

createResource({
  url: 'growupcrm.contacts.get_edit',
  params: { name: props.contact },
  auto: true,
  onSuccess: (d) => {
    Object.assign(form, d.contact)
    lists.emails = d.emails.map((r) => ({ ...r }))
    lists.phones = d.phones.map((r) => ({ ...r }))
    data.value = d
  },
  onError: (e) => (error.value = e.messages?.[0] || __('Kontakt se nepodařilo načíst')),
})
const branches = createResource({ url: 'growupcrm.contacts.get_branches', params: { organization: '' } })
watch(
  () => form.crm_organization,
  (org, old) => {
    if (old !== undefined && org !== old) form.branch = ''
    branches.submit({ organization: org || '' })
  },
)

const fullName = computed(() => [form.first_name, form.last_name].filter(Boolean).join(' ') || data.value?.contact.full_name || '')
const initials = (s) => (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

function add(list) {
  list.push({ value: '', primary: !list.some((r) => r.primary) })
}
function remove(list, i) {
  const wasPrimary = list[i].primary
  list.splice(i, 1)
  if (wasPrimary && list.length) list[0].primary = true
}
function setPrimary(list, i) {
  list.forEach((r, k) => (r.primary = k === i))
}

async function save() {
  error.value = ''
  if (!(form.first_name || '').trim()) return (error.value = __('Vyplňte jméno.'))
  saving.value = true
  try {
    const payload = { ...form, emails: lists.emails, phones: lists.phones }
    delete payload.name
    delete payload.image
    delete payload.full_name
    await call('growupcrm.contacts.save_edit', { name: props.contact, data: JSON.stringify(payload) })
    toast.success(__('Kontakt uložen'))
    emit('saved')
    show.value = false
  } catch (e) {
    error.value = e.messages?.[0] || __('Nepodařilo se uložit')
  } finally {
    saving.value = false
  }
}

async function removeContact() {
  if (!window.confirm(__('Smazat kontakt {0}? Zakázky zůstanou.', [fullName.value]))) return
  try {
    await call('growupcrm.contacts.delete_contact', { name: props.contact })
    toast.success(__('Kontakt smazán'))
    emit('deleted')
    show.value = false
  } catch (e) {
    error.value = e.messages?.[0] || __('Kontakt se nepodařilo smazat')
  }
}
</script>
