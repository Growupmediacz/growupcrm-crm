<template>
  <!-- GrowUp (zadání 2027 E2): oznámení na telefon (Web Push). Výchozí stav: vše vypnuté a bez zvuku
       (rozhodnutí Ivana 2026-11-20). Data: growupcrm.push.get_config / set_prefs / send_test. -->
  <section class="mt-10" aria-labelledby="gl-push-title">
    <div id="gl-push-title" class="text-base-semibold text-ink-gray-9">{{ __('Oznámení na telefon') }}</div>
    <div class="mt-1 text-p-sm text-ink-gray-6">
      {{ __('Oznámení přijdou i se zavřeným CRM. Ve výchozím stavu je vše vypnuté a tiché; zapnete jen to, co chcete.') }}
    </div>

    <GlInstallPrompt class="mt-4" />

    <div class="mt-4 rounded-[16px] border border-[var(--line)] p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="min-w-0 flex-1">
          <div class="text-[15px] font-semibold text-ink-gray-9">{{ __('Toto zařízení') }}</div>
          <div class="text-[14px] text-ink-gray-6">{{ deviceText }}</div>
        </div>
        <Button
          v-if="!subscribed"
          class="!h-11"
          variant="solid"
          :label="__('Zapnout oznámení v tomto zařízení')"
          :loading="busy"
          :disabled="!canEnable"
          @click="enable"
        />
        <template v-else>
          <Button class="!h-11" :label="__('Poslat zkušební')" :loading="busyTest" @click="test" />
          <Button class="!h-11" :label="__('Vypnout v tomto zařízení')" :loading="busy" @click="disable" />
        </template>
      </div>
    </div>

    <div class="mt-4 overflow-hidden rounded-[16px] border border-[var(--line)]">
      <div class="bg-[var(--accent-50)] px-4 py-2.5 text-[13px] font-semibold text-ink-gray-5">
        {{ __('Co poslat na telefon') }}
      </div>
      <label v-for="k in KINDS" :key="k.key" class="flex min-h-[56px] cursor-pointer items-center gap-3 border-t border-[var(--line)] px-4 py-3">
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="text-[15px] text-ink-gray-9">{{ k.label }}</span>
          <span class="text-[13px] text-ink-gray-5">{{ k.hint }}</span>
        </span>
        <Switch v-model="prefs.types[k.key]" :aria-label="k.label" @update:modelValue="save" />
      </label>
      <label class="flex min-h-[56px] cursor-pointer items-center gap-3 border-t border-[var(--line)] px-4 py-3">
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="text-[15px] text-ink-gray-9">{{ __('Se zvukem') }}</span>
          <span class="text-[13px] text-ink-gray-5">{{ __('Vypnuto = oznámení přijde potichu, jen se ukáže.') }}</span>
        </span>
        <Switch v-model="prefs.sound" :aria-label="__('Se zvukem')" @update:modelValue="save" />
      </label>
      <div class="flex flex-wrap items-center gap-3 border-t border-[var(--line)] px-4 py-3">
        <label class="flex w-full min-w-0 cursor-pointer items-center gap-3">
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="text-[15px] text-ink-gray-9">{{ __('Tiché hodiny') }}</span>
            <span class="text-[13px] text-ink-gray-5">{{ __('V tuto dobu se nic neposílá.') }}</span>
          </span>
          <Switch v-model="prefs.quiet.enabled" :aria-label="__('Tiché hodiny')" @update:modelValue="save" />
        </label>
        <div v-if="prefs.quiet.enabled" class="flex flex-wrap items-center gap-2 text-[15px] text-ink-gray-7">
          {{ __('od') }}
          <input v-model="prefs.quiet.from" type="time" class="gl-push-time" :aria-label="__('Tiché hodiny od')" @change="save" />
          {{ __('do') }}
          <input v-model="prefs.quiet.to" type="time" class="gl-push-time" :aria-label="__('Tiché hodiny do')" @change="save" />
        </div>
      </div>
    </div>
  </section>
</template>
<script setup>
import GlInstallPrompt from '@/components/GlInstallPrompt.vue'
import { Switch, call, toast } from 'frappe-ui'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  disablePush,
  enablePush,
  loadPushConfig,
  needsInstallFirst,
  permission,
  pushSupported,
  serverKey,
  subscribed,
} from '@/composables/glPush'

const KINDS = [
  { key: 'reply', label: __('Odpověď zájemce'), hint: __('Zájemce odpověděl na e-mail; klepnutí otevře zakázku') },
  { key: 'agent_queue', label: __('Nová položka od agenta'), hint: __('Agent připravil něco ke schválení ve frontě Dnes') },
  { key: 'week_ready', label: __('Týden připraven'), hint: __('Kampaň na další týden čeká na schválení') },
]

const prefs = reactive({ types: { reply: false, agent_queue: false, week_ready: false }, sound: false, quiet: { enabled: true, from: '21:00', to: '07:00' } })
const busy = ref(false)
const busyTest = ref(false)
const loaded = ref(false)

const canEnable = computed(() => loaded.value && pushSupported && Boolean(serverKey.value) && !needsInstallFirst.value && permission.value !== 'denied')
const deviceText = computed(() => {
  if (!pushSupported) return __('Tento prohlížeč oznámení nepodporuje.')
  if (needsInstallFirst.value) return __('Na iPhonu fungují oznámení jen z CRM přidaného na plochu. Nejdřív ho přidejte (návod výše).')
  if (loaded.value && !serverKey.value) return __('Oznámení nejsou na serveru nastavena (chybí klíče VAPID).')
  if (permission.value === 'denied') return __('Oznámení jsou v prohlížeči zakázaná. Povolte je v nastavení prohlížeče pro tento web.')
  return subscribed.value ? __('Odběr je zapnutý. Přijdou jen typy zapnuté níže.') : __('Odběr je vypnutý, nic nepřijde.')
})

onMounted(async () => {
  try {
    const cfg = await loadPushConfig()
    if (cfg?.prefs) Object.assign(prefs, cfg.prefs)
  } catch (e) {
    // bez oznámení se dá dál pracovat
  } finally {
    loaded.value = true
  }
})

async function save() {
  try {
    const clean = await call('growupcrm.push.set_prefs', { prefs: JSON.stringify(prefs) })
    if (clean) Object.assign(prefs, clean)
  } catch (e) {
    toast.error(__('Nepodařilo se uložit'))
  }
}

async function enable() {
  busy.value = true
  try {
    await enablePush()
    toast.success(__('Oznámení v tomto zařízení zapnuta'))
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    busy.value = false
  }
}

async function disable() {
  busy.value = true
  try {
    await disablePush()
  } finally {
    busy.value = false
  }
}

async function test() {
  busyTest.value = true
  try {
    const r = await call('growupcrm.push.send_test')
    if (r?.sent) toast.success(__('Zkušební oznámení odesláno'))
    else toast.error(__('Zkušební oznámení se nepodařilo doručit'))
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    busyTest.value = false
  }
}
</script>
<style scoped>
.gl-push-time {
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid var(--field-border);
  padding: 0 10px;
  font-size: 16px;
  background: var(--mat-card-bg);
}
</style>
