import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@ubits/flux-ui'
import { FONDO_PANTALLA_COMPLETA, MARCO_PANTALLA_COMPLETA } from '../marco/pantalla-completa'

// Template a pantalla completa por encima del layout de documentación (que trae su propio sidebar fijo).
// Se pinta fuera de #root y deja ese layout inerte mientras está abierto: si no, Tab y el lector de
// pantalla recorrían primero el sidebar y el header tapados, con el foco escondido detrás del template.
// Con `margen` es la plantilla de pantalla completa del producto (regla «pantalla-completa», 13-oct): 16 px de margen,
// esquinas y sombra de panel sobre el fondo oscurecido. Sin él ocupa toda la ventana, como las plantillas del design system.
export function FullscreenTemplate({ children, margen = false }: { children: ReactNode; margen?: boolean }) {
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    root.inert = true
    return () => {
      root.inert = false
    }
  }, [])

  return createPortal(
    margen ? (
      <>
        <div aria-hidden="true" className={cn(FONDO_PANTALLA_COMPLETA, 'z-50')} />
        <div className={cn(MARCO_PANTALLA_COMPLETA, 'z-50')}>{children}</div>
      </>
    ) : (
      <div className="fixed inset-0 z-50 bg-background">{children}</div>
    ),
    document.body,
  )
}
