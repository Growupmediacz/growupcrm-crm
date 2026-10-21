<template>
  <!-- GrowUp (design 3. kolo, 27): matice oznámení – událost × V aplikaci / E-mailem.
       Data: growupcrm.notify_prefs.get_my_prefs / set_my_prefs. Ukládá se hned po přepnutí. -->
  <div class="mt-10">
    <div class="text-base-semibold text-ink-gray-9">{{ __('Oznámení') }}</div>
    <div class="mt-1 text-p-sm text-ink-gray-6">{{ __('Co vám CRM ohlásí ve zvonku a co pošle e-mailem.') }}</div>
    <div class="mt-4 overflow-hidden rounded-[16px] border border-[var(--line)]">
      <div class="grid grid-cols-[1fr_56px_56px] sm:grid-cols-[1fr_96px_96px] items-center gap-2 bg-[rgba(110,120,200,.06)] px-3 py-2.5 text-[12px] sm:px-4 sm:text-[13px] font-semibold text-ink-gray-5">
        <span>{{ __('Událost') }}</span>
        <span class="text-center"><span class="sm:hidden">{{ __('Aplikace') }}</span><span class="max-sm:hidden">{{ __('V aplikaci') }}</span></span>
        <span class="text-center">{{ __('E-mailem') }}</span>
      </div>
      <div
        v-for="e in EVENTS"
        :key="e.key"
        class="grid grid-cols-[1fr_56px_56px] sm:grid-cols-[1fr_96px_96px] items-center gap-2 border-t border-[var(--line)] px-3 py-3 sm:px-4"
      >
        <span class="flex flex-col">
          <span class="text-[15px] text-ink-gray-9">{{ e.label }}</span>
          <span class="text-[12.5px] text-ink-gray-5">{{ e.hint }}</span>
        </span>
        <span v-for="c in ['app', 'email']" :key="c" class="flex justify-center">
          <Switch
            v-if="prefs[e.key]"
            :modelValue="prefs[e.key][c]"
            :aria-label="`${e.label} – ${c === 'app' ? __('V aplikaci') : __('E-mailem')}`"
            @update:modelValue="(v) => toggle(e.key, c, v)"
          />
        </span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { Switch, call, createResource, toast } from 'frappe-ui'
import { reactive } from 'vue'

const EVENTS = [
  { key: 'assign', label: __('Nová zakázka přiřazena'), hint: __('Někdo vám přidělí zakázku nebo schůzku') },
  { key: 'meeting', label: __('Schůzka za hodinu'), hint: __('Připomínka události v kalendáři') },
  { key: 'task', label: __('Úkol s termínem'), hint: __('Den a hodinu před termínem') },
  { key: 'mention', label: __('Zmínka v zápisu nebo úkolu'), hint: __('Kolega vás označí přes @') },
  { key: 'outreach', label: __('Odpověď na outreach'), hint: __('Kontakt odpověděl na kampaň') },
  { key: 'response', label: __('Zakázka bez odpovědi'), hint: __('Poptávka čeká déle než reakční doba') },
]

const prefs = reactive({})
createResource({
  url: 'growupcrm.notify_prefs.get_my_prefs',
  auto: true,
  onSuccess: (data) => Object.assign(prefs, data),
})

async function toggle(event, channel, value) {
  prefs[event][channel] = value
  try {
    await call('growupcrm.notify_prefs.set_my_prefs', { prefs: JSON.stringify(prefs) })
  } catch (e) {
    prefs[event][channel] = !value
    toast.error(__('Nepodařilo se uložit'))
  }
}
</script>
