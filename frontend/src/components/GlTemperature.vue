<template>
  <!-- GrowUp: teplota zakázky (Horká / Teplá / Studená). S `editable` jde jedním klikem přepnout. -->
  <Dropdown v-if="editable" :options="options" placement="left">
    <button
      class="gl-temp inline-flex min-h-[36px] items-center gap-1 rounded-full font-bold uppercase tracking-wide"
      :class="[tone.cls, size === 'sm' ? 'h-6 px-2 text-[13px]' : 'h-7 px-3 text-[13px]']"
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
    :class="[tone.cls, size === 'sm' ? 'h-6 px-2 text-[13px]' : 'h-7 px-3 text-[13px]']"
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
  'Horká': { cls: 'bg-[var(--c-red-400)] text-white' },
  'Teplá': { cls: 'bg-[var(--c-amber-350)] text-[var(--c-amber-800)]' },
  'Studená': { cls: 'bg-[var(--c-blue-450-3)] text-white' },
}
const tone = computed(() => TONES[props.value] || { cls: 'bg-[color-mix(in_srgb,var(--c-tint)_14%,transparent)] text-ink-gray-7' })

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
