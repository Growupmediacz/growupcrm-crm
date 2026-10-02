// Posuvná pilulka pod vybranou záložkou (čipy aktivity): měří vybraný čip a nastaví proměnné pro CSS (.gl-pill-on).
function place(list) {
  const sel = list.querySelector('[role="tab"][aria-selected="true"]')
  if (!sel) return list.classList.remove('gl-pill-on')
  const lr = list.getBoundingClientRect()
  const sr = sel.getBoundingClientRect()
  if (!sr.width) return
  list.style.setProperty('--pill-x', `${sr.left - lr.left + list.scrollLeft}px`)
  list.style.setProperty('--pill-y', `${sr.top - lr.top}px`)
  list.style.setProperty('--pill-w', `${sr.width}px`)
  list.style.setProperty('--pill-h', `${sr.height}px`)
  list.classList.add('gl-pill-on')
}

export function initTabPill() {
  let queued = false
  const run = () => {
    queued = false
    document.querySelectorAll('.gl-chiptabs [role="tablist"]').forEach(place)
  }
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(run)
  }
  new MutationObserver(schedule).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-selected'],
  })
  window.addEventListener('resize', schedule)
}
