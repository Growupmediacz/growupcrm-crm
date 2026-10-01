<template>
  <!-- GrowUp: rychlý filtr jako čip (design Liquid Glass). Logiku filtrů dál drží ViewControls. -->
  <label
    v-if="isText"
    class="gl-chip flex h-9 items-center gap-2 rounded-full pl-3 pr-1"
    :class="text ? 'gl-chip-on' : ''"
  >
    <GlIcon name="search" :size="15" class="shrink-0 opacity-60" />
    <input
      v-model="text"
      class="gl-chip-input w-36 bg-transparent text-[14px]"
      :placeholder="__(filter.label)"
      @input="debounced(text)"
    />
    <button v-if="text" class="gl-chip-x" :aria-label="__('Zrušit filtr')" @click.prevent="clear">
      <GlIcon name="x" :size="13" />
    </button>
  </label>

  <button
    v-else-if="filter.fieldtype === 'Check'"
    class="gl-chip flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px]"
    :class="filter.value ? 'gl-chip-on' : ''"
    @click="emit('applyQuickFilter', filter, !filter.value)"
  >
    {{ __(filter.label) }}
  </button>

  <Dropdown v-else-if="isChoice" :options="menu" placement="left">
    <template #default="{ open }">
      <button
        class="gl-chip flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full pl-3.5 text-[14px]"
        :class="[filter.value ? 'gl-chip-on pr-1' : 'pr-3', open && 'gl-chip-open']"
        @click="load"
      >
        <span class="opacity-75">{{ __(filter.label) }}:</span>
        <b class="font-semibold">{{ filter.value ? labelOf(filter.value) : __('Vše') }}</b>
        <span v-if="!filter.value" class="lucide-chevron-down size-4 opacity-60" aria-hidden="true" />
        <span
          v-else
          role="button"
          class="gl-chip-x"
          :aria-label="__('Zrušit filtr')"
          @click.stop="emit('applyQuickFilter', filter, '')"
        >
          <GlIcon name="x" :size="13" />
        </span>
      </button>
    </template>
  </Dropdown>

  <QuickFilterField v-else :filter="filter" @applyQuickFilter="(f, v) => emit('applyQuickFilter', f, v)" />
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import QuickFilterField from '@/components/QuickFilterField.vue'
import { usersStore } from '@/stores/users'
import { useDebounceFn } from '@vueuse/core'
import { Dropdown, call } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({ filter: { type: Object, required: true } })
const emit = defineEmits(['applyQuickFilter'])

const { users, getUser } = usersStore()

const isText = computed(() => ['Data', 'Small Text', 'Text', 'Phone', 'Email'].includes(props.filter.fieldtype))
const isChoice = computed(() => ['Link', 'Select'].includes(props.filter.fieldtype))
const isUser = computed(() => props.filter.fieldtype === 'Link' && props.filter.options === 'User')

const text = ref(props.filter.value || '')
watch(
  () => props.filter.value,
  (v) => {
    if (isText.value && v !== text.value) text.value = v || ''
  },
)
const debounced = useDebounceFn((v) => emit('applyQuickFilter', props.filter, v), 400)
function clear() {
  text.value = ''
  emit('applyQuickFilter', props.filter, '')
}

// volby: Select z metadat, Link z hledání (u uživatelů jen uživatelé CRM s celým jménem)
const linkOptions = ref([])
async function load() {
  if (props.filter.fieldtype !== 'Link' || isUser.value || linkOptions.value.length) return
  const rows = await call('frappe.desk.search.search_link', {
    doctype: props.filter.options,
    txt: '',
    page_length: 50,
  })
  linkOptions.value = (rows || []).map((r) => ({ value: r.value, label: r.label || r.value }))
}

const choices = computed(() => {
  if (isUser.value) {
    return (users.data?.crmUsers || [])
      .filter((u) => u.name && u.name !== 'Guest' && !u.name.startsWith('api@'))
      .map((u) => ({ value: u.name, label: u.full_name || u.name }))
  }
  if (props.filter.fieldtype === 'Select') {
    return (props.filter.options || [])
      .map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
      .filter((o) => o.value)
  }
  return linkOptions.value
})

function labelOf(value) {
  if (isUser.value) return getUser(value)?.full_name || value
  const hit = choices.value.find((c) => c.value === value)
  return __(hit?.label || value)
}

const menu = computed(() => [
  { label: __('Vše'), onClick: () => emit('applyQuickFilter', props.filter, '') },
  ...choices.value.map((c) => ({
    label: __(c.label),
    onClick: () => emit('applyQuickFilter', props.filter, c.value),
  })),
])
</script>
<style>
.gl-chip {
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: inset 0 1px 0 #fff, 0 4px 12px -8px rgba(40, 40, 120, 0.3);
  color: var(--ink-gray-8, #2a2f52);
  transition: background 0.15s, box-shadow 0.15s;
}
.gl-chip:hover,
.gl-chip-open {
  background: rgba(255, 255, 255, 0.9);
}
.gl-chip-on {
  background: rgba(79, 70, 229, 0.1);
  border-color: rgba(79, 70, 229, 0.18);
  color: #4338ca;
}
.gl-chip-x {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}
.gl-chip-x:hover {
  background: rgba(79, 70, 229, 0.14);
}
input.gl-chip-input:not(#_),
input.gl-chip-input:not(#_):focus {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  height: auto !important;
  padding: 0;
  outline: none;
}
</style>
