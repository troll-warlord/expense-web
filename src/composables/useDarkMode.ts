import { ref, watch } from 'vue'

// Module-level singleton so all components share the same state
const stored = localStorage.getItem('darkMode')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = ref(stored !== null ? stored === 'true' : prefersDark)

// Apply on initial load
if (isDark.value) document.documentElement.classList.add('dark')

watch(isDark, (val) => {
  document.documentElement.classList.toggle('dark', val)
  localStorage.setItem('darkMode', String(val))
})

export function useDarkMode() {
  function toggle() {
    isDark.value = !isDark.value
  }
  return { isDark, toggle }
}
