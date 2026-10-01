<template>
  <!-- GrowUp (design 2. kolo, oprava 13): Údaje o firmě jen ke čtení, úprava přes „Upravit“ přímo v kartě
       (stejně jako Detaily zakázky). Ostatní pole CRM jsou pod „Všechna pole“. -->
  <div v-if="!editing" class="gl-card p-6">
    <div class="mb-2 flex items-baseline justify-between">
      <h2 class="text-[18px] font-bold tracking-tight text-ink-gray-9">{{ __('Údaje o firmě') }}</h2>
      <button class="gl-fill text-[15px]" @click="startEdit">{{ __('Upravit') }}</button>
    </div>
    <dl class="flex flex-col">
      <div v-for="row in rows" :key="row.label" class="flex items-baseline justify-between gap-4 py-[7px]">
        <dt class="shrink-0 text-[14px] text-ink-gray-5">{{ row.label }}</dt>
        <dd class="min-w-0 text-right text-[14px] font-medium text-ink-gray-9">
          <a v-if="row.value && row.href" :href="row.href" target="_blank" rel="noopener" class="block truncate text-[#4F46E5] hover:underline">{{ row.value }}</a>
          <span v-else-if="row.value" class="gl-text block">{{ row.value }}</span>
          <span v-else class="gl-empty">{{ __('Bez hodnoty') }}</span>
        </dd>
      </div>
    </dl>
  </div>
  <form v-else class="gl-card flex flex-col gap-3.5 p-6 ring-2 ring-[rgba(79,70,229,.35)]" @submit.prevent="save">
    <div class="flex items-center justify-between">
      <h2 class="text-[18px] font-bold tracking-tight text-ink-gray-9">{{ __('Údaje o firmě') }}</h2>
      <span class="rounded-full bg-[rgba(79,70,229,.1)] px-2.5 py-0.5 text-[12px] font-semibold text-[#4338ca]">{{ __('Úpravy') }}</span>
    </div>
    <label>
      <span class="gl-label">{{ __('Web') }}</span>
      <input v-model="form.website" class="gl-field w-full" placeholder="firma.cz" />
    </label>
    <label>
      <span class="gl-label">{{ __('Ulice a číslo') }}</span>
      <input v-model="form.street" class="gl-field w-full" />
    </label>
    <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2.5">
      <label>
        <span class="gl-label">{{ __('PSČ') }}</span>
        <input v-model="form.zip_code" class="gl-field w-full tabular-nums" inputmode="numeric" />
      </label>
      <label>
        <span class="gl-label">{{ __('Město') }}</span>
        <input v-model="form.city" class="gl-field w-full" />
      </label>
    </div>
    <div class="grid grid-cols-2 gap-2.5">
      <label>
        <span class="gl-label">{{ __('Kraj') }}</span>
        <select v-model="form.territory" class="gl-field w-full">
          <option value="">{{ __('Bez kraje') }}</option>
          <option v-for="t in lists.data?.territories || []" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
      <label>
        <span class="gl-label">{{ __('Obor') }}</span>
        <select v-model="form.industry" class="gl-field w-full">
          <option value="">{{ __('Bez oboru') }}</option>
          <option v-for="i in lists.data?.industries || []" :key="i" :value="i">{{ __(i) }}</option>
        </select>
      </label>
    </div>
    <label>
      <span class="gl-label">{{ __('Vlastník') }}</span>
      <select v-model="form.org_owner" class="gl-field w-full">
        <option value="">{{ __('Bez vlastníka') }}</option>
        <option v-for="u in owners" :key="u.name" :value="u.name">{{ u.full_name }}</option>
      </select>
    </label>
    <div class="mt-1 flex items-center justify-between gap-2">
      <button type="button" class="text-[13px] font-medium text-ink-gray-5 hover:text-ink-gray-9" @click="(editing = false), $emit('allFields')">
        {{ __('Všechna pole') }}
      </button>
      <div class="flex gap-2">
        <Button :label="__('Zrušit')" @click="editing = false" />
        <Button variant="solid" type="submit" :label="__('Uložit')" :loading="saving" />
      </div>
    </div>
  </form>
</template>

<script setup>
import { usersStore } from '@/stores/users'
import { call, createResource, toast } from 'frappe-ui'
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  doc: { type: Object, required: true },
  branches: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved', 'allFields'])

const { getUser, users } = usersStore()
const editing = ref(false)
const saving = ref(false)
const form = reactive({})

const rows = computed(() => {
  const d = props.doc
  const web = (d.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const seat = [d.street, [d.zip_code, d.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const branchNames = props.branches.map((b) => b.branch_name || b.city).filter(Boolean).join(', ')
  const out = [
    { label: __('Web'), value: web, href: d.website ? (/^https?:/.test(d.website) ? d.website : `https://${d.website}`) : null },
    { label: __('Sídlo'), value: seat },
    { label: __('Kraj'), value: d.territory || '' },
    { label: __('Obor'), value: d.industry ? __(d.industry) : '' },
    { label: __('Vlastník'), value: d.org_owner ? getUser(d.org_owner)?.full_name || d.org_owner : '' },
  ]
  // bez poboček se řádek nezobrazí (oprava 14)
  if (branchNames) out.push({ label: __('Pobočky'), value: branchNames })
  return out
})

const lists = createResource({
  url: 'growupcrm.firmy.get_form_lists',
  cache: 'gl-org-form-lists',
})
const owners = computed(() => (users.data?.crmUsers || []).filter((u) => u.name !== 'Administrator'))

function startEdit() {
  const d = props.doc
  Object.assign(form, {
    website: d.website || '',
    street: d.street || '',
    zip_code: d.zip_code || '',
    city: d.city || '',
    territory: d.territory || '',
    industry: d.industry || '',
    org_owner: d.org_owner || '',
  })
  lists.fetch()
  editing.value = true
}

async function save() {
  saving.value = true
  try {
    const values = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]))
    await call('frappe.client.set_value', { doctype: 'CRM Organization', name: props.doc.name, fieldname: values })
    editing.value = false
    emit('saved')
    toast.success(__('Uloženo'))
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    saving.value = false
  }
}
</script>
