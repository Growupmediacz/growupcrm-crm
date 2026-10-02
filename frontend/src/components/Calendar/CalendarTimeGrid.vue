<template>
  <!-- GrowUp (design 2. kolo, oprava 17): dny jako „Po / 28“, úkoly v řádku nad mřížkou,
       souběžné události vedle sebe, dnešní sloupec podbarvený, horní hodina není useknutá. -->
  <div class="flex h-full flex-col overflow-hidden px-4 pt-4">
    <!-- hlavička dnů -->
    <div class="flex pr-[var(--sb)]" :style="{ '--sb': scrollbar + 'px' }">
      <div class="w-16 shrink-0" />
      <div v-for="d in days" :key="d.getTime()" class="flex flex-1 flex-col items-center gap-1 pb-2">
        <span class="text-[13px] font-medium capitalize text-ink-gray-5">{{ weekdayShort(d) }}</span>
        <span
          class="flex size-9 items-center justify-center rounded-full text-[20px] font-bold tabular-nums"
          :class="sameDay(d, today) ? 'bg-[#4F46E5] text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,.7)]' : 'text-ink-gray-9'"
        >
          {{ d.getDate() }}
        </span>
      </div>
    </div>
    <!-- úkoly a celodenní události -->
    <div
      v-if="hasTopRow"
      class="flex border-b border-[rgba(110,120,200,.16)] pb-2 pr-[var(--sb)]"
      :style="{ '--sb': scrollbar + 'px' }"
    >
      <div class="w-16 shrink-0 pt-1.5 text-[12px] font-medium text-ink-gray-5">{{ __('Úkoly') }}</div>
      <div v-for="d in days" :key="d.getTime()" class="flex min-w-0 flex-1 flex-col gap-1 px-1">
        <button
          v-for="item in topItems(d)"
          :key="item.key"
          class="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[12px] font-semibold"
          :class="topClasses(item)"
          :title="item.title"
          @click="$emit('itemClick', item)"
        >
          <span
            v-if="item.kind === 'task'"
            class="size-3 shrink-0 rounded-full border-[1.5px] border-current"
            :class="item.done && 'bg-current'"
            aria-hidden="true"
          />
          <span class="truncate" :class="item.done && 'line-through'">{{ item.title }}</span>
        </button>
      </div>
    </div>
    <!-- mřížka hodin -->
    <div ref="scroller" class="flex-1 overflow-y-auto">
      <div class="flex pt-3" :style="{ height: 24 * HOUR_HEIGHT + 12 + 'px' }">
        <div class="relative w-16 shrink-0">
          <div
            v-for="h in 24"
            :key="h"
            class="absolute left-0 -translate-y-1/2 text-[12px] tabular-nums text-ink-gray-5"
            :style="{ top: (h - 1) * HOUR_HEIGHT + 'px' }"
          >
            {{ h - 1 }}:00
          </div>
        </div>
        <div
          v-for="d in days"
          :key="d.getTime()"
          class="relative min-w-0 flex-1 cursor-pointer select-none"
          :ref="(el) => setColumn(el, d)"
          @pointerdown="onPointerDown($event, d)"
        >
          <div
            v-if="sameDay(d, today)"
            class="pointer-events-none absolute inset-x-0.5 -top-3 bottom-0 rounded-[14px] bg-[rgba(79,70,229,.07)]"
          />
          <!-- výběr tažením myší (jako v Google kalendáři) -->
          <div
            v-if="drag && sameDay(drag.day, d)"
            class="pointer-events-none absolute inset-x-1 z-30 overflow-hidden rounded-[10px] bg-[rgba(79,70,229,.18)] px-2 py-1 text-[12px] font-semibold text-[#3b30b8]"
            :style="dragStyle"
          >
            {{ dragLabel }}
          </div>
          <div
            v-for="h in 24"
            :key="h"
            class="pointer-events-none absolute inset-x-0 border-t border-[rgba(110,120,200,.14)]"
            :style="{ top: (h - 1) * HOUR_HEIGHT + 'px' }"
          />
          <div
            v-if="sameDay(d, today)"
            class="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-[#C8321F]"
            :style="{ top: nowTop + 'px' }"
          >
            <span class="absolute -left-1.5 -top-[6px] size-2.5 rounded-full bg-[#C8321F]" />
          </div>
          <div
            v-for="b in layout(d)"
            :key="b.item.key"
            class="absolute z-10 overflow-hidden rounded-[10px] px-2 py-1 text-[12px] shadow-[0_2px_8px_-4px_rgba(64,72,160,.35)]"
            :class="itemClasses(b.item)"
            :style="b.style"
            :title="b.item.title"
            @pointerdown.stop
            @click.stop="$emit('itemClick', b.item)"
          >
            <div class="gl-text line-clamp-2 font-semibold leading-tight">{{ b.item.title }}</div>
            <div v-if="b.tall" class="truncate tabular-nums opacity-80">
              {{ timeLabel(b.item.start) }}<template v-if="b.item.kind === 'event'">–{{ timeLabel(b.item.end) }}</template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import {
  HOUR_HEIGHT,
  addDays,
  itemClasses,
  itemsOnDay,
  sameDay,
  startOfDay,
  timeLabel,
  weekdayShort,
} from '@/composables/calendar'
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  days: { type: Array, required: true },
  items: { type: Array, default: () => [] },
})
const emit = defineEmits(['slotClick', 'rangeSelect', 'itemClick'])

const today = new Date()
const scroller = ref(null)
const scrollbar = ref(0)
const nowTop = computed(() => ((today.getHours() * 60 + today.getMinutes()) / 60) * HOUR_HEIGHT)
const hasTopRow = computed(() => props.days.some((d) => topItems(d).length))

// Úkol je bod v čase: krátký blok od termínu (30 min), událost má skutečnou délku.
const TASK_MINUTES = 30

// nad mřížkou: úkoly (bod v čase, ne blok) a celodenní události
function topItems(d) {
  return itemsOnDay(props.items, d).filter((i) => i.allDay || i.kind === 'task')
}
function topClasses(item) {
  if (item.kind === 'event') return 'bg-[rgba(59,110,246,.14)] text-[#1f48b8]'
  if (item.done) return 'bg-[rgba(110,120,200,.1)] text-ink-gray-5'
  if (item.priority === 'High') return 'bg-[rgba(200,50,31,.12)] text-[#a82614]'
  return 'bg-[rgba(234,170,8,.2)] text-[#7a4400]'
}

function layout(d) {
  const dayStart = startOfDay(d)
  const dayEnd = addDays(dayStart, 1)
  const blocks = itemsOnDay(props.items, d)
    .filter((i) => !i.allDay && i.kind !== 'task')
    .map((item) => {
      const s = item.start < dayStart ? dayStart : item.start
      let e = item.kind === 'task' ? new Date(item.start.getTime() + TASK_MINUTES * 60000) : item.end
      if (e > dayEnd) e = dayEnd
      const top = ((s - dayStart) / 3600000) * HOUR_HEIGHT
      const height = Math.max(((e - s) / 3600000) * HOUR_HEIGHT, 22)
      return { item, s, e, top, height, col: 0, cols: 1 }
    })
    .sort((a, b) => a.s - b.s)

  // rozdělení překrývajících se bloků do sloupců
  let cluster = []
  let clusterEnd = 0
  const flush = () => {
    const cols = Math.max(...cluster.map((b) => b.col)) + 1
    cluster.forEach((b) => (b.cols = cols))
    cluster = []
  }
  for (const b of blocks) {
    if (cluster.length && b.top >= clusterEnd) flush()
    const used = cluster.filter((o) => o.top + o.height > b.top).map((o) => o.col)
    while (used.includes(b.col)) b.col++
    cluster.push(b)
    clusterEnd = Math.max(clusterEnd, b.top + b.height)
  }
  if (cluster.length) flush()

  return blocks.map((b) => ({
    item: b.item,
    tall: b.height >= 44,
    style: {
      top: b.top + 'px',
      height: b.height + 'px',
      left: `calc(${(b.col / b.cols) * 100}% + 3px)`,
      width: `calc(${100 / b.cols}% - 6px)`,
    },
  }))
}

// Výběr času myší: stisk, tažení, puštění = rozsah (krok 15 min). Prosté kliknutí = hodina od kliknutí.
const SNAP = 15
const columns = new Map()
function setColumn(el, d) {
  if (el) columns.set(d.getTime(), el)
}
const drag = ref(null)

function minuteAt(clientY, d, round) {
  const el = columns.get(d.getTime())
  const y = clientY - el.getBoundingClientRect().top
  const raw = (y / HOUR_HEIGHT) * 60
  const snapped = round ? Math.round(raw / SNAP) * SNAP : Math.floor(raw / SNAP) * SNAP
  return Math.max(0, Math.min(24 * 60, snapped))
}

function atMinutes(d, minutes) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, minutes)
}

function onPointerDown(e, d) {
  if (e.button !== 0) return
  const from = minuteAt(e.clientY, d, false)
  drag.value = { day: d, from, to: from, moved: false }
  const move = (ev) => {
    const to = minuteAt(ev.clientY, d, true)
    drag.value.to = to
    if (Math.abs(to - from) >= SNAP) drag.value.moved = true
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    const r = drag.value
    drag.value = null
    if (!r) return
    if (!r.moved) {
      emit('slotClick', atMinutes(d, Math.floor(r.from / 30) * 30))
      return
    }
    const start = Math.min(r.from, r.to)
    const end = Math.max(r.from, r.to)
    emit('rangeSelect', { start: atMinutes(d, start), end: atMinutes(d, end) })
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

const dragRange = computed(() => {
  if (!drag.value?.moved) return null
  return { start: Math.min(drag.value.from, drag.value.to), end: Math.max(drag.value.from, drag.value.to) }
})
const dragStyle = computed(() => {
  const r = dragRange.value || { start: drag.value.from, end: drag.value.from + 30 }
  return {
    top: (r.start / 60) * HOUR_HEIGHT + 'px',
    height: Math.max(((r.end - r.start) / 60) * HOUR_HEIGHT, 6) + 'px',
  }
})
const hm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
const dragLabel = computed(() => (dragRange.value ? `${hm(dragRange.value.start)} – ${hm(dragRange.value.end)}` : ''))

onMounted(() => {
  const el = scroller.value
  if (!el) return
  scrollbar.value = el.offsetWidth - el.clientWidth
  // začít v 8:00, nad ní kousek místa, aby popisek horní hodiny nebyl useknutý
  el.scrollTop = 8 * HOUR_HEIGHT - 6
})
</script>
