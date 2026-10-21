<template>
  <!-- GrowUp (design 3. kolo): levá plovoucí lišta. Skupiny vedou na naposledy otevřenou stránku skupiny,
       stránky skupiny jsou ve spodní liště (GlTabBar). Panel oznámení se ukotví k tomuto prvku. -->
  <div class="relative flex h-full shrink-0 flex-col items-center gap-6">
    <router-link
      :to="{ name: 'Today' }"
      class="mt-1 flex size-14 items-center justify-center rounded-[18px]"
      :aria-label="brand.name || 'GrowUpCRM'"
    >
      <CRMLogo class="size-12" />
    </router-link>

    <nav class="gl3-rail flex w-[var(--gl-rail-w)] flex-col items-center gap-1 rounded-[var(--r-panel)] px-2 py-3">
      <router-link
        v-for="g in mainGroups"
        :key="g.key"
        :to="groupTarget(g)"
        @click="showSettings = false"
        class="gl3-rail-item"
        :class="!showSettings && isActiveGroup(g) && 'is-active'"
        :aria-current="isActiveGroup(g) ? 'page' : undefined"
      >
        <span class="gl3-rail-icon"><GlIcon :name="g.icon" :size="22" /></span>
        <span class="gl3-rail-label">{{ __(g.label) }}</span>
      </router-link>

      <button class="gl3-rail-item" :class="searchActive && 'is-active'" @click="openGlSearch" :title="__('Hledat (⌘K)')">
        <span class="gl3-rail-icon"><GlIcon name="search" :size="22" /></span>
        <span class="gl3-rail-label">{{ __('Hledat') }}</span>
      </button>

      <template v-for="g in sectionGroups" :key="g.key">
        <router-link
          :to="groupTarget(g)"
          @click="showSettings = false"
          class="gl3-rail-item"
          :class="!showSettings && isActiveGroup(g) && 'is-active'"
          :aria-current="isActiveGroup(g) ? 'page' : undefined"
        >
          <span class="gl3-rail-icon"><GlIcon :name="g.icon" :size="22" /></span>
          <span class="gl3-rail-label">{{ __(g.label) }}</span>
        </router-link>
      </template>

      <button
        id="notifications-btn"
        class="gl3-rail-item"
        :class="notificationsVisible && 'is-active'"
        @click="toggleNotifications"
      >
        <span class="gl3-rail-icon relative">
          <GlIcon name="bell" :size="22" />
          <span
            v-if="unreadNotificationsCount"
            class="absolute right-0.5 top-0.5 size-2.5 rounded-full border-2 border-white bg-[var(--overdue)]"
          />
        </span>
        <span class="gl3-rail-label">{{ __('Oznámení') }}</span>
      </button>

      <button class="gl3-rail-item" :class="showSettings && 'is-active'" @click="showSettings = !showSettings">
        <span class="gl3-rail-icon"><GlIcon name="sliders" :size="22" /></span>
        <span class="gl3-rail-label">{{ __('Nastavení') }}</span>
      </button>
    </nav>

    <Notifications />
    <GlSearch hide-trigger />
  </div>
</template>

<script setup>
import CRMLogo from '@/components/Icons/CRMLogo.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlSearch from '@/components/GlSearch.vue'
import Notifications from '@/components/Notifications.vue'
import { useGlNav } from '@/composables/glNav'
import { openGlSearch } from '@/composables/glSearch'
import { showSettings } from '@/composables/settings'
import { getSettings } from '@/stores/settings'
import { notificationsStore, unreadNotificationsCount, visible as notificationsVisible } from '@/stores/notifications'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { brand } = getSettings()
const { groups, activeGroup, groupTarget, remember } = useGlNav()
const { toggle: toggleNotifications } = notificationsStore()

// pořadí jako v návrhu: Dnes, Hledat, Prodej, Práce, Dodání
const mainGroups = computed(() => groups.value.filter((g) => g.key === 'today'))
const sectionGroups = computed(() => groups.value.filter((g) => g.key !== 'today'))
const isActiveGroup = (g) => activeGroup.value?.key === g.key
const searchActive = ref(false)

watch(() => route.name, remember, { immediate: true })
</script>
