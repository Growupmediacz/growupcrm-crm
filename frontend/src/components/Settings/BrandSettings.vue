<template>
  <div class="flex h-full flex-col gap-6 px-6 py-8 text-ink-gray-8">
    <!-- Header -->
    <div class="flex justify-between px-2 text-ink-gray-8">
      <div class="flex flex-col gap-1">
        <h2 class="flex gap-2 text-2xl-semibold leading-none h-5">
          {{ __('Brand Settings') }}
        </h2>
        <p class="text-p-base text-ink-gray-6">
          {{ __('Configure your brand name, logo and favicon') }}
        </p>
      </div>
      <div class="flex item-center space-x-2 w-3/12 justify-end">
        <Button
          v-if="settings.isDirty"
          :label="__('Update')"
          variant="solid"
          :loading="settings.loading"
          @click="updateSettings"
        />
      </div>
    </div>

    <!-- Fields -->
    <div class="flex flex-1 flex-col p-2 gap-4 overflow-y-auto">
      <!-- Brand Anm -->
      <div class="flex items-center justify-between gap-8">
        <div class="flex flex-col">
          <div class="text-p-base-medium text-ink-gray-7 truncate">
            {{ __('Brand Name') }}
          </div>
          <div class="text-p-sm text-ink-gray-5">
            {{ __('Set the name of your brand. Appears in the left sidebar.') }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <FormControl
            v-model="settings.doc.brand_name"
            type="text"
            size="md"
            :placeholder="__('Enter Brand Name')"
          />
        </div>
      </div>
      <div class="h-px border-t border-outline-elevation-2" />

      <!-- logo -->
      <div class="flex flex-col justify-between gap-4">
        <div class="flex items-center flex-1 gap-5">
          <div
            class="flex items-center justify-center rounded border border-outline-elevation-2 size-20"
          >
            <img
              v-if="settings.doc?.brand_logo"
              :src="settings.doc?.brand_logo"
              alt="Logo"
              class="size-8 rounded"
            />
            <ImageIcon v-else class="size-5 text-ink-gray-4" />
          </div>
          <div class="flex flex-1 flex-col gap-1">
            <span class="text-base-medium">{{ __('Brand Logo') }}</span>
            <span class="text-p-base text-ink-gray-6">
              {{
                __(
                  'Appears in the left sidebar. Recommended size is 32x32 px in PNG or SVG',
                )
              }}
            </span>
          </div>
          <div>
            <ImageUploader
              image_type="image/ico"
              :image_url="settings.doc?.brand_logo"
              @upload="(url) => (settings.doc.brand_logo = url)"
              @remove="() => (settings.doc.brand_logo = '')"
            />
          </div>
        </div>
      </div>

      <!-- barva akcentu a náhled (design 3. kolo, 34) -->
      <div class="flex flex-col gap-4 rounded-[18px] border border-[var(--line)] p-5 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-base-medium">{{ __('Barva akcentu') }}</span>
            <span class="text-p-base text-ink-gray-6">{{ __('Tlačítka, vybrané položky a grafy v celém CRM.') }}</span>
          </div>
          <div class="flex gap-3">
            <button
              v-for="c in ACCENTS"
              :key="c"
              type="button"
              class="size-9 rounded-full transition"
              :class="(settings.doc.growupcrm_accent || DEFAULT_ACCENT).toLowerCase() === c.toLowerCase() ? 'ring-[3px] ring-offset-2 ring-[var(--text-1)]' : 'hover:scale-110'"
              :style="{ background: c }"
              :aria-label="c"
              @click="pickAccent(c)"
            />
          </div>
        </div>
        <!-- náhled: dlaždice, tlačítko a vybraná položka v nové barvě -->
        <div class="flex w-full max-w-[300px] flex-col gap-3 rounded-[18px] bg-[#f4f6fb] p-4" :style="{ '--accent-600': preview }">
          <div class="rounded-[14px] bg-white p-3 shadow-[0_6px_18px_-10px_rgba(40,50,120,.3)]">
            <div class="text-[12px] text-ink-gray-5">{{ __('Plnění plánu') }}</div>
            <div class="text-[22px] font-bold text-ink-gray-9">18 / 25</div>
            <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><div class="h-full w-[72%] rounded-full" :style="{ background: preview }" /></div>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold text-white" :style="{ background: preview }">+ {{ __('Nová zakázka') }}</span>
            <span class="inline-flex h-9 items-center rounded-full bg-white px-3 text-[13px] font-semibold" :style="{ color: preview }">{{ __('Kanban') }}</span>
          </div>
        </div>
      </div>

      <!-- favicon -->
      <div class="flex flex-col justify-between gap-4">
        <div class="flex items-center flex-1 gap-5">
          <div
            class="flex items-center justify-center rounded border border-outline-elevation-2 size-20"
          >
            <img
              v-if="settings.doc?.favicon"
              :src="settings.doc?.favicon"
              alt="Favicon"
              class="size-8 rounded"
            />
            <ImageIcon v-else class="size-5 text-ink-gray-4" />
          </div>
          <div class="flex flex-1 flex-col gap-1">
            <span class="text-base-medium">{{ __('Favicon') }}</span>
            <span class="text-p-base text-ink-gray-6">
              {{
                __(
                  'Appears next to the title in your browser tab. Recommended size is 32x32 px in PNG or ICO',
                )
              }}
            </span>
          </div>
          <div>
            <ImageUploader
              image_type="image/ico"
              :image_url="settings.doc?.favicon"
              @upload="(url) => (settings.doc.favicon = url)"
              @remove="() => (settings.doc.favicon = '')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import ImageIcon from '~icons/lucide/image'
import ImageUploader from '@/components/Controls/ImageUploader.vue'
import { FormControl } from 'frappe-ui'
import { getSettings } from '@/stores/settings'
import { ACCENTS, DEFAULT_ACCENT, applyAccent } from '@/utils/glAccent'
import { computed, onBeforeUnmount } from 'vue'

const { _settings: settings, setupBrand } = getSettings()

const preview = computed(() => settings.doc?.growupcrm_accent || DEFAULT_ACCENT)
// vybraná barva se hned ukáže v celém CRM, uloží se tlačítkem Uložit
function pickAccent(c) {
  settings.doc.growupcrm_accent = c
  applyAccent(c)
}

// neuložená změna barvy se po odchodu ze Značky vrátí
onBeforeUnmount(() => applyAccent(settings.originalDoc?.growupcrm_accent))

function updateSettings() {
  settings.save.submit(null, {
    onSuccess: () => setupBrand(),
  })
}
</script>
