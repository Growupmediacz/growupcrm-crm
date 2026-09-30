<template>
  <div class="h-full overflow-y-auto">
    <div v-if="!groups.length" class="flex h-full items-center justify-center text-sm text-ink-gray-5">
      {{ __('V tomto období nic není naplánováno.') }}
    </div>
    <div v-for="g in groups" :key="g.day.getTime()" class="border-b border-outline-gray-2 px-4 py-3">
      <div
        class="mb-2 text-sm font-medium"
        :class="sameDay(g.day, today) ? 'text-ink-gray-9' : 'text-ink-gray-6'"
      >
        {{ dayLabel(g.day) }}
      </div>
      <button
        v-for="item in g.items"
        :key="item.key"
        class="mb-1.5 flex w-full items-center gap-3 rounded border px-3 py-2 text-left text-sm"
        :class="itemClasses(item)"
        @click="$emit('itemClick', item)"
      >
        <span class="w-14 shrink-0 text-xs font-medium">
          {{ item.allDay ? __('Celý den') : timeLabel(item.start) }}
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="truncate">{{ item.title }}</span>
          <span v-if="item.leadTitle" class="truncate text-xs opacity-80">{{ item.leadTitle }}</span>
        </span>
        <span v-if="item.kind === 'task'" class="lucide-check-square ml-auto size-4 shrink-0" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
<script setup>
import { dayLabel, itemClasses, itemsOnDay, sameDay, timeLabel } from '@/composables/calendar'
import { computed } from 'vue'

const props = defineProps({
  days: { type: Array, required: true },
  items: { type: Array, default: () => [] },
})
defineEmits(['itemClick'])

const today = new Date()
const groups = computed(() =>
  props.days.map((day) => ({ day, items: itemsOnDay(props.items, day) })).filter((g) => g.items.length),
)
</script>
