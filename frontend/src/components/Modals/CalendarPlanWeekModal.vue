<template>
  <!-- GrowUp (design 2. kolo, oprava 20): mřížka sloupců se stejnou výškou polí, popisky v jedné řadě nahoře -->
  <Dialog v-model:open="show" :title="__('Naplánovat týden')" size="4xl">
    <template #default>
      <p class="mb-4 text-[13px] text-ink-gray-6">
        {{ __('Přidejte schůzky na tento týden. Uloží se najednou, řádky bez zakázky přeskočíme.') }}
      </p>
      <div class="grid items-center gap-x-2.5 gap-y-2.5" :style="{ gridTemplateColumns: COLS }">
        <span class="gl-label !mb-0 pl-3">{{ __('Zakázka') }}</span>
        <span class="gl-label !mb-0">{{ __('Den') }}</span>
        <span class="gl-label !mb-0">{{ __('Od') }}</span>
        <span class="gl-label !mb-0">{{ __('Do') }}</span>
        <span class="gl-label !mb-0">{{ __('Přiřazeno') }}</span>
        <span />
        <template v-for="(r, i) in rows" :key="r.id">
          <Link :value="r.lead" doctype="CRM Lead" :placeholder="__('Vyberte zakázku')" @change="(v) => (r.lead = v)" />
          <GlDatePicker v-model="r.day" :label="__('Den')" :withYear="false" :clearable="false" />
          <GlTimePicker :modelValue="r.from" :label="__('Od')" @update:modelValue="(v) => setFrom(r, v)" />
          <GlTimePicker v-model="r.to" :label="__('Do')" />
          <select v-model="r.assignedTo" class="gl-field w-full" :aria-label="__('Přiřazeno')">
            <option v-for="u in userOptions" :key="u.value" :value="u.value">{{ u.label }}</option>
          </select>
          <button
            class="flex size-8 items-center justify-center rounded-full text-ink-gray-5 hover:bg-black/5 hover:text-ink-gray-9"
            :aria-label="__('Odebrat řádek')"
            @click="rows.splice(i, 1)"
          >
            <GlIcon name="x" :size="15" />
          </button>
        </template>
      </div>
      <button class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-[14px] font-semibold text-ink-gray-9 hover:text-[#4F46E5]" @click="addRow">
        <GlIcon name="plus" :size="16" class="text-ink-gray-5" />{{ __('Přidat schůzku') }}
      </button>
    </template>
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <div class="text-[13px] text-ink-gray-5">
          <ErrorMessage v-if="error" :message="error" />
          <template v-else-if="skipped">{{ skippedLabel }}</template>
        </div>
        <div class="flex gap-2">
          <Button :label="__('Zrušit')" @click="show = false" />
          <Button variant="solid" :label="saveLabel" :loading="saving" :disabled="!ready.length" @click="save" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import Link from '@/components/Controls/Link.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlDatePicker from '@/components/GlDatePicker.vue'
import GlTimePicker from '@/components/GlTimePicker.vue'
import { addDays, dayLabel, isoDate, pad } from '@/composables/calendar'
import { Button, Dialog, ErrorMessage, call, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  weekStart: { type: Date, required: true },
  currentUser: { type: String, default: '' },
  users: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

const COLS = 'minmax(0,2.3fr) minmax(0,1.5fr) minmax(0,0.95fr) minmax(0,0.95fr) minmax(0,1.5fr) 32px'
const rows = ref([])
let rowId = 0
const ready = computed(() => rows.value.filter((r) => r.lead))
const skipped = computed(() => rows.value.length - ready.value.length)
const skippedLabel = computed(() =>
  skipped.value === 1
    ? __('1 řádek bez zakázky se přeskočí')
    : skipped.value < 5
      ? __('{0} řádky bez zakázky se přeskočí', [skipped.value])
      : __('{0} řádků bez zakázky se přeskočí', [skipped.value]),
)
const saveLabel = computed(() => {
  const n = ready.value.length
  if (n === 1) return __('Uložit 1 schůzku')
  if (n >= 2 && n <= 4) return __('Uložit {0} schůzky', [n])
  return __('Uložit {0} schůzek', [n])
})
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const toTime = (m) => `${pad(Math.floor(Math.min(m, 1439) / 60))}:${pad(Math.min(m, 1439) % 60)}`
// „Do“ se posune o stejnou délku jako „Od“ (oprava 2)
function setFrom(r, v) {
  const dur = Math.max(toMin(r.to) - toMin(r.from), 15)
  r.from = v
  r.to = toTime(toMin(v) + dur)
}
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
    id: ++rowId,
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
  const items = ready.value
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
