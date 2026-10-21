<template>
  <!-- GrowUp (design 3. kolo, 31): pravidla přiřazení jako věty s čipy, pořadí tažením (= priorita),
       zapnutí přepínačem, úprava v editoru CRM. Data: growupcrm.assignment.get_rules / set_order. -->
  <SettingsLayoutBase :title="__('Pravidla přiřazení')" :description="__('Kdo dostane novou zakázku. Pravidla se zkoušejí shora dolů.')">
    <template #header-actions>
      <Button variant="solid" iconLeft="plus" :label="__('Nové pravidlo')" @click="updateStep('view', null)" />
    </template>
    <template #content>
      <div v-if="rules.loading && !rules.data" class="py-6"><GlSkeleton :rows="3" /></div>
      <div v-else class="flex flex-col gap-3">
        <Draggable :list="list" item-key="name" handle=".gl3-drag" class="flex flex-col gap-3" @end="saveOrder">
          <template #item="{ element: r, index: i }">
            <div class="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-4" :class="r.disabled && 'opacity-60'">
              <span class="gl3-drag flex cursor-grab text-ink-gray-4" :title="__('Přetáhnout')"><GlIcon name="grip" :size="18" /></span>
              <span class="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[rgba(110,120,200,.1)] text-[15px] font-bold text-ink-gray-7">{{ i + 1 }}</span>
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <div class="flex flex-wrap items-center gap-1.5 text-[15px] text-ink-gray-8">
                  <template v-if="r.conditions.length">
                    <span>{{ __('Když') }}</span>
                    <template v-for="(c, k) in flat(r.conditions)" :key="k">
                      <span v-if="c.join" class="text-ink-gray-5">{{ c.join === 'or' ? __('nebo') : __('a') }}</span>
                      <template v-else>
                        <span class="gl3-rule-chip">{{ c.field }}</span>
                        <span>{{ opWord(c.op) }}</span>
                        <span class="gl3-rule-chip">{{ valueWord(c.value) }}</span>
                      </template>
                    </template>
                  </template>
                  <span v-else>{{ __('Každá nová zakázka') }}</span>
                  <span class="text-ink-gray-4">→</span>
                  <span>{{ ruleWord(r) }}</span>
                  <span v-if="r.field" class="gl3-rule-chip">{{ r.field }}</span>
                  <span v-for="u in r.users" :key="u.name" class="gl3-rule-chip gl3-rule-user">
                    <span class="flex size-5 items-center justify-center rounded-full bg-[#dde6ff] text-[9px] font-bold text-[#2440a6]">{{ initials(u.full_name) }}</span>{{ u.full_name }}
                  </span>
                </div>
                <div class="text-[12.5px] text-ink-gray-5">
                  {{ r.name }}<template v-if="r.used"> · {{ __('Použito {0}× tento měsíc', [r.used]) }}</template>
                </div>
              </div>
              <Switch :modelValue="!r.disabled" :aria-label="__('Zapnuto')" @update:modelValue="(v) => toggle(r, v)" />
              <Dropdown :options="menu(r)" placement="right">
                <Button icon="more-horizontal" variant="ghost" :aria-label="__('Další akce')" />
              </Dropdown>
            </div>
          </template>
        </Draggable>

        <!-- výchozí chování bez pravidla -->
        <div class="flex items-center gap-3 rounded-[18px] border border-dashed border-[var(--line)] px-4 py-4">
          <span class="w-[18px]" />
          <span class="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-[rgba(110,120,200,.1)] text-[15px] font-bold text-ink-gray-7">{{ list.length + 1 }}</span>
          <div class="flex flex-1 flex-wrap items-center gap-1.5 text-[15px] text-ink-gray-8">
            <span class="font-semibold">{{ __('Ostatní zakázky') }}</span>
            <span class="text-ink-gray-4">→</span>
            <span>{{ __('nechat bez vlastníka a upozornit vedoucí') }}</span>
            <span class="rounded-full bg-[rgba(110,120,200,.1)] px-2.5 py-0.5 text-[12px] font-semibold text-ink-gray-5">{{ __('Výchozí') }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 rounded-[14px] bg-[rgba(46,107,230,.07)] px-4 py-3 text-[13px] text-ink-gray-7">
          <GlIcon name="alert" :size="16" class="text-[#2453c9]" />
          {{ __('Když zakázka nemá vlastníka, upozorní se všichni vedoucí a správci.') }}
        </div>
      </div>
    </template>
  </SettingsLayoutBase>
</template>
<script setup>
import SettingsLayoutBase from '@/components/Layouts/SettingsLayoutBase.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import Draggable from 'vuedraggable'
import { Button, Dropdown, Switch, call, createResource, toast } from 'frappe-ui'
import { inject, ref, watch } from 'vue'

const updateStep = inject('updateStep')
const rules = createResource({ url: 'growupcrm.assignment.get_rules', auto: true })
const list = ref([])
watch(
  () => rules.data,
  (d) => (list.value = [...(d || [])]),
  { immediate: true },
)

// podmínky do jedné řady (skupiny v závorkách zploštíme, spojky zůstávají)
const flat = (items) => items.flatMap((c) => (c.group ? flat(c.group) : [c]))
const OPS = {
  equals: __('je'), '=': __('je'), '==': __('je'), 'not equals': __('není'), '!=': __('není'),
  '>': __('je větší než'), '>=': __('je aspoň'), '<': __('je menší než'), '<=': __('je nejvýš'),
  in: __('je jedno z'), 'not in': __('není z'), like: __('obsahuje'), 'not like': __('neobsahuje'),
  is: __('je'), 'is not': __('není'), between: __('je mezi'),
}
const opWord = (op) => OPS[op] || op
const valueWord = (v) => {
  if (Array.isArray(v)) return v.join(', ')
  if (v === 'set') return __('vyplněno')
  if (v === 'not set') return __('nevyplněno')
  return __(String(v))
}
function ruleWord(r) {
  if (r.rule === 'Based on Field') return __('přiřadit podle pole')
  if (r.users.length <= 1) return __('přiřadit')
  return r.rule === 'Load Balancing' ? __('rozdělit podle vytížení mezi') : __('střídat mezi')
}
const initials = (s) => (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

async function toggle(r, on) {
  r.disabled = on ? 0 : 1
  try {
    await call('frappe.client.set_value', { doctype: 'Assignment Rule', name: r.name, fieldname: 'disabled', value: r.disabled })
  } catch (e) {
    r.disabled = on ? 1 : 0
    toast.error(e.messages?.[0] || __('Nepodařilo se uložit'))
  }
}
async function saveOrder() {
  try {
    await call('growupcrm.assignment.set_order', { names: JSON.stringify(list.value.map((r) => r.name)) })
  } catch (e) {
    toast.error(e.messages?.[0] || __('Pořadí se nepodařilo uložit'))
    rules.reload()
  }
}
function menu(r) {
  return [
    { label: __('Upravit'), icon: 'edit-2', onClick: () => updateStep('view', { name: r.name }) },
    {
      label: __('Smazat'),
      icon: 'trash-2',
      theme: 'red',
      onClick: async () => {
        if (!window.confirm(__('Smazat pravidlo {0}?', [r.name]))) return
        await call('frappe.client.delete', { doctype: 'Assignment Rule', name: r.name })
        rules.reload()
      },
    },
  ]
}
</script>
