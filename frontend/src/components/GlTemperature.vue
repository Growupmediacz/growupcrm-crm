<template>
  <!-- GrowUp: teplota zakázky (Horká / Teplá / Studená). S `editable` jde jedním klikem přepnout. -->
  <Dropdown v-if="editable" :options="options" placement="left">
    <button
      class="gl-temp inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide"
      :class="[tone.cls, size === 'sm' ? 'h-5 px-2 text-[10.5px]' : 'h-7 px-3 text-[12px]']"
      :aria-label="__('Teplota zakázky')"
      @click.stop
    >
      {{ value ? __(value) : __('Teplota') }}
      <GlIcon name="down" :size="size === 'sm' ? 11 : 13" class="opacity-70" />
    </button>
  </Dropdown>
  <span
    v-else-if="value"
    class="gl-temp inline-flex shrink-0 items-center rounded-full font-bold uppercase tracking-wide"
    :class="[tone.cls, size === 'sm' ? 'h-5 px-2 text-[10.5px]' : 'h-7 px-3 text-[12px]']"
  >
    {{ __(value) }}
  </span>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { Dropdown, call, toast } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
  lead: { type: String, default: '' },
  editable: { type: Boolean, default: false },
  size: { type: String, default: 'sm' },
})
const emit = defineEmits(['changed'])

// barvy jako štítky Pipedrive: horká červená, teplá jantarová, studená modrá
const TONES = {
  'Horká': { cls: 'bg-[#e5484d] text-white' },
  'Teplá': { cls: 'bg-[#ffd84d] text-[#5c3d00]' },
  'Studená': { cls: 'bg-[#3e63dd] text-white' },
}
const tone = computed(() => TONES[props.value] || { cls: 'bg-[rgba(110,120,200,.14)] text-ink-gray-7' })

async function set(value) {
  if (value === props.value) return
  try {
    await call('frappe.client.set_value', { doctype: 'CRM Lead', name: props.lead, fieldname: 'temperature', value })
    emit('changed', value)
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}
const options = computed(() => [
  ...Object.keys(TONES).map((t) => ({ label: __(t), onClick: () => set(t) })),
  ...(props.value ? [{ label: __('Bez teploty'), onClick: () => set('') }] : []),
])
</script>
