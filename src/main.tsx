import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@ubits/flux-ui'
import { App } from '@/app/App'
import './index.css'
import '@/shared/styles/global.css'

// Cada publicación nueva borra los archivos de la anterior. Una pestaña abierta desde antes pide, al navegar, una pantalla
// que ya no existe y se rompía con un error. Si eso pasa se recarga una sola vez (guardado un minuto para no entrar en bucle):
// queda en la página donde estaba, ya con la versión nueva, y el siguiente clic navega normal.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'playground:reloaded-for-new-version'
  try {
    const last = Number(window.sessionStorage.getItem(key) ?? 0)
    if (Date.now() - last < 60_000) return
    window.sessionStorage.setItem(key, String(Date.now()))
  } catch {
    // Sin almacenamiento igual se intenta la recarga.
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="ubits" defaultMode="light" storageKey="ubits-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
