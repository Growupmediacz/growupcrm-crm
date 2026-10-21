<template>
  <!-- GrowUp (design 3. kolo): sloučená sekce nastavení – záložky nahoře, pod nimi původní stránka CRM. -->
  <div class="flex h-full min-h-0 flex-col">
    <div class="shrink-0 px-6 pt-5">
      <div class="gl-seg inline-flex max-w-full overflow-x-auto">
        <button
          v-for="(it, i) in items"
          :key="it.label"
          class="gl-seg-btn whitespace-nowrap"
          :class="current === i && 'gl-seg-on'"
          @click="current = i"
        >
          {{ it.label }}
        </button>
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto">
      <component :is="items[current]?.component" />
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  // index záložky, kterou otevřít (deep link na původní stránku, např. „Invite User“)
  initial: { type: Number, default: 0 },
})
const current = ref(props.initial)
watch(
  () => props.initial,
  (i) => (current.value = i),
)
</script>
