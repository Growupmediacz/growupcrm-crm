<template>
  <!-- GrowUp (design systém 2. kola): skeleton při načítání – tvar odpovídá obsahu, jemné vlnění 1,4 s, nikdy prázdná plocha -->
  <div class="flex flex-col gap-3" role="status" :aria-label="__('Načítání')">
    <template v-if="variant === 'cards'">
      <div class="grid gap-3" :class="cols">
        <div v-for="i in rows" :key="i" class="gl-skel-card"><span class="gl-skel h-4 w-2/3" /><span class="gl-skel h-3 w-full" /><span class="gl-skel h-3 w-4/5" /></div>
      </div>
    </template>
    <template v-else>
      <div v-for="i in rows" :key="i" class="flex items-center gap-3 px-1 py-1.5">
        <span class="gl-skel size-10 shrink-0 !rounded-full" />
        <span class="flex flex-1 flex-col gap-2"><span class="gl-skel h-3.5 w-1/3" /><span class="gl-skel h-3 w-1/2" /></span>
        <span class="gl-skel h-3.5 w-16" />
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'rows' },
  rows: { type: Number, default: 4 },
  cols: { type: String, default: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' },
})
</script>
