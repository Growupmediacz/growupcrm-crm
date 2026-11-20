<template>
  <!-- GrowUp (zadání 2027 E2): detail zakázky podle šířky – telefon MobileLead, jinak Lead.
       Přepne se i při otočení / změně šířky okna (dřív se volilo jednou při prvním otevření trasy). -->
  <component :is="isPhone ? MobileLead : Lead" v-bind="$attrs" />
</template>
<script setup>
import { isPhone } from '@/composables/glBreakpoint'
import { defineAsyncComponent } from 'vue'

defineOptions({ inheritAttrs: false })
const MobileLead = defineAsyncComponent(() => import('@/pages/MobileLead.vue'))
const Lead = defineAsyncComponent(() => import('@/pages/Lead.vue'))
</script>
