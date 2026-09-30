<template>
  <div
    class="mb-0.5 flex cursor-pointer items-center gap-1 truncate rounded border px-1 py-0.5 text-xs"
    :class="itemClasses(item)"
    :title="item.title"
  >
    <span v-if="item.kind === 'task'" class="lucide-check-square size-3 shrink-0" aria-hidden="true" />
    <span v-if="showTime && !item.allDay" class="shrink-0 font-medium">{{ timeLabel(item.start) }}</span>
    <span class="truncate">{{ item.title }}</span>
  </div>
</template>
<script setup>
import { itemClasses, timeLabel } from '@/composables/calendar'

defineProps({
  item: { type: Object, required: true },
  showTime: { type: Boolean, default: false },
})
</script>
