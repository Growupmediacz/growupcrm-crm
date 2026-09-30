// GrowUp: Firma. Po zadání IČO (nebo kliknutí na „Načíst z ARES“) se rovnou vyplní název, adresa, kraj a právní forma.
export class CRMOrganization {
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
      const d = await this.call('growupcrm.ares.lookup', { ico: digits })
      if (d.existing_organization && d.existing_organization !== this.doc.name) {
        this.toast.error(
          __('Firma s tímto IČO už existuje: {0}.', [d.existing_organization]),
        )
        return
      }
      this.doc.ico = d.ico
      this.doc.organization_name = d.organization_name
      this.doc.street = d.street
      this.doc.city = d.city
      this.doc.zip_code = d.zip_code
      this.doc.dic = d.dic
      this.doc.legal_form = d.legal_form
      if (d.territory) this.doc.territory = d.territory
      this.toast.success(
        __('Načteno z ARES: {0}, {1}', [d.organization_name, d.address || '']),
      )
    } catch (e) {
      this.toast.error(e.messages?.[0] || e.message)
    }
  }
}
