<template>
  <!-- GrowUp: osobní schránka Google Workspace (growupcrm.gmail) – odesílání z Zakázky a odpovědi zpět -->
  <div class="flex h-full flex-col gap-5 overflow-y-auto p-6 text-ink-gray-8">
    <div>
      <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('Můj e-mail') }}</h2>
      <p class="mt-1 text-p-base text-ink-gray-6">
        {{ __('Připojte svůj Google účet. E-maily ze zakázek pak odejdou z vaší adresy a odpovědi klientů se samy objeví u zakázky.') }}
      </p>
    </div>

    <div v-if="status.loading && !status.data" class="text-ink-gray-5">{{ __('Načítám…') }}</div>
    <template v-else-if="s">
      <div class="flex items-center gap-4 rounded-[20px] bg-[rgba(110,120,200,.07)] p-4">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[20px] font-bold text-[#4285F4]">G</span>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[15px] font-bold text-ink-gray-9">{{ s.email }}</div>
          <div class="flex items-center gap-1.5 text-[13px]" :class="s.connected ? 'text-[#178a4a]' : 'text-ink-gray-6'">
            <span class="size-2 rounded-full" :class="s.connected ? 'bg-[#22b35e]' : 'bg-ink-gray-4'" />
            {{ s.connected ? __('Připojeno') : __('Nepřipojeno') }}
            <span v-if="s.connected && s.last_sync" class="text-ink-gray-5">· {{ __('naposledy staženo') }} {{ formatDate(s.last_sync) }}</span>
          </div>
        </div>
        <template v-if="s.connected">
          <Button :label="__('Stáhnout teď')" :loading="syncing" @click="syncNow" />
          <Button :label="__('Odpojit')" @click="disconnect" />
        </template>
        <Button v-else variant="solid" :label="__('Připojit Google účet')" :loading="connecting" :disabled="!s.configured" @click="connect" />
      </div>

      <GlErrorBanner v-if="s.error" :title="__('Poslední stažení se nepovedlo')" :text="s.error" @retry="syncNow" />
      <p v-if="!s.configured" class="text-[13px] text-ink-gray-6">
        {{ __('Přihlášení přes Google zatím není nastavené. Obraťte se na správce.') }}
      </p>

      <div class="space-y-2 text-[13px] leading-relaxed text-ink-gray-6">
        <p><b class="text-ink-gray-9">{{ __('Co CRM uvidí:') }}</b> {{ __('jen odpovědi na e-maily odeslané ze zakázky a e-maily od lidí, kteří jsou v CRM jako zakázka nebo kontakt.') }}</p>
        <p>{{ __('Ostatní pošta zůstává jen ve vašem Gmailu. CRM nic neoznačuje jako přečtené a nic nemaže.') }}</p>
        <p>{{ __('Při prvním připojení se načtou e-maily za posledních 30 dní, pak každých 5 minut nové.') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import { saveFailed } from '@/composables/glToast'
import { formatDate } from '@/utils'
import { Button, createResource, call, toast } from 'frappe-ui'
import { computed, ref } from 'vue'

const status = createResource({ url: 'growupcrm.gmail.get_status', auto: true })
const s = computed(() => status.data)
const connecting = ref(false)
const syncing = ref(false)

async function connect() {
  connecting.value = true
  try {
    const res = await call('growupcrm.gmail.connect', { success_uri: window.location.pathname + '?mailbox=connected' })
    window.location.href = res.url
  } catch (e) {
    connecting.value = false
    saveFailed(e, connect, __('Připojení se nepovedlo'))
  }
}

async function disconnect() {
  try {
    status.data = await call('growupcrm.gmail.disconnect')
    toast.success(__('Schránka je odpojená'))
  } catch (e) {
    saveFailed(e, disconnect, __('Odpojení se nepovedlo'))
  }
}

async function syncNow() {
  syncing.value = true
  try {
    await call('growupcrm.gmail.sync_now')
    toast.success(__('Stahování spuštěno, nové e-maily se objeví za chvíli'))
    setTimeout(() => status.reload(), 8000)
  } catch (e) {
    saveFailed(e, syncNow, __('Stažení se nepovedlo'))
  } finally {
    syncing.value = false
  }
}
</script>
