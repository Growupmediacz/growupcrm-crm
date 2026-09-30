<template>
  <Teleport v-if="showHeader" to="#app-header">
    <slot>
      <header
        class="flex min-h-14 items-center justify-between py-2 sm:pl-2 pl-2"
      >
        <div class="flex items-center gap-2">
          <slot name="left-header" />
        </div>
        <div class="flex items-center gap-2">
          <slot name="right-header" class="flex items-center gap-2" />
        </div>
      </header>
    </slot>
  </Teleport>
</template>
<script setup>
import { ref, nextTick } from 'vue'

const showHeader = ref(false)

nextTick(() => {
  showHeader.value = true
})
</script>
