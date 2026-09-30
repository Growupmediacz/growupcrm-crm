<template>
  <Dialog v-model:open="show" :title="__('Naplánovat týden')" size="4xl">
    <template #default>
      <div class="mb-3 text-sm text-ink-gray-6">
        {{ __('Přidejte schůzky na tento týden, všechny se uloží najednou do kalendáře. Řádky bez zakázky a bez názvu se přeskočí.') }}
      </div>
      <div class="flex flex-col gap-2">
        <div v-for="(r, i) in rows" :key="i" class="grid grid-cols-12 items-end gap-2">
          <div class="col-span-3">
            <div v-if="i === 0" class="mb-1 text-xs text-ink-gray-5">{{ __('Zakázka') }}</div>
            <Link class="form-control" :value="r.lead" doctype="CRM Lead" :placeholder="__('Vyberte zakázku')" @change="(v) => (r.lead = v)" />
          </div>
          <div class="col-span-2">
            <div v-if="i === 0" class="mb-1 text-xs text-ink-gray-5">{{ __('Den') }}</div>
            <FormControl v-model="r.day" type="select" :options="dayOptions" />
          </div>
          <div class="col-span-2">
            <div v-if="i === 0" class="mb-1 text-xs text-ink-gray-5">{{ __('Od') }}</div>
            <FormControl v-model="r.from" type="time" />
          </div>
          <div class="col-span-2">
            <div v-if="i === 0" class="mb-1 text-xs text-ink-gray-5">{{ __('Do') }}</div>
            <FormControl v-model="r.to" type="time" />
          </div>
          <div class="col-span-2">
            <div v-if="i === 0" class="mb-1 text-xs text-ink-gray-5">{{ __('Přiřazeno') }}</div>
            <FormControl v-model="r.assignedTo" type="select" :options="userOptions" />
          </div>
          <div class="col-span-1 flex justify-end">
            <Button variant="ghost" icon="lucide-x" :aria-label="__('Odebrat řádek')" @click="rows.splice(i, 1)" />
          </div>
        </div>
      </div>
      <Button class="mt-3" variant="ghost" iconLeft="plus" :label="__('Přidat řádek')" @click="addRow" />
    </template>
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <div><ErrorMessage :message="error" /></div>
        <div class="flex gap-2">
          <Button :label="__('Zrušit')" @click="show = false" />
          <Button variant="solid" :label="__('Uložit vše')" :loading="saving" @click="save" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import Link from '@/components/Controls/Link.vue'
import { addDays, dayLabel, isoDate, pad } from '@/composables/calendar'
import { Button, Dialog, ErrorMessage, FormControl, call, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  weekStart: { type: Date, required: true },
  currentUser: { type: String, default: '' },
  users: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const rows = ref([])
const saving = ref(false)
const error = ref('')

const dayOptions = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = addDays(props.weekStart, i)
    return { label: dayLabel(d), value: isoDate(d) }
  }),
)
const userOptions = computed(() => props.users.map((u) => ({ label: u.full_name || u.name, value: u.name })))

function addRow() {
  const last = rows.value[rows.value.length - 1]
  rows.value.push({
    lead: '',
    day: last?.day || dayOptions.value[0].value,
    from: last?.to || '09:00',
    to: last ? `${pad(Math.min(parseInt((last.to || '10:00').slice(0, 2)) + 1, 23))}:00` : '10:00',
    assignedTo: last?.assignedTo || props.currentUser,
  })
}

watch(
  show,
  (v) => {
    if (!v) return
    error.value = ''
    rows.value = []
    // dnešek (nebo pondělí zobrazeného týdne), ať se první řádek neplánuje do minulosti
    const today = isoDate(new Date())
    const first = dayOptions.value.find((d) => d.value >= today) || dayOptions.value[0]
    for (let i = 0; i < 3; i++) addRow()
    rows.value.forEach((r) => (r.day = first.value))
  },
  { immediate: true },
)

async function save() {
  error.value = ''
  const items = rows.value
    .filter((r) => r.lead)
    .map((r) => ({
      lead: r.lead,
      starts_on: `${r.day} ${r.from}:00`,
      ends_on: `${r.day} ${r.to}:00`,
      assigned_to: r.assignedTo || null,
    }))
  if (!items.length) {
    error.value = __('Vyberte aspoň u jednoho řádku zakázku')
    return
  }
  saving.value = true
  try {
    await call('growupcrm.calendar.save_events', { events: JSON.stringify(items) })
    toast.success(__('Naplánováno: {0}', [items.length]))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}
</script>
