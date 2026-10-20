// GrowUp: nový zápis má předepsanou strukturu Cíl → Průběh → Závěr a další kroky
export const NOTE_TEMPLATE =
  '<p><strong>Cíl:</strong> </p><p></p><p><strong>Průběh:</strong> </p><p></p><p><strong>Závěr a další kroky:</strong> </p><p></p>'

export class FCRMNote {
  onRender() {
    if (!this.doc.creation && !this.doc.content) this.doc.content = NOTE_TEMPLATE

    if (this.doc.reference_doctype && this.doc.reference_docname) {
      // GrowUp: česky a i pro záznam u Firmy (dřív vedl na Zakázku → „Dokument nenalezen“)
      const target = {
        'CRM Lead': { label: __('Otevřít zakázku'), name: 'Lead', param: 'leadId' },
        'CRM Deal': { label: __('Otevřít obchod'), name: 'Deal', param: 'dealId' },
        'CRM Organization': { label: __('Otevřít firmu'), name: 'Organization', param: 'organizationId' },
      }[this.doc.reference_doctype]
      if (!target) return
      this.actions = [
        {
          name: 'Redirect Action',
          label: target.label,
          onClick: (close) => {
            if (!this.doc.reference_docname) return
            this.router.push({ name: target.name, params: { [target.param]: this.doc.reference_docname } })
            close?.()
          },
        },
      ]
    }
  }
}
