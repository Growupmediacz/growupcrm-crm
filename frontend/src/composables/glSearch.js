// GrowUp: otevření hledání ⌘K odkudkoli (levá lišta, mobil). GlSearch sleduje počítadlo a otevře se.
import { ref } from 'vue'

export const glSearchRequest = ref(0)
export function openGlSearch() {
  glSearchRequest.value++
}
