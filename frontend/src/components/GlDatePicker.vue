<template>
  <!-- GrowUp: výběr data (design 2. kolo, oprava 2). Pole „čt 1. 10. 2026“, kalendář Po–Ne,
       zkratky Dnes · Zítra · Příští týden. v-model = 'YYYY-MM-DD' nebo ''. -->
  <Popover placement="bottom-start">
    <template #target="{ togglePopover, isOpen }">
      <button
        type="button"
        class="gl-field flex w-full items-center gap-2.5 text-left"
        :class="isOpen && 'gl-field-focus'"
        :aria-label="label || __('Datum')"
        @click="togglePopover()"
      >
        <GlIcon name="cal" :size="17" class="shrink-0 text-ink-gray-5" />
        <span class="min-w-0 flex-1 truncate" :class="!model && 'text-[var(--empty-color,#5B6285)]'">
          {{ model ? display : placeholder || __('Vyberte datum') }}
        </span>
        <span
          v-if="clearable && model"
          role="button"
          class="-mr-1 rounded-full p-1 text-ink-gray-5 hover:bg-black/5"
          :aria-label="__('Vymazat')"
          @click.stop="model = ''"
        >
          <GlIcon name="x" :size="14" />
        </span>
      </button>
    </template>
    <template #body="{ close, isOpen }">
      <div v-show="isOpen" class="gl-sheet mt-2 w-[300px] rounded-[20px] p-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-[16px] font-bold text-ink-gray-9">{{ monthTitle }}</span>
          <span class="flex gap-1">
            <button type="button" class="rounded-full p-1.5 hover:bg-black/5" :aria-label="__('Předchozí měsíc')" @click="shift(-1)">
              <GlIcon name="left" :size="16" />
            </button>
            <button type="button" class="rounded-full p-1.5 hover:bg-black/5" :aria-label="__('Další měsíc')" @click="shift(1)">
              <GlIcon name="right" :size="16" />
            </button>
          </span>
        </div>
        <div class="grid grid-cols-7 text-center text-[12px] font-medium text-ink-gray-5">
          <span v-for="d in WEEKDAYS" :key="d" class="py-1">{{ d }}</span>
        </div>
        <div class="grid grid-cols-7 gap-y-1 text-center">
          <span v-for="n in lead" :key="'e' + n" />
          <button
            v-for="d in daysInMonth"
            :key="d"
            type="button"
            class="mx-auto flex size-9 items-center justify-center rounded-full text-[14px] tabular-nums transition"
            :class="dayClass(d)"
            @click="pick(iso(view.y, view.m, d), close)"
          >
            {{ d }}
          </button>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button
            v-for="s in shortcuts"
            :key="s.label"
            type="button"
            class="h-8 rounded-full bg-white/80 px-3 text-[13px] font-semibold text-ink-gray-9 shadow-[0_1px_6px_-2px_rgba(64,72,160,0.25)] hover:bg-white"
            @click="pick(s.value, close)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
    </template>
  </Popover>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { formatDateCz } from '@/utils/glDate'
import { Popover } from 'frappe-ui'
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  placeholder: { type: String, default: '' },
  label: { type: String, default: '' },
  clearable: { type: Boolean, default: true },
  withWeekday: { type: Boolean, default: true },
  withYear: { type: Boolean, default: true },
})
const model = defineModel({ type: String, default: '' })

const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
const MONTHS = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']

const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const todayIso = () => {
  const t = new Date()
  return iso(t.getFullYear(), t.getMonth(), t.getDate())
}
const parse = (v) => {
  const [y, m, d] = String(v || '').slice(0, 10).split('-').map(Number)
  return y ? new Date(y, m - 1, d) : null
}

const view = reactive({ y: 0, m: 0 })
function resetView() {
  const d = parse(model.value) || new Date()
  view.y = d.getFullYear()
  view.m = d.getMonth()
}
resetView()
watch(model, resetView)

const display = computed(() => formatDateCz(model.value, { weekday: props.withWeekday, year: props.withYear }))
const monthTitle = computed(() => `${MONTHS[view.m]} ${view.y}`)
const daysInMonth = computed(() => new Date(view.y, view.m + 1, 0).getDate())
// počet prázdných buněk před 1. dnem (týden začíná pondělím)
const lead = computed(() => (new Date(view.y, view.m, 1).getDay() + 6) % 7)

function shift(delta) {
  const d = new Date(view.y, view.m + delta, 1)
  view.y = d.getFullYear()
  view.m = d.getMonth()
}

function dayClass(d) {
  const v = iso(view.y, view.m, d)
  if (v === String(model.value).slice(0, 10)) return 'bg-[#4F46E5] font-bold text-white shadow-[0_4px_12px_-4px_rgba(79,70,229,.6)]'
  if (v === todayIso()) return 'font-bold text-[#4F46E5] hover:bg-[rgba(79,70,229,.08)]'
  return 'text-ink-gray-9 hover:bg-[rgba(79,70,229,.08)]'
}

const shortcuts = computed(() => {
  const t = new Date()
  const tomorrow = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)
  // příští týden = pondělí příštího týdne
  const nextWeek = new Date(t.getFullYear(), t.getMonth(), t.getDate() + (7 - ((t.getDay() + 6) % 7)))
  const f = (d) => iso(d.getFullYear(), d.getMonth(), d.getDate())
  return [
    { label: __('Dnes'), value: f(t) },
    { label: __('Zítra'), value: f(tomorrow) },
    { label: __('Příští týden'), value: f(nextWeek) },
  ]
})

function pick(value, close) {
  model.value = value
  close?.()
}
</script>
