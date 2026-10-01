<template>
  <!-- GrowUp: výběr času (design 2. kolo, oprava 2). Píše se („930“, „9:30“, „9.30“) nebo vybírá po 15 minutách.
       v-model = 'HH:MM' (24 h). Zobrazení „9:00“ bez nuly na začátku. -->
  <Popover placement="bottom-start">
    <template #target="{ open, isOpen }">
      <input
        ref="inputRef"
        v-model="text"
        type="text"
        inputmode="numeric"
        class="gl-field w-full tabular-nums"
        :class="isOpen && 'gl-field-focus'"
        :aria-label="label || __('Čas')"
        :placeholder="placeholder"
        @focus="open()"
        @keydown.enter.prevent="commit()"
        @blur="commit()"
      />
    </template>
    <template #body="{ close, isOpen }">
      <div
        v-show="isOpen"
        ref="listRef"
        class="gl-sheet mt-2 max-h-60 w-[140px] overflow-y-auto rounded-[16px] p-1.5"
      >
        <button
          v-for="t in SLOTS"
          :key="t"
          type="button"
          :data-time="t"
          class="block w-full rounded-[10px] px-3 py-1.5 text-left text-[15px] tabular-nums"
          :class="t === model ? 'bg-[#4F46E5] font-semibold text-white' : 'text-ink-gray-9 hover:bg-[rgba(79,70,229,.08)]'"
          @mousedown.prevent="pick(t, close)"
        >
          {{ show(t) }}
        </button>
      </div>
    </template>
  </Popover>
</template>

<script setup>
import { Popover } from 'frappe-ui'
import { nextTick, ref, watch } from 'vue'

defineProps({
  label: { type: String, default: '' },
  placeholder: { type: String, default: '9:00' },
})
const model = defineModel({ type: String, default: '' })

const pad = (n) => String(n).padStart(2, '0')
const SLOTS = Array.from({ length: 96 }, (_, i) => `${pad(Math.floor(i / 4))}:${pad((i % 4) * 15)}`)
const show = (t) => (t ? `${Number(t.slice(0, 2))}:${t.slice(3, 5)}` : '')

const text = ref(show(model.value))
const listRef = ref(null)
watch(model, (v) => (text.value = show(v)))
watch(listRef, async (el) => {
  if (!el) return
  await nextTick()
  el.querySelector(`[data-time="${model.value || '09:00'}"]`)?.scrollIntoView({ block: 'center' })
})

function parse(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})(?:[:.,\s]?(\d{2}))?$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2] || 0)
  if (h > 23 || min > 59) return null
  return `${pad(h)}:${pad(min)}`
}

function commit() {
  const v = parse(text.value)
  if (v) model.value = v
  else text.value = show(model.value)
}

function pick(t, close) {
  model.value = t
  text.value = show(t)
  close?.()
}
</script>
