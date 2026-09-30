// GrowUp: Zakázka s Firmou.
// - IČO (nebo tlačítko „Načíst z ARES“): firma se hned načte z ARES, založí (nebo najde) a zobrazí ve formuláři.
// - Zakázka zakládaná přímo z Firmy má firmu pevně danou a nevyplňuje se znovu.
// - Pobočky se nabízejí jen z vybrané firmy. Ukládání a práva hlídá server (growupcrm.firmy, growupcrm.ares).
export class CRMLead {
  onLoad() {
    this.applyFirmaMode()
  }

  onRender() {
    this.applyFirmaMode()
    this.filterBranches()
    // proklik na Firmu (přehled zakázek, kontaktů, poboček a aktivity)
    if (this.doc.organization_link && !this.doc.__newDocument) {
      this.actions = [
        {
          name: 'Open Firma',
          label: __('Otevřít firmu'),
          onClick: () =>
            this.router.push({
              name: 'Organization',
              params: { organizationId: this.doc.organization_link },
            }),
        },
      ]
    }
  }

  // Nová zakázka otevřená z Firmy: firma je dána, schováme IČO, ARES, web a obor.
  applyFirmaMode() {
    if (!this.doc.__newDocument || !this.doc.organization_link) return
    this.setFieldProperties('ico', { hidden: true })
    this.setFieldProperties('ares_load', { hidden: true })
    this.setFieldProperties('website', { hidden: true })
    this.setFieldProperties('industry', { hidden: true })
    this.setFieldProperties('organization_link', { read_only: true })
  }

  filterBranches() {
    const org = this.doc.organization_link
    // bez firmy žádné pobočky nenabízíme (filtr na neexistující firmu)
    this.setFieldProperty(
      'branch',
      'link_filters',
      JSON.stringify({ organization: org || '__žádná__' }),
    )
  }

  async organization_link() {
    this.filterBranches()
    if (this.doc.branch) this.doc.branch = ''
  }

  async ico() {
    await this.loadFromAres(this.value)
  }

  async ares_load() {
    await this.loadFromAres(this.doc.ico)
  }

  async loadFromAres(value) {
    const digits = (value || '').replace(/\D/g, '')
    if (digits.length < 7) {
      this.toast.error(__('Zadejte IČO (8 číslic).'))
      return
    }
    try {
      const d = await this.call('growupcrm.ares.import_organization', {
        ico: digits,
      })
      this.doc.ico = digits
      this.doc.organization_link = d.name
      if (d.territory) this.doc.territory = d.territory
      this.filterBranches()
      this.toast.success(
        d.created
          ? __('Firma {0} byla načtena z ARES a založena.', [d.organization_name])
          : __('Firma {0} už v databázi je, zakázka se k ní připojí.', [d.name]),
      )
    } catch (e) {
      this.toast.error(e.messages?.[0] || e.message)
    }
  }
}
