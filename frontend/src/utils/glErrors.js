// GrowUp: rozlišení chyby oprávnění („Sem nemáte přístup“) od chyby načtení (pruh „Zkusit znovu“)
export const isForbidden = (e) =>
  /Permission|oprávnění|přístup|nejsou na tomto CRM zapnuté|Pouze/i.test(`${e?.exc_type || ''} ${e?.messages?.[0] || ''} ${e?.message || ''}`)
