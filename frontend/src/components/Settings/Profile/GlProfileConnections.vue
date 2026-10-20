<template>
  <!-- GrowUp: v Profilu rovnou vidět roli a napojené schránky (Můj e-mail, Schránka pro Outreach) -->
  <div class="mb-8 flex flex-col gap-3">
    <div class="text-base-semibold text-ink-gray-9">{{ __('Role a napojení') }}</div>
    <div class="gl-card flex flex-col divide-y divide-[rgba(110,120,200,.14)] !rounded-[20px] px-5">
      <div class="flex items-center justify-between gap-3 py-3.5">
        <div class="flex flex-col gap-0.5">
          <span class="text-base-medium text-ink-gray-8">{{ __('Moje role') }}</span>
          <span class="text-p-sm text-ink-gray-6">{{ roleHint }}</span>
        </div>
        <span class="rounded-full bg-[rgba(110,120,200,.12)] px-3 py-1 text-[13px] font-semibold text-[#2440a6]">{{ roleLabel }}</span>
      </div>

      <div class="flex items-center justify-between gap-3 py-3.5">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-base-medium text-ink-gray-8">{{ __('Můj e-mail') }}</span>
          <span class="flex items-center gap-1.5 truncate text-p-sm" :class="gmail.data?.connected ? 'text-[#178a4a]' : 'text-ink-gray-6'">
            <span class="size-2 shrink-0 rounded-full" :class="gmail.data?.connected ? 'bg-[#22b35e]' : 'bg-ink-gray-4'" />
            <template v-if="gmail.data?.connected">{{ __('Připojeno') }} · {{ gmail.data.email }}</template>
            <template v-else>{{ __('Nepřipojeno') }}</template>
          </span>
        </div>
        <Button :label="gmail.data?.connected ? __('Spravovat') : __('Připojit')" @click="openEmail" />
      </div>

      <div v-if="outreachEnabled" class="flex items-center justify-between gap-3 py-3.5">
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="text-base-medium text-ink-gray-8">{{ __('Outreach odesílá z') }}</span>
          <span class="flex items-center gap-1.5 truncate text-p-sm" :class="outreachFrom ? 'text-[#178a4a]' : 'text-ink-gray-6'">
            <span class="size-2 shrink-0 rounded-full" :class="outreachFrom ? 'bg-[#22b35e]' : 'bg-[#e0a100]'" />
            <template v-if="outreachFrom">{{ __('Připojeno') }} · {{ outreachFrom }}</template>
            <template v-else>{{ __('Nepřipojeno') }}</template>
          </span>
        </div>
        <Button :label="outreachFrom ? __('Spravovat') : __('Připojit')" @click="openEmail" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { outreachEnabled } from '@/composables/agency'
import { activeSettingsPage } from '@/composables/settings'
import { usersStore } from '@/stores/users'
import { Button, createResource } from 'frappe-ui'
import { computed, watch } from 'vue'

const { getUserRole } = usersStore()

const ROLE_HINTS = {
  'System Manager': __('Vidí a nastavuje vše, včetně týmu, tarifu a doplňků.'),
  'Sales Manager': __('Vidí zakázky celého týmu a přiděluje práci.'),
  'Sales User': __('Vidí své zakázky, úkoly a kalendář.'),
}
const role = computed(() => getUserRole() || 'Sales User')
const roleLabel = computed(() => __(role.value))
const roleHint = computed(() => ROLE_HINTS[role.value] || '')

const gmail = createResource({ url: 'growupcrm.gmail.get_status', auto: true })
const mailbox = createResource({ url: 'growupcrm.outreach.get_mailbox' })
watch(outreachEnabled, (on) => on && !mailbox.data && mailbox.fetch(), { immediate: true })

// Outreach odesílá přednostně z Gmailu uživatele (outreach.sender_for), schránka Outreach je jen záloha
const outreachFrom = computed(() =>
  gmail.data?.connected
    ? __('přes Můj e-mail ({0})', [gmail.data.email])
    : mailbox.data?.enabled ? mailbox.data.from_email || mailbox.data.smtp_user : '',
)

function openEmail() {
  activeSettingsPage.value = __('E-mail')
}
</script>
