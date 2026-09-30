<template>
  <Dialog v-model:open="show" :title="__('Nový kontakt firmy')">
    <template #default>
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="form.first_name" :label="__('Jméno')" type="text" />
          <FormControl v-model="form.last_name" :label="__('Příjmení')" type="text" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="form.email" :label="__('E-mail')" type="text" />
          <FormControl v-model="form.phone" :label="__('Mobil')" type="text" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="form.contact_type" :label="__('Typ kontaktu')" type="select" :options="typeOptions" />
          <FormControl v-model="form.designation" :label="__('Pozice')" type="text" :placeholder="__('Např. hlavní účetní')" />
        </div>
        <FormControl v-model="form.branch" :label="__('Pobočka')" type="select" :options="branchOptions" />
      </div>
    </template>
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <div><ErrorMessage :message="error" /></div>
        <div class="flex gap-2">
          <Button :label="__('Zrušit')" @click="show = false" />
          <Button variant="solid" :label="__('Uložit')" :loading="saving" @click="save" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { Button, Dialog, ErrorMessage, FormControl, call, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  organization: { type: String, required: true },
  branches: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const TYPES = ['Obchodní', 'Účetní', 'Technický', 'Jednatel', 'Jiný']
const typeOptions = TYPES.map((t) => ({ label: __(t), value: t }))
const branchOptions = computed(() => [
  { label: __('(bez pobočky)'), value: '' },
  ...props.branches.map((b) => ({ label: b.branch_name, value: b.name })),
])

const form = ref({})
const saving = ref(false)
const error = ref('')

watch(
  show,
  (v) => {
    if (!v) return
    error.value = ''
    form.value = { first_name: '', last_name: '', email: '', phone: '', contact_type: 'Obchodní', designation: '', branch: '' }
  },
  { immediate: true },
)

async function save() {
  const f = form.value
  if (!f.first_name?.trim() && !f.last_name?.trim()) {
    error.value = __('Zadejte jméno nebo příjmení')
    return
  }
  saving.value = true
  try {
    const doc = {
      doctype: 'Contact',
      first_name: f.first_name,
      last_name: f.last_name,
      designation: f.designation,
      contact_type: f.contact_type,
      branch: f.branch || null,
      crm_organization: props.organization,
      company_name: props.organization,
      email_ids: f.email ? [{ email_id: f.email, is_primary: 1 }] : [],
      phone_nos: f.phone ? [{ phone: f.phone, is_primary_mobile_no: 1 }] : [],
    }
    await call('frappe.client.insert', { doc })
    toast.success(__('Kontakt byl přidán'))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}
</script>
