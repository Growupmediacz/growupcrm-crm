<template>
  <!-- GrowUp: Zápis / Úkol / Komentář přímo z Firmy (growupcrm.firmy.add_activity), k Zakázce firmy nebo jen k firmě -->
  <Dialog v-model:open="show" :options="{ size: 'lg' }">
    <template #body-title>
      <div class="flex flex-col">
        <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">{{ TITLES[kind] }}</h3>
        <span class="mt-1 text-[13px] text-ink-gray-5">{{ organizationName }}</span>
      </div>
    </template>
    <template #default>
      <div class="flex flex-col gap-4">
        <GlLeadPicker v-model="lead" :leads="leads" />
        <FormControl v-if="kind !== 'comment'" ref="titleRef" v-model="title" :label="kind === 'task' ? __('Název úkolu') : __('Nadpis')" :placeholder="kind === 'task' ? __('Např. Poslat nabídku') : __('Např. Schůzka s jednatelem')" />
        <FormControl v-model="content" type="textarea" :rows="kind === 'task' ? 3 : 5" :label="kind === 'task' ? __('Popis') : __('Text')" :placeholder="kind === 'comment' ? __('Interní poznámka pro tým…') : ''" />
        <div v-if="kind === 'task'" class="grid grid-cols-2 gap-3">
          <FormControl v-model="dueDate" type="date" :label="__('Termín')" />
          <FormControl
            v-model="priority"
            type="select"
            :label="__('Priorita')"
            :options="[{ label: __('Low'), value: 'Low' }, { label: __('Medium'), value: 'Medium' }, { label: __('High'), value: 'High' }]"
          />
          <FormControl v-model="assignedTo" class="col-span-2" type="select" :label="__('Přiřadit')" :options="userOptions" />
        </div>
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" :label="__('Uložit')" :loading="saving" @click="save" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import GlLeadPicker from '@/components/Firma/GlLeadPicker.vue'
import { usersStore } from '@/stores/users'
import { Button, Dialog, ErrorMessage, FormControl, call, toast } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({
  kind: { type: String, default: 'note' }, // note | task | comment
  organization: { type: String, required: true },
  organizationName: { type: String, default: '' },
  leads: { type: Array, default: () => [] },
  defaultLead: { type: String, default: '' },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const TITLES = { note: __('Nový zápis'), task: __('Nový úkol'), comment: __('Nový komentář') }
const { getUser, crmUsers } = usersStore()

const lead = ref(props.defaultLead)
const title = ref('')
const content = ref('')
const dueDate = ref('')
const priority = ref('Medium')
const assignedTo = ref(getUser().name)
const saving = ref(false)
const error = ref('')

const userOptions = computed(() => (crmUsers.value || []).map((u) => ({ label: u.full_name || u.name, value: u.name })))

async function save() {
  error.value = ''
  saving.value = true
  try {
    await call('growupcrm.firmy.add_activity', {
      organization: props.organization,
      kind: props.kind,
      lead: lead.value || null,
      title: title.value,
      content: content.value,
      due_date: props.kind === 'task' && dueDate.value ? `${dueDate.value} 09:00:00` : null,
      assigned_to: assignedTo.value,
      priority: priority.value,
    })
    toast.success(__('Uloženo'))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
  } finally {
    saving.value = false
  }
}
</script>
