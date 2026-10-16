import { NavigationType, UNSAFE_LocationContext } from 'react-router'
import { AccountPopover } from '@/shared/components/AccountPopover'

// La tarjeta de la empresa de la barra de muestra, la real (AccountPopover) y como se ve en el producto. Dentro del
// design system esa pieza cambia a la marca BOLD+; aquí se le hace creer que está en la página de ejemplo del caso
// (`ruta`), así muestra «Meta Colombia · Plan Pro» y abre su menú de verdad (auditoría, 5 oct). Es el mismo truco de
// «Probar en pantalla» (components/anatomy/pantalla-real.tsx): solo cambia la ruta que lee la pieza; los enlaces de su
// menú siguen navegando de verdad. `compact` es la baldosa del riel, que abre el mismo menú a su derecha.
export function CuentaDeMuestra({ ruta, compact = false }: { ruta: string; compact?: boolean }) {
  const ubicacion = { pathname: ruta, search: '', hash: '', state: null, key: 'barra-de-muestra' }
  return (
    <UNSAFE_LocationContext.Provider value={{ location: ubicacion, navigationType: NavigationType.Pop }}>
      <AccountPopover compact={compact} />
    </UNSAFE_LocationContext.Provider>
  )
}
