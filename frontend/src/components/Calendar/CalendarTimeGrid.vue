<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- hlavička dnů -->
    <div class="flex border-b border-outline-gray-2 pr-[var(--sb)]" :style="{ '--sb': scrollbar + 'px' }">
      <div class="w-14 shrink-0" />
      <div
        v-for="d in days"
        :key="d.getTime()"
        class="flex-1 border-l border-outline-gray-2 py-2 text-center text-sm"
        :class="sameDay(d, today) ? 'font-semibold text-ink-gray-9' : 'text-ink-gray-6'"
      >
        <span class="capitalize">{{ weekdayShort(d) }}</span> {{ d.getDate() }}.
      </div>
    </div>
    <!-- celodenní -->
    <div
      v-if="hasAllDay"
      class="flex border-b border-outline-gray-2 pr-[var(--sb)]"
      :style="{ '--sb': scrollbar + 'px' }"
    >
      <div class="w-14 shrink-0 px-1 py-1 text-right text-xs text-ink-gray-5">{{ __('Celý den') }}</div>
      <div v-for="d in days" :key="d.getTime()" class="min-w-0 flex-1 border-l border-outline-gray-2 p-0.5">
        <CalendarItemChip
          v-for="item in allDayItems(d)"
          :key="item.key"
          :item="item"
          @click="$emit('itemClick', item)"
        />
      </div>
    </div>
    <!-- mřížka hodin -->
    <div ref="scroller" class="flex-1 overflow-y-auto">
      <div class="flex" :style="{ height: 24 * HOUR_HEIGHT + 'px' }">
        <div class="relative w-14 shrink-0">
          <div
            v-for="h in 24"
            :key="h"
            class="absolute right-2 -translate-y-1/2 text-xs text-ink-gray-4"
            :style="{ top: (h - 1) * HOUR_HEIGHT + 'px' }"
          >
            <span v-if="h > 1">{{ h - 1 }}:00</span>
          </div>
        </div>
        <div
          v-for="d in days"
          :key="d.getTime()"
          class="relative min-w-0 flex-1 cursor-pointer border-l border-outline-gray-2"
          @click="onSlotClick($event, d)"
        >
          <div
            v-for="h in 24"
            :key="h"
            class="pointer-events-none absolute inset-x-0 border-t border-outline-gray-2"
            :style="{ top: (h - 1) * HOUR_HEIGHT + 'px' }"
          />
          <div
            v-if="sameDay(d, today)"
            class="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-outline-red-3"
            :style="{ top: nowTop + 'px' }"
          />
          <div
            v-for="b in layout(d)"
            :key="b.item.key"
            class="absolute z-10 overflow-hidden rounded border px-1 py-0.5 text-xs"
            :class="itemClasses(b.item)"
            :style="b.style"
            :title="b.item.title"
            @click.stop="$emit('itemClick', b.item)"
          >
            <div class="truncate font-medium">{{ b.item.title }}</div>
            <div v-if="b.item.kind === 'event' && b.tall" class="truncate opacity-80">
              {{ timeLabel(b.item.start) }}–{{ timeLabel(b.item.end) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import CalendarItemChip from '@/components/Calendar/CalendarItemChip.vue'
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
const emit = defineEmits(['slotClick', 'itemClick'])

const today = new Date()
const scroller = ref(null)
const scrollbar = ref(0)
const nowTop = computed(() => ((today.getHours() * 60 + today.getMinutes()) / 60) * HOUR_HEIGHT)
const hasAllDay = computed(() => props.days.some((d) => allDayItems(d).length))

// Úkol je bod v čase: krátký blok od termínu (30 min), událost má skutečnou délku.
const TASK_MINUTES = 30

function allDayItems(d) {
  return itemsOnDay(props.items, d).filter((i) => i.allDay)
}

function layout(d) {
  const dayStart = startOfDay(d)
  const dayEnd = addDays(dayStart, 1)
  const blocks = itemsOnDay(props.items, d)
    .filter((i) => !i.allDay)
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
    tall: b.height >= 40,
    style: {
      top: b.top + 'px',
      height: b.height + 'px',
      left: `calc(${(b.col / b.cols) * 100}% + 1px)`,
      width: `calc(${100 / b.cols}% - 2px)`,
    },
  }))
}

function onSlotClick(e, d) {
  const y = e.clientY - e.currentTarget.getBoundingClientRect().top
  const minutes = Math.floor(((y / HOUR_HEIGHT) * 60) / 30) * 30
  const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, minutes)
  emit('slotClick', at)
}

onMounted(() => {
  const el = scroller.value
  if (!el) return
  scrollbar.value = el.offsetWidth - el.clientWidth
  el.scrollTop = 7 * HOUR_HEIGHT
})
</script>
