<template>
  <Dialog v-model:open="show" :size="'sm'">
    <template #body>
      <div class="p-4 pt-5">
        <div class="flex justify-center">
          <div class="flex flex-col items-center">
            <CRMLogo class="mb-3 size-12" />
            <h3 class="text-2xl-semibold text-ink-gray-9">GrowUpCRM</h3>
          </div>
        </div>
        <hr class="border-t my-3 mx-2" />
        <div>
          <a
            v-for="link in links"
            :key="link.label"
            class="flex py-2 px-2 hover:bg-surface-gray-1 rounded cursor-pointer"
            target="_blank"
            :href="link.url"
          >
            <component
              :is="link.icon"
              v-if="link.icon"
              class="size-4 mr-2 text-ink-gray-7"
            />
            <span class="text-base text-ink-gray-8">
              {{ link.label }}
            </span>
          </a>
        </div>
        <hr class="border-t my-3 mx-2" />
        <p class="text-sm text-ink-gray-6 px-2 mt-2">
          {{ __('GrowUpCRM je postaveno na open-source CRM Frappe CRM (AGPL-3.0).') }}
          © Frappe Technologies Pvt. Ltd. and contributors
        </p>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import CRMLogo from '@/components/Icons/CRMLogo.vue'
import GitHubIcon from '@/components/Icons/GitHubIcon.vue'
import LucideHeadset from '~icons/lucide/headset'

let show = defineModel({ type: Boolean })

// GrowUp: podpora jde na GrowUpMedia, zdrojový kód je veřejný kvůli AGPL-3.0.
let links = [
  {
    label: __('Kontaktovat podporu'),
    url: 'mailto:dancenko@growupmedia.cz',
    icon: LucideHeadset,
  },
  {
    label: __('Zdrojový kód (AGPL-3.0)'),
    url: 'https://github.com/Growupmediacz/growupcrm-crm',
    icon: GitHubIcon,
  },
]
</script>
