<template>
  <!-- GrowUp: důvod prohry při přetažení zakázky do „Prohráno“ v Kanbanu (server bez důvodu změnu stavu odmítne) -->
  <Dialog v-model:open="show" :title="__('Zakázka prohrána')" @close="cancel">
    <template #default>
      <p class="-mt-3 mb-4 text-[14px] text-ink-gray-6">{{ lead?.order_title || lead?.lead_name || lead?.name }}</p>
      <div class="flex flex-col gap-4">
        <div>
          <span class="gl-label">{{ __('Důvod prohry') }} <span class="text-[#a82614]">*</span></span>
          <div class="flex flex-wrap gap-2">
            <button v-for="r in reasons.data || []" :key="r.name" type="button" class="gl-chip h-9 rounded-full px-3.5 text-[14px]" :class="reason === r.name && 'gl-chip-on'" @click="reason = r.name">{{ __(r.name) }}</button>
          </div>
        </div>
        <label>
          <span class="gl-label">{{ __('Poznámka') }} <span v-if="needsNote" class="text-[#a82614]">*</span></span>
          <textarea v-model="notes" class="gl-field gl-text w-full" rows="3" lang="cs" />
        </label>
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="cancel" />
        <Button variant="solid" :loading="saving" :disabled="!reason || (needsNote && !notes.trim())" :label="__('Uložit')" @click="save" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { Button, Dialog, ErrorMessage, call, createListResource } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({ lead: { type: Object, default: null }, status: { type: String, required: true } })
const emit = defineEmits(['saved', 'cancel'])
const show = defineModel({ type: Boolean })
const reason = ref('')
const notes = ref('')
const saving = ref(false)
const error = ref('')
const reasons = createListResource({ doctype: 'CRM Lost Reason', fields: ['name'], pageLength: 50, auto: true })
const needsNote = computed(() => reason.value === 'Other' || /jiný/i.test(reason.value))

function cancel() {
  show.value = false
  emit('cancel')
}
async function save() {
  saving.value = true
  error.value = ''
  try {
    await call('frappe.client.set_value', {
      doctype: 'CRM Lead',
      name: props.lead.name,
      fieldname: { status: props.status, lost_reason: reason.value, lost_notes: notes.value || null },
    })
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}
</script>
