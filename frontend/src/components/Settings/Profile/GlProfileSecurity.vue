<template>
  <!-- GrowUp (design 3. kolo, 26): Zabezpečení – přihlášení přes Google (pro celý web, zapíná správce). -->
  <div v-if="s.data" class="mb-8">
    <div class="mb-2 text-base-semibold text-ink-gray-9">{{ __('Přihlášení přes Google') }}</div>
    <div class="flex items-center justify-between gap-4 rounded-[16px] border border-[var(--line)] bg-white/80 px-4 py-3.5">
      <div class="flex min-w-0 flex-col">
        <span class="text-[15px] text-ink-gray-9">
          {{ s.data.enabled ? __('Zapnuto – na přihlašovací stránce je tlačítko Google') : __('Vypnuto') }}
        </span>
        <span class="text-[12.5px] text-ink-gray-5">
          <template v-if="!s.data.available">{{ __('Nejdřív je potřeba nastavit klienta Google (Nastavení → E-mail).') }}</template>
          <template v-else-if="s.data.can_manage">{{ __('V Google Cloud musí být povolená adresa:') }} <code class="select-all">{{ s.data.redirect_uri }}</code></template>
          <template v-else>{{ __('Přihlásí se jen existující uživatel se stejným e-mailem. Zapíná správce.') }}</template>
        </span>
      </div>
      <Switch
        v-if="s.data.can_manage"
        :modelValue="s.data.enabled"
        :disabled="!s.data.available || saving"
        :aria-label="__('Přihlášení přes Google')"
        @update:modelValue="toggle"
      />
    </div>
  </div>
</template>
<script setup>
import { Switch, call, createResource, toast } from 'frappe-ui'
import { ref } from 'vue'

const s = createResource({ url: 'growupcrm.google_login.status', auto: true })
const saving = ref(false)
async function toggle(v) {
  saving.value = true
  try {
    s.data = await call('growupcrm.google_login.set_enabled', { enabled: v ? 1 : 0 })
  } catch (e) {
    toast.error(e.messages?.[0] || __('Nepodařilo se uložit'))
  } finally {
    saving.value = false
  }
}
</script>
