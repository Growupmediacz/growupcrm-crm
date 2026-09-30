<template>
  <Dialog v-model:open="show" :title="item?.title">
    <template #default>
      <div v-if="item" class="flex flex-col gap-2 text-sm text-ink-gray-7">
        <div>
          <span class="text-ink-gray-5">{{ __('Termín') }}:</span>
          {{ dayLabel(item.start) }}, {{ timeLabel(item.start) }}
        </div>
        <div>
          <span class="text-ink-gray-5">{{ __('Stav') }}:</span> {{ __(item.status) }}
        </div>
        <div>
          <span class="text-ink-gray-5">{{ __('Priorita') }}:</span> {{ __(item.priority) }}
        </div>
        <div v-if="item.assignedTo">
          <span class="text-ink-gray-5">{{ __('Přiřazeno') }}:</span> {{ getUser(item.assignedTo).full_name }}
        </div>
        <div v-if="item.leadName">
          <span class="text-ink-gray-5">{{ __('Zakázka') }}:</span>
          <router-link
            :to="{ name: 'Lead', params: { leadId: item.leadName }, hash: '#tasks' }"
            class="text-ink-blue-5 hover:underline"
            @click="show = false"
          >
            {{ item.leadTitle || item.leadName }}
          </router-link>
        </div>
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zavřít')" @click="show = false" />
        <Button
          v-if="item && !item.done"
          variant="solid"
          :label="__('Označit jako hotový')"
          :loading="saving"
          @click="markDone"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { dayLabel, timeLabel } from '@/composables/calendar'
import { usersStore } from '@/stores/users'
import { Button, Dialog, call, toast } from 'frappe-ui'
import { ref } from 'vue'

const props = defineProps({ item: { type: Object, default: null } })
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })
const { getUser } = usersStore()
const saving = ref(false)

async function markDone() {
  saving.value = true
  try {
    await call('frappe.client.set_value', {
      doctype: 'CRM Task',
      name: props.item.name,
      fieldname: 'status',
      value: 'Done',
    })
    toast.success(__('Úkol byl označen jako hotový'))
    show.value = false
    emit('saved')
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    saving.value = false
  }
}
</script>
