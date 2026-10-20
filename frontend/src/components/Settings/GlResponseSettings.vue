<template>
  <!-- GrowUp: Nastavení → Reakční doba (growupcrm.response_time) -->
  <div class="flex h-full flex-col gap-5 overflow-y-auto p-6 text-ink-gray-8">
    <div>
      <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('Reakční doba') }}</h2>
      <p class="mt-1 text-p-base text-ink-gray-6">
        {{ __('Do kdy má obchodník odpovědět na příchozí zakázku (web, formuláře, Facebook, API, Outreach). Po termínu přijde upozornění vlastníkovi zakázky, bez vlastníka vedoucím.') }}
      </p>
    </div>
    <GlSkeleton v-if="!form" :rows="3" />
    <div v-else class="gl-card flex flex-col gap-5 !rounded-[20px] p-5">
      <label class="flex items-center justify-between gap-3">
        <span class="flex flex-col">
          <span class="text-[15px] font-semibold text-ink-gray-9">{{ __('Hlídat reakční dobu') }}</span>
          <span class="text-[13px] text-ink-gray-5">{{ __('Vypnutím se lhůta u nových zakázek přestane nastavovat.') }}</span>
        </span>
        <Switch v-model="form.enabled" :disabled="!isAdmin()" />
      </label>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Lhůta (pracovní hodiny)') }}</div>
          <input v-model="form.hours" type="number" min="0.25" max="80" step="0.25" class="gl-field w-full" :disabled="!isAdmin()" />
        </div>
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Pracovní doba od') }}</div>
          <input v-model="form.start" type="time" class="gl-field w-full" :disabled="!isAdmin()" />
        </div>
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Pracovní doba do') }}</div>
          <input v-model="form.end" type="time" class="gl-field w-full" :disabled="!isAdmin()" />
        </div>
      </div>
      <ul class="flex flex-col gap-1 text-[13px] text-ink-gray-6">
        <li>• {{ __('Počítají se jen pracovní dny (Po–Pá) bez státních svátků. Poptávka v noci se počítá od rána.') }}</li>
        <li>• {{ __('Odpovědí je první odeslaný e-mail, zapsaný hovor nebo posun zakázky ze stavu „Nová“.') }}</li>
        <li>• {{ __('Zakázky, které obchodník zakládá sám, se neměří. Výsledky najdete v Analytice.') }}</li>
      </ul>
      <div v-if="isAdmin()" class="flex justify-end">
        <Button variant="solid" :label="__('Uložit')" :loading="saving" @click="save" />
      </div>
    </div>
  </div>
</template>

<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import { saveFailed } from '@/composables/glToast'
import { usersStore } from '@/stores/users'
import { Button, Switch, call, createResource, toast } from 'frappe-ui'
import { ref } from 'vue'

const { isAdmin } = usersStore()
const form = ref(null)
const saving = ref(false)
createResource({
  url: 'growupcrm.response_time.get_settings',
  auto: true,
  onSuccess: (d) => (form.value = { ...d, enabled: Boolean(d.enabled) }),
})

async function save() {
  saving.value = true
  try {
    const d = await call('growupcrm.response_time.save_settings', { ...form.value, enabled: form.value.enabled ? 1 : 0 })
    form.value = { ...d, enabled: Boolean(d.enabled) }
    toast.success(__('Uloženo'))
  } catch (e) {
    saveFailed(e, save)
  } finally {
    saving.value = false
  }
}
</script>
