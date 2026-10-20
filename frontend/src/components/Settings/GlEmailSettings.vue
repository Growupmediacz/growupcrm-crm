<template>
  <!-- GrowUp: jedna stránka E-mail místo tří (Můj e-mail, Schránka Outreach, Účty CRM) -->
  <div class="flex h-full flex-col gap-8 overflow-y-auto p-6 text-ink-gray-8">
    <div>
      <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('E-mail') }}</h2>
      <p class="mt-1 text-p-base text-ink-gray-6">{{ __('Všechny schránky, ze kterých CRM posílá a přijímá e-maily, na jednom místě.') }}</p>
    </div>

    <section class="flex flex-col gap-3">
      <div>
        <h3 class="text-[16px] font-bold text-ink-gray-9">{{ __('Můj e-mail') }}</h3>
        <p class="mt-0.5 text-[13px] text-ink-gray-6">
          {{ __('Váš Google účet. E-maily ze zakázek odejdou z vaší adresy a odpovědi klientů se samy objeví u zakázky.') }}
        </p>
      </div>
      <GlMyMailbox embedded />
    </section>

    <section v-if="outreachEnabled" class="flex flex-col gap-3">
      <div>
        <h3 class="text-[16px] font-bold text-ink-gray-9">{{ __('Schránka pro Outreach') }}</h3>
        <p class="mt-0.5 text-[13px] text-ink-gray-6">{{ __('Z této adresy odcházejí oslovení z Outreach, odpovědi chodí zpět do CRM.') }}</p>
      </div>
      <AgencySettings kind="mailbox" embedded />
    </section>

    <!-- Firemní účty (Email Account) – vlastní hlavička a kroky přidání/úpravy z CRM -->
    <section v-if="isManager()" class="gl-card !rounded-[20px] p-5 [&>div]:!p-0">
      <EmailConfig />
    </section>
  </div>
</template>

<script setup>
import AgencySettings from '@/components/Settings/AgencySettings.vue'
import EmailConfig from '@/components/Settings/EmailConfig.vue'
import GlMyMailbox from '@/components/Settings/GlMyMailbox.vue'
import { outreachEnabled } from '@/composables/agency'
import { usersStore } from '@/stores/users'

const { isManager } = usersStore()
</script>
