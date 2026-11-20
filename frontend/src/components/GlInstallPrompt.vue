<template>
  <!-- GrowUp (zadání 2027 E2): „Přidat na plochu“. Android/Chrome: tlačítko (beforeinstallprompt);
       iPhone/iPad: krátký návod (Safari nemá tlačítko pro instalaci). V nainstalované aplikaci se neukazuje. -->
  <div v-if="show" class="rounded-[16px] border border-[var(--line)] p-4">
    <div class="flex items-start gap-3">
      <img :src="ICON" alt="" class="size-11 shrink-0 rounded-[12px]" />
      <div class="min-w-0 flex-1">
        <div class="text-[15px] font-semibold text-ink-gray-9">{{ __('Přidat CRM na plochu') }}</div>
        <div class="text-[14px] text-ink-gray-6">
          {{ __('Otevře se jako aplikace, bez lišty prohlížeče, rovnou na Dnes.') }}
        </div>
        <ol v-if="isIOS" class="mt-2 list-decimal pl-5 text-[14px] leading-6 text-ink-gray-7">
          <li>{{ __('V Safari klepněte dole na tlačítko Sdílet (čtverec se šipkou).') }}</li>
          <li>{{ __('Vyberte „Přidat na plochu“ a potvrďte „Přidat“.') }}</li>
          <li>{{ __('Otevřete CRM z ikony na ploše a tady zapněte oznámení.') }}</li>
        </ol>
        <div v-else-if="!canPromptInstall" class="mt-2 text-[14px] text-ink-gray-6">
          {{ __('V Chromu: nabídka ⋮ → „Přidat na plochu“ (nebo „Nainstalovat aplikaci“).') }}
        </div>
      </div>
    </div>
    <Button v-if="canPromptInstall" class="mt-3 !h-11 w-full md:w-auto" variant="solid" :label="__('Přidat na plochu')" @click="promptInstall" />
  </div>
</template>
<script setup>
import { canPromptInstall, isIOS, isStandalone, promptInstall } from '@/composables/glPwa'
import { computed } from 'vue'

const show = computed(() => !isStandalone.value)
// za běhu z /assets (Vite by statickou cestu zkoušel přibalit)
const ICON = '/assets/crm/manifest/icon-192.png'
</script>
