// GrowUp: Zakázka s Firmou. Po zadání IČO se firma načte z ARES (náhled, server ji založí při uložení),
// pobočky se nabízejí jen z vybrané firmy. Logika ukládání je na serveru (growupcrm.firmy, growupcrm.ares).
export class CRMLead {
  onRender() {
    this.filterBranches()
    // proklik na Firmu (přehled zakázek, kontaktů, poboček a aktivity)
    if (this.doc.organization_link) {
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
    const digits = (this.value || '').replace(/\D/g, '')
    if (digits.length < 7) return
    try {
      const d = await this.call('growupcrm.ares.lookup', { ico: digits })
      this.doc.ico = d.ico
      if (d.territory) this.doc.territory = d.territory
      if (d.existing_organization) {
        this.doc.organization_link = d.existing_organization
        this.filterBranches()
        this.toast.success(
          __('Firma {0} už v databázi je, zakázka se k ní připojí.', [d.existing_organization]),
        )
      } else {
        this.doc.organization_link = ''
        this.filterBranches()
        this.doc.organization = d.organization_name
        this.toast.success(
          __('ARES: {0}, {1}. Firma se založí při uložení zakázky.', [
            d.organization_name,
            d.address || d.city || '',
          ]),
        )
      }
    } catch (e) {
      this.toast.error(e.messages?.[0] || e.message)
    }
  }
}
