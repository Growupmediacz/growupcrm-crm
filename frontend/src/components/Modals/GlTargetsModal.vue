<template>
  <!-- GrowUp: „Upravit cíle“ (design). Data: growupcrm.goals.get_targets / save_targets -->
  <Dialog v-model:open="show" :title="__('Cíle na {0}', [monthLabel])" :options="{ size: '3xl' }">
    <template #default>
      <div class="flex flex-col gap-4">
        <div class="gl-seg self-start">
          <button v-for="m in months" :key="m.value" class="gl-seg-btn" :class="month === m.value && 'gl-seg-on'" @click="month = m.value">{{ m.label }}</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[620px] text-[14px]">
            <thead class="text-left text-[12px] font-bold text-ink-gray-5">
              <tr>
                <th class="py-2">{{ __('Obchodník') }}</th>
                <th class="py-2">{{ __('Zakázky') }}</th>
                <th class="py-2">{{ __('Schůzky') }}</th>
                <th class="py-2">{{ __('Tržby (tis. Kč)') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.user">
                <td class="py-2 pr-3">
                  <span class="flex items-center gap-2.5">
                    <span class="flex size-8 items-center justify-center rounded-full bg-[#dde6ff] text-[11px] font-bold text-[#2440a6]">{{ initials(r.full_name) }}</span>
                    <span class="font-semibold text-ink-gray-9">{{ r.full_name }}</span>
                  </span>
                </td>
                <td v-for="f in FIELDS" :key="f.key" class="py-2 pr-3">
                  <span class="gl-chip inline-flex h-10 items-center gap-1 rounded-full px-1">
                    <button type="button" class="gl-chip-x" :aria-label="__('Méně')" @click="step(r, f, -1)">−</button>
                    <input v-model.number="r[f.key]" type="number" min="0" class="gl-chip-input w-14 text-center text-[15px] font-bold" />
                    <button type="button" class="gl-chip-x" :aria-label="__('Více')" @click="step(r, f, 1)">+</button>
                  </span>
                </td>
              </tr>
              <tr class="bg-[rgba(110,120,200,.08)] font-bold">
                <td class="rounded-l-2xl px-3 py-3 text-ink-gray-9">{{ __('Tým celkem') }}</td>
                <td v-for="(f, i) in FIELDS" :key="f.key" class="num px-6 py-3 text-ink-gray-9" :class="i === FIELDS.length - 1 && 'rounded-r-2xl'">{{ total(f.key) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" :label="__('Uložit cíle')" :loading="saving" @click="save" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { Button, Dialog, ErrorMessage, call, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  months: { type: Array, default: () => [] },
  initial: { type: String, default: '' },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })

// tržby se zadávají v tisících Kč, ukládají v Kč
const FIELDS = [
  { key: 'won', step: 1 },
  { key: 'meetings', step: 1 },
  { key: 'revenue_k', step: 10 },
]
const month = ref(props.initial || props.months[0]?.value)
const rows = ref([])
const saving = ref(false)
const error = ref('')
const monthLabel = computed(() => (props.months.find((m) => m.value === month.value)?.label || '').toLowerCase())

async function load() {
  const data = await call('growupcrm.goals.get_targets', { month: month.value })
  rows.value = data.rows.map((r) => ({ ...r, revenue_k: Math.round((r.revenue || 0) / 1000) }))
}
watch(month, load, { immediate: true })

function step(r, f, dir) {
  r[f.key] = Math.max((Number(r[f.key]) || 0) + dir * f.step, 0)
}
const total = (key) => new Intl.NumberFormat('cs-CZ').format(rows.value.reduce((a, r) => a + (Number(r[key]) || 0), 0))

async function save() {
  saving.value = true
  error.value = ''
  try {
    await call('growupcrm.goals.save_targets', {
      month: month.value,
      rows: rows.value.map((r) => ({ user: r.user, won: r.won, meetings: r.meetings, revenue: (Number(r.revenue_k) || 0) * 1000 })),
    })
    toast.success(__('Cíle jsou uložené'))
    show.value = false
    emit('saved')
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
  } finally {
    saving.value = false
  }
}
const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
</script>
