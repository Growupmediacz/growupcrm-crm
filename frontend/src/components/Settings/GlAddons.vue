<template>
  <!-- GrowUp: Doplňky (growupcrm.addons) – Agent a Outreach, aktivní až po zapnutí od GrowUpMedia -->
  <div class="flex h-full flex-col gap-5 overflow-y-auto p-6 text-ink-gray-8">
    <div>
      <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('Doplňky') }}</h2>
      <p class="mt-1 text-p-base text-ink-gray-6">
        {{ __('Rozšíření CRM, která vám GrowUpMedia zapne a napojí. Dokud doplněk není aktivní, v menu se neukazuje.') }}
      </p>
    </div>

    <GlSkeleton v-if="addons.loading && !addons.data" :rows="2" />
    <GlErrorBanner v-else-if="addons.error" :title="__('Doplňky se nepodařilo načíst')" @retry="addons.reload()" />
    <div v-else class="grid gap-4 md:grid-cols-2">
      <div v-for="a in addons.data" :key="a.name" class="gl-card flex flex-col gap-4 !rounded-[20px] p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="flex size-11 items-center justify-center rounded-2xl bg-[rgba(110,120,200,.12)] text-[#2440a6]">
              <GlIcon :name="a.name === 'agent' ? 'sparkles' : 'send'" :size="20" />
            </span>
            <div class="text-[17px] font-bold text-ink-gray-9">{{ a.title }}</div>
          </div>
          <span
            class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
            :class="a.active ? 'bg-[rgba(34,179,94,.12)] text-[#178a4a]' : 'bg-[rgba(110,120,200,.1)] text-ink-gray-6'"
          >
            <span class="size-1.5 rounded-full" :class="a.active ? 'bg-[#22b35e]' : 'bg-ink-gray-4'" />
            {{ a.active ? __('Aktivní') : __('Neaktivní') }}
          </span>
        </div>
        <p class="text-[14px] leading-relaxed text-ink-gray-7">{{ a.description }}</p>
        <ul class="flex flex-col gap-1.5 text-[13px] text-ink-gray-7">
          <li v-for="f in a.features" :key="f" class="flex items-center gap-2">
            <GlIcon name="check" :size="14" class="text-[#22b35e]" />{{ f }}
          </li>
        </ul>
        <p v-if="a.note" class="text-[13px] text-[#a06a00]">{{ a.note }}</p>
        <div class="mt-auto flex justify-end">
          <router-link v-if="a.active" :to="{ name: a.route }" @click="showSettings = false">
            <Button variant="solid" :label="__('Otevřít')" />
          </router-link>
          <Button v-else-if="requested.includes(a.name)" disabled :label="__('Žádost odeslána')" />
          <Button v-else variant="solid" :label="__('Mám zájem')" :loading="sending === a.name" @click="request(a)" />
        </div>
      </div>
    </div>
    <p class="text-[13px] text-ink-gray-5">
      {{ __('Po odeslání zájmu se vám ozveme, doplněk napojíme a zapneme. Nic se nezapíná samo.') }}
    </p>
  </div>
</template>

<script setup>
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import { saveFailed } from '@/composables/glToast'
import { showSettings } from '@/composables/settings'
import { Button, call, createResource, toast } from 'frappe-ui'
import { ref } from 'vue'

const addons = createResource({ url: 'growupcrm.addons.get_addons', auto: true })
const requested = ref([])
const sending = ref('')

async function request(a) {
  sending.value = a.name
  try {
    await call('growupcrm.addons.request_activation', { addon: a.name })
    requested.value.push(a.name)
    toast.success(__('Děkujeme, ozveme se vám ohledně doplňku {0}.', [a.title]))
  } catch (e) {
    saveFailed(e, () => request(a), __('Žádost se nepodařilo odeslat'))
  } finally {
    sending.value = ''
  }
}
</script>
