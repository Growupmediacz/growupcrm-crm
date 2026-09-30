<template>
  <Dialog v-model:open="show" :title="isNew ? __('Nová událost') : __('Upravit událost')">
    <template #default>
      <div class="flex flex-col gap-3">
        <FormControl
          v-model="form.subject"
          :label="__('Název')"
          type="text"
          :placeholder="__('Např. Schůzka s klientem')"
          autofocus
          :disabled="!canEdit"
        />
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="form.date" :label="__('Datum')" type="date" :disabled="!canEdit" />
          <div class="flex items-end pb-1.5">
            <FormControl v-model="form.allDay" :label="__('Celý den')" type="checkbox" :disabled="!canEdit" />
          </div>
        </div>
        <div v-if="!form.allDay" class="grid grid-cols-2 gap-3">
          <FormControl v-model="form.from" :label="__('Od')" type="time" :disabled="!canEdit" />
          <FormControl v-model="form.to" :label="__('Do')" type="time" :disabled="!canEdit" />
        </div>
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Zakázka') }}</div>
          <Link
            class="form-control"
            :value="form.lead"
            doctype="CRM Lead"
            :placeholder="__('Vyberte zakázku')"
            :disabled="!canEdit"
            @change="(v) => (form.lead = v)"
          />
        </div>
        <FormControl
          v-model="form.assignedTo"
          :label="__('Přiřazeno')"
          type="select"
          :options="userOptions"
          :disabled="!canEdit"
        />
        <FormControl
          v-model="form.description"
          :label="__('Popis')"
          type="textarea"
          :rows="3"
          :disabled="!canEdit"
        />
        <div v-if="form.lead" class="text-sm">
          <router-link
            :to="{ name: 'Lead', params: { leadId: form.lead } }"
            class="text-ink-blue-5 hover:underline"
            @click="show = false"
          >
            {{ __('Otevřít zakázku') }}
          </router-link>
        </div>
      </div>
    </template>
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <div><ErrorMessage :message="error" /></div>
        <div class="flex gap-2">
          <Button v-if="!isNew && canEdit" variant="subtle" theme="red" :label="__('Smazat')" @click="remove" />
          <Button :label="__('Zrušit')" @click="show = false" />
          <Button v-if="canEdit" variant="solid" :label="__('Uložit')" :loading="saving" @click="save" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import Link from '@/components/Controls/Link.vue'
import { isoDate, isoDateTime, pad } from '@/composables/calendar'
import { Button, Dialog, ErrorMessage, FormControl, call, toast } from 'frappe-ui'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  // existující událost (položka kalendáře) nebo výchozí hodnoty nové
  item: { type: Object, default: null },
  start: { type: Date, default: null },
  end: { type: Date, default: null },
  lead: { type: String, default: null },
  currentUser: { type: String, default: '' },
  users: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const isNew = computed(() => !props.item)
const canEdit = computed(() => isNew.value || props.item.canEdit)
const saving = ref(false)
const error = ref('')
const form = ref({})

const userOptions = computed(() =>
  props.users.map((u) => ({ label: u.full_name || u.name, value: u.name })),
)

function hm(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function init() {
  error.value = ''
  if (props.item) {
    const i = props.item
    form.value = {
      subject: i.title,
      date: isoDate(i.start),
      allDay: i.allDay,
      from: hm(i.start),
      to: hm(i.end),
      lead: i.leadName || '',
      assignedTo: i.assignedTo,
      description: i.description || '',
    }
  } else {
    const s = props.start || new Date()
    const e = props.end || new Date(s.getTime() + 3600000)
    form.value = {
      subject: '',
      date: isoDate(s),
      allDay: false,
      from: hm(s),
      to: e.getDate() === s.getDate() ? hm(e) : '23:59',
      lead: props.lead || '',
      assignedTo: props.currentUser,
      description: '',
    }
  }
}

watch(show, (v) => v && init(), { immediate: true })

async function save() {
  error.value = ''
  saving.value = true
  try {
    const f = form.value
    await call('growupcrm.calendar.save_event', {
      name: props.item?.name,
      subject: f.subject,
      starts_on: f.allDay ? `${f.date} 00:00:00` : `${f.date} ${f.from}:00`,
      ends_on: f.allDay ? null : `${f.date} ${f.to}:00`,
      all_day: f.allDay ? 1 : 0,
      description: f.description,
      lead: f.lead || null,
      assigned_to: f.assignedTo || null,
    })
    toast.success(isNew.value ? __('Událost byla vytvořena') : __('Událost byla uložena'))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!confirm(__('Opravdu chcete tuto událost smazat?'))) return
  try {
    await call('growupcrm.calendar.delete_event', { name: props.item.name })
    toast.success(__('Událost byla smazána'))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  }
}
</script>
