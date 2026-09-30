<template>
  <Dialog v-model:open="show" :title="branch ? __('Upravit pobočku') : __('Nová pobočka')">
    <template #default>
      <div class="flex flex-col gap-3">
        <FormControl v-model="form.branch_name" :label="__('Název pobočky')" type="text" :placeholder="__('Např. Praha – centrála')" />
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Kraj') }}</div>
            <Link class="form-control" :value="form.territory" doctype="CRM Territory" :placeholder="__('Vyberte kraj')" @change="(v) => (form.territory = v)" />
          </div>
          <div>
            <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Odpovědný obchodník') }}</div>
            <Link class="form-control" :value="form.responsible" doctype="User" :hideMe="true" :placeholder="__('Vyberte obchodníka')" @change="(v) => (form.responsible = v)" />
          </div>
        </div>
        <FormControl v-model="form.street" :label="__('Ulice a číslo')" type="text" />
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="form.city" :label="__('Město')" type="text" />
          <FormControl v-model="form.zip_code" :label="__('PSČ')" type="text" />
        </div>
        <FormControl v-model="form.notes" :label="__('Poznámka')" type="textarea" :rows="2" />
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
import Link from '@/components/Controls/Link.vue'
import { Button, Dialog, ErrorMessage, FormControl, call, toast } from 'frappe-ui'
import { ref, watch } from 'vue'

const props = defineProps({
  organization: { type: String, required: true },
  branch: { type: Object, default: null },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const form = ref({})
const saving = ref(false)
const error = ref('')

watch(
  show,
  (v) => {
    if (!v) return
    error.value = ''
    const b = props.branch || {}
    form.value = {
      branch_name: b.branch_name || '',
      territory: b.territory || '',
      responsible: b.responsible || '',
      street: b.street || '',
      city: b.city || '',
      zip_code: b.zip_code || '',
      notes: b.notes || '',
    }
  },
  { immediate: true },
)

async function save() {
  if (!form.value.branch_name?.trim()) {
    error.value = __('Zadejte název pobočky')
    return
  }
  saving.value = true
  try {
    if (props.branch) {
      await call('frappe.client.set_value', {
        doctype: 'GrowUp Branch',
        name: props.branch.name,
        fieldname: { ...form.value },
      })
    } else {
      await call('frappe.client.insert', {
        doc: { doctype: 'GrowUp Branch', organization: props.organization, ...form.value },
      })
    }
    toast.success(__('Pobočka byla uložena'))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}
</script>
