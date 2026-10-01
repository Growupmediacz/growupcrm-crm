<template>
  <!-- GrowUp (design 2. kolo, C6): položky Nastavení agenturních modulů – Schránka (Outreach) a Šablony projektů -->
  <div class="flex h-full flex-col gap-5 p-6 text-ink-gray-8">
    <template v-if="kind === 'mailbox'">
      <div>
        <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('Schránka') }}</h2>
        <p class="mt-1 text-p-base text-ink-gray-6">{{ __('E-maily z Outreach odcházejí z vaší adresy a odpovědi chodí zpět do CRM.') }}</p>
      </div>
      <div class="gl-card flex flex-wrap items-center justify-between gap-3 !rounded-[20px] p-5">
        <div>
          <div class="flex items-center gap-2 text-[16px] font-bold text-ink-gray-9">
            <span class="size-2.5 rounded-full" :class="mb.data?.enabled ? 'bg-[#22b35e]' : 'bg-[#e0a100]'" />{{ mb.data?.enabled ? __('Schránka připojena') : __('Schránka není připojená') }}
          </div>
          <div class="mt-1 text-[13px] text-ink-gray-5">{{ mb.data?.from_email || mb.data?.smtp_user || __('Zatím nic nenastaveno') }}<template v-if="mb.data?.last_test_at"> · {{ __('poslední test {0}', [mb.data.last_test_at]) }}</template></div>
        </div>
        <Button variant="solid" :label="mb.data?.enabled ? __('Upravit') : __('Připojit schránku')" @click="show = true" />
      </div>
      <GlMailboxModal v-if="show" v-model="show" @changed="mb.reload()" />
    </template>
    <template v-else>
      <div>
        <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('Šablony projektů') }}</h2>
        <p class="mt-1 text-p-base text-ink-gray-6">{{ __('Fáze a úkoly, které se založí s novým projektem, včetně termínů od začátku a rolí.') }}</p>
      </div>
      <div class="gl-card flex items-center justify-between gap-3 !rounded-[20px] p-5">
        <span class="text-[15px] text-ink-gray-7">{{ __('Šablony se upravují na samostatné stránce.') }}</span>
        <router-link :to="{ name: 'ProjectTemplates' }" @click="showSettings = false"><Button variant="solid" :label="__('Otevřít šablony')" /></router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
import GlMailboxModal from '@/components/Outreach/GlMailboxModal.vue'
import { showSettings } from '@/composables/settings'
import { Button, createResource } from 'frappe-ui'
import { ref } from 'vue'

const props = defineProps({ kind: { type: String, default: 'mailbox' } })
const show = ref(false)
const mb = createResource({ url: 'growupcrm.outreach.get_mailbox', auto: props.kind === 'mailbox' })
</script>
