import { createDocumentResource } from 'frappe-ui'
import { reactive, ref } from 'vue'
import { applyAccent } from '@/utils/glAccent'

const settings = ref({})
const brand = reactive({})

const _settings = createDocumentResource({
  doctype: 'FCRM Settings',
  name: 'FCRM Settings',
  onSuccess: (data) => {
    settings.value = data
    getSettings().setupBrand()
    return data
  },
})

export function getSettings() {
  function setupBrand() {
    brand.name = settings.value?.brand_name
    brand.logo = settings.value?.brand_logo
    brand.favicon = settings.value?.favicon
    brand.accent = settings.value?.growupcrm_accent
    applyAccent(brand.accent)
  }

  return {
    _settings,
    settings,
    brand,
    setupBrand,
  }
}
