// GrowUp (zadání 2027 E1): rozhraní pro návrhy agenta pod vláknem.
// Skutečné návrhy dodá tým agenta (D/F) funkcemi proposals.for_thread / proposals.decide; do té doby
// se ukázkový návrh zobrazí jen s ?agent=ukazka v adrese (nikdy samovolně).
//
// Tvar návrhu (dohoda s týmem agenta):
// {
//   id, kind: 'reply', level: 'ke schválení' | 'vždy člověk',
//   happened: 'co se stalo (jedna věta)',
//   reason: 'důvod v jedné větě', why: ['2–4 odrážky: z čeho agent vyšel, co udělá po schválení'],
//   to: ['adresa'], subject, html,        // text návrhu; místa k doplnění jako „DOPLNIT CENU“
//   created_at,
// }
// Rozhodnutí: decide(id, 'approved' | 'edited' | 'rejected', final_html)
import { call } from 'frappe-ui'

export function demoEnabled() {
  return new URLSearchParams(location.search).get('agent') === 'ukazka'
}

export async function proposalForThread(reference, thread) {
  // TODO(tým agenta): až bude growupcrm.proposals.for_thread, vrátit jeho výsledek místo ukázky.
  if (!demoEnabled() || !thread || thread.state !== 'us') return null
  const last = [...(thread.messages || [])].reverse().find((m) => m.sent_or_received === 'Received' && !m.automated)
  if (!last) return null
  const surname = (last.sender_name || '').split(' ').slice(-1)[0]
  return {
    id: 'ukazka-' + thread.id,
    kind: 'reply',
    level: 'ke schválení',
    demo: true,
    happened: __('Zájemce odpověděl na ukázku webu'),
    reason: __('Ptá se na formulář, fotky, cenu a termín; chce hovor ve čtvrtek dopoledne.'),
    why: [
      __('Typ odpovědi: Zájem (z pravidel třídění).'),
      __('Cenu agent nepíše, to je vždy na vás. V textu je místo k doplnění.'),
      __('Po odeslání založí úkol „Zavolat“ na čtvrtek 9:30.'),
    ],
    to: [last.sender],
    subject: 'Re: ' + (thread.subject || ''),
    html: `<p>${__('Dobrý den, pane {0},', [surname || ''])}</p><p>${__('děkuji, to mě těší. Formulář s výběrem tam bude, je to běžná součást webu. Fotky z mobilu nevadí, vybereme ty nejlepší a upravíme je.')}</p><p>${__('Cena celého webu vychází na DOPLNIT CENU, hotovo bývá do čtyř týdnů od dodání podkladů. Zavolám vám ve čtvrtek v 9:30.')}</p><p>${__('S pozdravem')}</p>`,
    created_at: new Date().toISOString(),
  }
}

export async function decideProposal(proposal, result, finalHtml = '') {
  if (proposal.demo) return
  try {
    await call('growupcrm.proposals.decide', { name: proposal.id, result, final_html: finalHtml })
  } catch {
    /* funkce zatím není */
  }
}
