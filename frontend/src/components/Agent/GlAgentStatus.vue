<template>
  <!-- GrowUp (zadání 2027 E3): karta „Agent“ pro vedoucího (stránka Dnes i Záznam agenta).
       Data: agent_tools.status, audit.recent. Obchodník dostane chybu práv a karta se nevykreslí vůbec. -->
  <section v-if="status.data && !status.error" class="gl-card flex min-w-0 flex-col gap-4" :class="compact ? 'p-4' : 'p-5 md:p-6'" :aria-label="__('Agent')">
    <div class="flex items-center gap-3">
      <span class="relative flex size-3 shrink-0" aria-hidden="true">
        <span class="size-3 rounded-full" :class="enabled ? 'bg-[var(--stage-vyhrano)]' : 'bg-[var(--c-blue-350)]'" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="text-[16px] font-bold text-ink-gray-9">{{ enabled ? __('Agent běží') : __('Agent je vypnutý') }}</h2>
        <div class="text-[13px] text-ink-gray-5">
          <template v-if="status.data.last_call"><span :title="status.data.last_call.tool">{{ __('Poslední volání {0} · {1}', [when(status.data.last_call.at), agentActionLabel(status.data.last_call.tool)]) }}</span></template>
          <template v-else>{{ __('Zatím bez volání') }}</template>
        </div>
      </div>
      <!-- vypínač jedním přepnutím; vypnutí se potvrzuje -->
      <button
        type="button"
        role="switch"
        :aria-checked="enabled"
        :aria-label="enabled ? __('Vypnout agenta') : __('Zapnout agenta')"
        class="relative inline-flex h-11 w-16 shrink-0 items-center justify-center rounded-full md:h-9"
        :disabled="busy"
        @click="toggle"
      >
        <span class="relative h-7 w-12 rounded-full transition-colors" :class="enabled ? 'bg-[var(--accent-600)]' : 'bg-[var(--c-blue-200)]'">
          <span class="absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform" :class="enabled && 'translate-x-5'" />
        </span>
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <span class="gl-chip pointer-events-none inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium">{{ __('Třídění: sám') }}</span>
      <span class="gl-chip pointer-events-none inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium">{{ __('E-maily: ke schválení') }}</span>
      <span class="gl-chip pointer-events-none inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium">{{ __('Cena: vy') }}</span>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-[16px] bg-[var(--fill-tinted)] px-3.5 py-2.5">
        <div class="text-[13px] text-ink-gray-5">{{ __('Volání dnes') }}</div>
        <div class="text-[24px] font-medium leading-tight tabular-nums text-ink-gray-9"><GlNumber :value="status.data.calls_today ?? 0" /></div>
      </div>
      <div class="rounded-[16px] bg-[var(--fill-tinted)] px-3.5 py-2.5">
        <div class="text-[13px] text-ink-gray-5">{{ __('Odmítnuto dnes') }}</div>
        <div class="text-[24px] font-medium leading-tight tabular-nums" :class="status.data.refused_today ? 'text-[var(--c-red-550)]' : 'text-ink-gray-9'"><GlNumber :value="status.data.refused_today ?? 0" /></div>
      </div>
    </div>

    <div v-if="recent.data && !recent.error" class="flex flex-col">
      <div class="pb-1.5 text-[14px] font-semibold text-ink-gray-9">{{ __('Agent udělal sám') }}</div>
      <div v-if="!recent.data.length" class="text-[14px] text-ink-gray-5">{{ __('Zatím nic.') }}</div>
      <ul v-else class="flex flex-col">
        <li v-for="r in recent.data" :key="r.name" class="flex flex-col gap-0.5 border-t border-[var(--line)] py-2 first:border-t-0">
          <div class="flex items-baseline justify-between gap-3">
            <span class="min-w-0 break-words text-[14px] font-medium text-ink-gray-9" :title="r.tool">{{ agentActionLabel(r.tool) }}</span>
            <span class="shrink-0 text-[13px] tabular-nums text-ink-gray-5">{{ when(r.at) }}</span>
          </div>
          <div v-if="r.reference_title || r.reference_name" class="break-words text-[14px] text-ink-gray-7">{{ r.reference_title || r.reference_name }}</div>
          <div v-if="r.reason" class="break-words text-[13px] text-ink-gray-5" :class="compact && 'line-clamp-2'">{{ r.reason }}</div>
        </li>
      </ul>
      <router-link v-if="showLink" :to="{ name: 'AgentLog' }" class="gl-quick mt-2 w-fit !h-11 md:!h-9">{{ __('Celý záznam') }}</router-link>
    </div>

    <Dialog v-model:open="confirmOff" :options="{ title: __('Vypnout agenta?'), size: 'sm' }">
      <template #default>
        <p class="text-[15px] text-ink-gray-7">{{ __('Agent přestane volat nástroje CRM, dokud ho znovu nezapnete. Rozepsané návrhy zůstanou.') }}</p>
        <ErrorMessage class="mt-3" :message="error" />
      </template>
      <template #actions>
        <div class="flex justify-end gap-2">
          <Button class="max-md:!h-11" :label="__('Ponechat zapnutého')" @click="confirmOff = false" />
          <Button variant="solid" theme="red" class="max-md:!h-11" :label="__('Vypnout')" :loading="busy" @click="setEnabled(0)" />
        </div>
      </template>
    </Dialog>
  </section>
</template>
<script setup>
import GlNumber from '@/components/GlNumber.vue'
import { usersStore } from '@/stores/users'
import { agentActionLabel } from '@/utils/glAgentActions'
import { Button, Dialog, ErrorMessage, call, createResource, toast } from 'frappe-ui'
import { computed, ref } from 'vue'

defineProps({
  // užší sloupec na stránce Dnes
  compact: { type: Boolean, default: false },
  // na stránce Záznam agenta odkaz sám na sebe nedává smysl
  showLink: { type: Boolean, default: true },
})
const emit = defineEmits(['changed'])

// jen vedoucí obchodu / správce (obchodník by dostal chybu práv; karta se mu vůbec nenačte)
const manager = usersStore().isManager()
const status = createResource({ url: 'growupcrm.agent_tools.status', auto: manager })
const recent = createResource({ url: 'growupcrm.audit.recent', params: { limit: 5 }, auto: manager })

const enabled = computed(() => Boolean(status.data?.enabled))
const busy = ref(false)
const confirmOff = ref(false)
const error = ref('')

const when = (s) =>
  s
    ? new Date(String(s).replace(' ', 'T')).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

function toggle() {
  if (enabled.value) {
    error.value = ''
    confirmOff.value = true
  } else setEnabled(1)
}

async function setEnabled(value) {
  busy.value = true
  error.value = ''
  try {
    await call('growupcrm.agent_tools.set_enabled', { enabled: value })
    confirmOff.value = false
    toast.success(value ? __('Agent je zapnutý') : __('Agent je vypnutý'))
    await status.reload()
    emit('changed')
  } catch (e) {
    const msg = e.messages?.join('\n') || e.message
    if (value) toast.error(msg)
    else error.value = msg
  } finally {
    busy.value = false
  }
}
</script>
