<template>
  <!-- GrowUp (zadání 2027 E1): bezpečné zobrazení HTML e-mailu.
       iframe se sandboxem bez skriptů (docs/BEZPECNOST.md), HTML vyčištěné na serveru i tady (DOMPurify),
       výška podle obsahu bez stropu (žádný vnořený posuvník), vzdálené obrázky až na požádání. -->
  <div class="gl-mailframe">
    <iframe
      ref="frame"
      :srcdoc="srcdoc"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      :title="title || __('Obsah e-mailu')"
      class="block w-full border-0"
      :style="{ height: height + 'px' }"
      scrolling="no"
      @load="onLoad"
    />
    <button v-if="blocked && !showImages" type="button" class="gl-mail-imgbtn" @click="showImages = true">
      <GlIcon name="eye" :size="16" />{{ __('Zobrazit obrázky ({0})', [blocked]) }}
    </button>
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { sanitizeHTML } from '@/utils'
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  html: { type: String, default: '' },
  title: { type: String, default: '' },
})

const frame = ref(null)
const height = ref(40)
const showImages = ref(false)
let observer = null

function token(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

// vzdálené obrázky (sledovací pixely) se načtou až po kliknutí
const prepared = computed(() => {
  const clean = sanitizeHTML(props.html || '', { FORBID_TAGS: ['form', 'input', 'button', 'textarea', 'select', 'style'], FORBID_ATTR: ['srcset', 'background'], ADD_ATTR: ['target'] })
  const doc = new DOMParser().parseFromString(clean, 'text/html')
  let count = 0
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src') || ''
    let origin = ''
    try {
      origin = new URL(src, location.href).origin
    } catch {
      origin = ''
    }
    if (/^(https?:)?\/\//i.test(src) && origin !== location.origin) {
      count++
      if (!showImages.value) {
        img.setAttribute('data-gl-src', src)
        img.removeAttribute('src')
        img.setAttribute('alt', img.getAttribute('alt') || '')
      }
    }
  })
  return { body: doc.body.innerHTML, count }
})
const blocked = computed(() => prepared.value.count)

const srcdoc = computed(() => {
  const ink = token('--text-1', 'black')
  const link = token('--accent-700', 'blue')
  const line = token('--line', 'silver')
  const muted = token('--text-2', 'gray')
  // dokud uživatel nepovolí obrázky, rámec nenačte nic zvenku (ani přes CSS url())
  const csp = showImages.value ? '' : `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: ${location.origin}; style-src 'unsafe-inline'; font-src data:">`
  return `<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8">${csp}<base target="_blank"><style>
html,body{margin:0;padding:0;background:transparent}
body{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.6;color:${ink};
  overflow-wrap:break-word;word-break:normal;-webkit-text-size-adjust:100%}
.gl-root{max-width:720px;transform-origin:top left}
p{margin:0 0 .9em} p:last-child{margin-bottom:0}
a{color:${link};text-decoration:underline;text-underline-offset:2px;overflow-wrap:anywhere}
img{max-width:100%;height:auto} img[data-gl-src]{display:inline-block;min-width:24px;min-height:24px;background:${line};border-radius:4px}
table{max-width:100%;border-collapse:collapse} td,th{vertical-align:top}
pre,code{white-space:pre-wrap;font-size:14px}
blockquote,.gmail_quote{margin:0 0 0 .4em;padding-left:1em;border-left:3px solid ${line};color:${muted}}
ul,ol{padding-left:1.4em;margin:0 0 .9em}
hr{border:0;border-top:1px solid ${line};margin:1em 0}
</style></head><body><div class="gl-root">${prepared.value.body}</div></body></html>`
})

function measure() {
  const iframe = frame.value
  const doc = iframe?.contentDocument
  if (!doc?.body) return
  const root = doc.querySelector('.gl-root')
  // široký zpravodaj (tabulky 600 px) se na telefonu zmenší, aby nebyl vodorovný posun
  if (root) {
    root.style.zoom = ''
    const avail = iframe.clientWidth
    const need = Math.max(root.scrollWidth, doc.body.scrollWidth)
    if (avail && need > avail + 2) root.style.zoom = String(Math.max(0.5, avail / need))
  }
  height.value = Math.ceil(doc.documentElement.getBoundingClientRect().height) + 2
}

function enforceMinFont(doc) {
  // cizí HTML nesmí zmenšit písmo pod 14 px (DESIGN-ZADANI 1.8)
  doc.querySelectorAll('.gl-root *').forEach((el) => {
    const size = parseFloat(doc.defaultView.getComputedStyle(el).fontSize)
    if (size && size < 14) el.style.fontSize = '14px'
  })
}

function onLoad() {
  const doc = frame.value?.contentDocument
  if (!doc) return
  enforceMinFont(doc)
  measure()
  doc.querySelectorAll('img').forEach((img) => !img.complete && img.addEventListener('load', measure, { once: true }))
  observer?.disconnect()
  observer = new ResizeObserver(() => measure())
  observer.observe(doc.documentElement)
  observer.observe(frame.value)
}

onBeforeUnmount(() => observer?.disconnect())
</script>
<style scoped>
.gl-mail-imgbtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--hit-sm);
  margin-top: 8px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-2);
  background: var(--fill-tinted, rgba(110, 120, 200, 0.075));
}
.gl-mail-imgbtn:hover { color: var(--text-1); }
.gl-mail-imgbtn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>
