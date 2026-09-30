<template>
  <div
    v-if="usage.data"
    class="mt-1 inline-flex items-center gap-1 text-p-sm"
    :class="full ? 'text-ink-red-6' : 'text-ink-gray-6'"
  >
    <span v-if="usage.data.max_users">
      {{ __('{0} / {1} uživatelů', [usage.data.used, usage.data.max_users]) }}
    </span>
    <span v-else>{{ __('{0} uživatelů', [usage.data.used]) }}</span>
    <span aria-hidden="true">·</span>
    <span>{{ __('tarif {0}', [usage.data.name]) }}</span>
  </div>
</template>
<script setup>
// GrowUpCRM: obsazenost tarifu, např. „8 / 10 uživatelů · tarif Tým“.
// Data dodává growupcrm.plans.seat_usage (obsazená místa = aktivní uživatelé + čekající pozvánky).
import { createResource } from 'frappe-ui'
import { computed, watch } from 'vue'

const props = defineProps({ refreshKey: { type: [Number, String], default: 0 } })

const usage = createResource({
  url: 'growupcrm.plans.seat_usage',
  auto: true,
})
const full = computed(() => usage.data?.max_users && usage.data.used >= usage.data.max_users)

watch(() => props.refreshKey, () => usage.reload())
</script>
