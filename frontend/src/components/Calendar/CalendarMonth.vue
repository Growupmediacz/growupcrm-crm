<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="grid grid-cols-7 border-b border-outline-gray-2 text-center text-xs text-ink-gray-5">
      <div v-for="d in days.slice(0, 7)" :key="d" class="py-2 capitalize">{{ weekdayShort(d) }}</div>
    </div>
    <div class="grid flex-1 grid-cols-7" :style="{ gridTemplateRows: `repeat(${days.length / 7}, minmax(96px, 1fr))` }">
      <div
        v-for="d in days"
        :key="d.getTime()"
        class="cursor-pointer overflow-hidden border-b border-r border-outline-gray-2 p-1 hover:bg-surface-gray-1"
        :class="{ 'bg-surface-gray-1': d.getMonth() !== month }"
        @click="$emit('cellClick', d)"
      >
        <div class="mb-1 flex justify-end">
          <span
            class="flex size-6 items-center justify-center rounded-full text-sm"
            :class="
              sameDay(d, today)
                ? 'bg-surface-gray-9 text-ink-white'
                : d.getMonth() === month
                  ? 'text-ink-gray-8'
                  : 'text-ink-gray-4'
            "
            @click.stop="$emit('dayClick', d)"
          >
            {{ d.getDate() }}
          </span>
        </div>
        <CalendarItemChip
          v-for="item in itemsOnDay(items, d).slice(0, MAX)"
          :key="item.key"
          :item="item"
          :showTime="true"
          @click.stop="$emit('itemClick', item)"
        />
        <button
          v-if="itemsOnDay(items, d).length > MAX"
          class="px-1 text-xs text-ink-gray-5 hover:text-ink-gray-8"
          @click.stop="$emit('dayClick', d)"
        >
          {{ __('+{0} dalších', [itemsOnDay(items, d).length - MAX]) }}
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import CalendarItemChip from '@/components/Calendar/CalendarItemChip.vue'
import { itemsOnDay, sameDay, weekdayShort } from '@/composables/calendar'

defineProps({
  days: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  month: { type: Number, required: true },
})
defineEmits(['cellClick', 'dayClick', 'itemClick'])

const MAX = 3
const today = new Date()
</script>
