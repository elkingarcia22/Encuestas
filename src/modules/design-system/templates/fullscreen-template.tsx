import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Template a pantalla completa por encima del layout de documentación (que trae su propio sidebar fijo).
// Se pinta fuera de #root y deja ese layout inerte mientras está abierto: si no, Tab y el lector de
// pantalla recorrían primero el sidebar y el header tapados, con el foco escondido detrás del template.
export function FullscreenTemplate({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    root.inert = true
    return () => {
      root.inert = false
    }
  }, [])

  return createPortal(<div className="fixed inset-0 z-50 bg-background">{children}</div>, document.body)
}
