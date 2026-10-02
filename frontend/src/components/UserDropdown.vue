<template>
  <Dropdown :options="dropdownItems" v-bind="$attrs">
    <template #default="{ open }">
      <!-- GrowUp: patička postranního menu (design): avatar, jméno, role -->
      <button
        v-if="footer"
        class="flex h-12 min-w-0 items-center gap-2.5 rounded-2xl px-1.5 text-left transition hover:bg-white/55"
        :class="[isCollapsed ? 'w-auto' : 'w-full', open && 'bg-white/70']"
      >
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[12px] font-bold text-[#2440a6]">
          {{ initials }}
        </span>
        <span v-if="!isCollapsed" class="flex min-w-0 flex-col leading-tight">
          <span class="truncate text-[14px] font-bold text-ink-gray-9">{{ user.full_name }}</span>
          <span class="truncate text-[12px] text-ink-gray-5">{{ roleLabel }}</span>
        </span>
      </button>
      <button
        v-else
        class="flex h-12 items-center rounded-md py-2 duration-300 ease-in-out"
        :class="
          isCollapsed
            ? 'w-auto px-0'
            : open
              ? 'w-full px-2 bg-surface-elevation-3 shadow-sm'
              : 'w-full px-2 hover:bg-surface-gray-2'
        "
      >
        <BrandLogo v-model="brand" class="h-8 max-w-16 flex-shrink-0" />
        <div
          class="flex flex-1 flex-col text-left duration-300 ease-in-out truncate"
          :class="
            isCollapsed
              ? 'ml-0 w-0 overflow-hidden opacity-0'
              : 'ml-2 w-auto opacity-100'
          "
        >
          <div class="text-base-medium leading-none text-ink-gray-9 truncate">
            {{ __(brand.name || 'CRM') }}
          </div>
          <div class="mt-1 text-sm leading-none text-ink-gray-7 truncate">
            {{ user.full_name }}
          </div>
        </div>
        <div
          class="duration-300 ease-in-out"
          :class="
            isCollapsed
              ? 'ml-0 w-0 overflow-hidden opacity-0'
              : 'ml-2 w-auto opacity-100'
          "
        >
          <span
            class="lucide-chevron-down size-4 text-ink-gray-5"
            aria-hidden="true"
          />
        </div>
      </button>
    </template>
  </Dropdown>
</template>

<script setup>
import BrandLogo from '@/components/BrandLogo.vue'
import FrappeCloudIcon from '@/components/Icons/FrappeCloudIcon.vue'
import AppsIcon from '@/components/Icons/AppsIcon.vue'
import { sessionStore } from '@/stores/session'
import { usersStore } from '@/stores/users'
import { getSettings } from '@/stores/settings'
import {
  showSettings,
  activeSettingsPage,
  isMobileView,
} from '@/composables/settings'
import { showAboutModal } from '@/composables/modals'
import { confirmLoginToFrappeCloud } from '@/composables/frappecloud'
import { createResource, Dropdown } from 'frappe-ui'
import { computed, h, markRaw } from 'vue'

const props = defineProps({
  isCollapsed: { type: Boolean, default: false },
  footer: { type: Boolean, default: false },
})

const { settings, brand } = getSettings()
const { logout } = sessionStore()
const { getUser } = usersStore()

const user = computed(() => getUser() || {})
const ROLE_LABELS = {
  'System Manager': __('Správce'),
  'Sales Manager': __('Vedoucí obchodu'),
  'Sales User': __('Obchodník'),
}
const roleLabel = computed(() => ROLE_LABELS[user.value.role] || '')
const initials = computed(() =>
  (user.value.full_name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(''),
)

const apps = createResource({
  url: 'frappe.apps.get_apps',
  cache: 'apps',
  auto: true,
  transform: (data) => [deskApp(), ...crmSiblingApps(data)],
})

// GrowUp: menu profilu v patičce postranního menu (design 2. kolo, oprava 1):
// Nastavení, Nápověda a Odhlásit se jsou tady, ne v seznamu sekcí.
function openSettingsPage(page) {
  activeSettingsPage.value = page || ''
  showSettings.value = true
}
const footerItems = computed(() => [
  {
    group: 'profile',
    hideLabel: true,
    items: [
      { icon: 'user', label: __('Můj profil'), onClick: () => openSettingsPage(__('Profile')) },
      { icon: 'settings', label: __('Nastavení'), onClick: () => openSettingsPage() },
      {
        icon: 'users',
        label: __('Tým a role'),
        onClick: () => openSettingsPage(__('Users')),
        condition: () => ['System Manager', 'Sales Manager'].includes(user.value.role),
      },
    ].filter((i) => !i.condition || i.condition()),
  },
  {
    group: 'session',
    hideLabel: true,
    items: [
      { icon: 'help-circle', label: __('Nápověda a podpora'), onClick: () => (showAboutModal.value = true) },
      { icon: 'log-out', label: __('Odhlásit se'), onClick: () => logout.submit() },
    ],
  },
])

const dropdownItems = computed(() => {
  if (props.footer && !isMobileView.value) return footerItems.value
  if (!settings.value?.dropdown_items) return []

  let items = settings.value.dropdown_items

  let _dropdownItems = [
    {
      group: 'Dropdown Items',
      hideLabel: true,
      items: [],
    },
  ]

  items.forEach((item) => {
    if (item.hidden) return
    if (item.type !== 'Separator') {
      _dropdownItems[_dropdownItems.length - 1].items.push(
        dropdownItemObj(item),
      )
    } else {
      _dropdownItems.push({
        group: '',
        hideLabel: true,
        items: [],
      })
    }
  })

  return _dropdownItems
})

function dropdownItemObj(item) {
  let _item = JSON.parse(JSON.stringify(item))
  let icon = _item.icon || 'external-link'
  if (typeof icon === 'string' && icon.startsWith('<svg')) {
    icon = markRaw(h('div', { innerHTML: icon }))
  }
  _item.icon = icon

  if (_item.is_standard) {
    return getStandardItem(_item)
  }

  return {
    icon: _item.icon,
    label: __(_item.label),
    onClick: () =>
      window.open(_item.route, _item.open_in_new_window ? '_blank' : ''),
  }
}

function getStandardItem(item) {
  switch (item.name1) {
    case 'app_selector':
      return {
        icon: markRaw(AppsIcon),
        label: __(item.label),
        submenu: appMenuItems(),
      }
    case 'settings':
      return {
        icon: item.icon,
        label: __(item.label),
        onClick: () => (showSettings.value = true),
        condition: () => !isMobileView.value,
      }
    case 'login_to_fc':
      return {
        icon: h(FrappeCloudIcon),
        label: __(item.label),
        onClick: () => confirmLoginToFrappeCloud(),
        condition: () => !isMobileView.value && window.is_fc_site,
      }
    case 'about':
      return {
        icon: item.icon,
        label: __(item.label),
        onClick: () => (showAboutModal.value = true),
      }
    case 'logout':
      return {
        icon: item.icon,
        label: __(item.label),
        onClick: () => logout.submit(),
      }
  }
}

function appMenuItems() {
  return (apps.data || []).map((app) => ({
    label: app.title,
    onClick: () => (window.location.href = app.route),
    slots: {
      prefix: () => h('img', { class: 'size-5 rounded', src: app.logo }),
    },
  }))
}

function deskApp() {
  return {
    name: 'frappe',
    logo: '/assets/frappe/images/framework.png',
    title: __('Desk'),
    route: '/desk',
  }
}

function crmSiblingApps(data) {
  return data
    .filter((app) => app.name !== 'crm')
    .map((app) => ({
      name: app.name,
      logo: app.logo,
      title: __(app.title),
      route: app.route,
    }))
}
</script>
