<template>
  <!-- GrowUp: výběr firmy z CRM (název nebo IČO). v-model = { name, label } | null -->
  <div class="relative">
    <div
      v-if="modelValue"
      class="flex h-10 items-center gap-2 rounded-[var(--r-field,12px)] border border-white/90 bg-white/70 pl-2 pr-1.5"
    >
      <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#efe7ff] text-[11px] font-bold text-[#6d3fd0]">
        {{ initials(modelValue.label) }}
      </span>
      <span class="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-gray-9">{{ modelValue.label }}</span>
      <button v-if="!locked" type="button" class="gl-chip-x" :aria-label="__('Změnit firmu')" @click="clear">
        <GlIcon name="x" :size="13" />
      </button>
    </div>
    <div v-else class="relative">
      <GlIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-gray-5" />
      <input
        v-model="q"
        class="h-10 w-full pl-9 text-[14px]"
        :placeholder="placeholder || __('Název firmy nebo IČO')"
        @focus="search"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="pick(items[active])"
      />
    </div>
    <div v-if="!modelValue && items.length" class="gl-sheet absolute left-0 right-0 top-full z-20 mt-1.5 flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-2xl p-1.5">
      <button
        v-for="(o, i) in items"
        :key="o.name"
        type="button"
        class="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left"
        :class="i === active ? 'bg-[rgba(79,70,229,.10)]' : 'hover:bg-white/70'"
        @mouseenter="active = i"
        @click="pick(o)"
      >
        <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#dde6ff] text-[11px] font-bold text-[#2e4bb8]">{{ initials(o.organization_name) }}</span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[14px] font-semibold text-ink-gray-9">{{ o.organization_name || o.name }}</span>
          <span class="block truncate text-[12px] text-ink-gray-5">{{ [o.ico && `IČO ${o.ico}`, o.city].filter(Boolean).join(' · ') }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { call } from 'frappe-ui'
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: null },
  locked: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const q = ref('')
const items = ref([])
const active = ref(0)
let timer = null

async function search() {
  const rows = await call('frappe.client.get_list', {
    doctype: 'CRM Organization',
    fields: ['name', 'organization_name', 'ico', 'city'],
    or_filters: q.value.trim()
      ? [
          ['organization_name', 'like', `%${q.value.trim()}%`],
          ['ico', 'like', `%${q.value.trim()}%`],
        ]
      : undefined,
    order_by: 'modified desc',
    limit_page_length: 8,
  })
  items.value = rows || []
  active.value = 0
}
watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(search, 200)
})

function move(step) {
  const n = items.value.length
  if (n) active.value = (active.value + step + n) % n
}
function pick(o) {
  if (!o) return
  emit('update:modelValue', { name: o.name, label: o.organization_name || o.name })
  items.value = []
  q.value = ''
}
function clear() {
  emit('update:modelValue', null)
}
const initials = (s) =>
  (s || '?')
    .replace(/[,.]|s\.r\.o|a\.s/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
</script>
