import { Button } from '@ubits/flux-ui'
import { usePanelActual } from './panel-actual'

// El «Cancelar» de un panel con `conCambios` (13-oct, auditoría: I-009, I-041, I-087): pasa por la misma pregunta que la X
// y Escape («Seguir editando · Descartar») en vez de cerrar directo. Sin cambios cierra igual que ellas. Fuera de un
// DrawerShell (no hay panel) usa `alCerrar`.
export function BotonCancelarPanel({
  texto = 'Cancelar',
  alCerrar,
  className,
  disabled,
}: {
  texto?: string
  alCerrar?: () => void
  className?: string
  disabled?: boolean
}) {
  const panel = usePanelActual()
  return (
    <Button variant="outline" className={className} disabled={disabled} onClick={() => (panel ? panel.cerrarPanel() : alCerrar?.())}>
      {texto}
    </Button>
  )
}

// ¿Lo elegido es lo mismo que había al abrir? (sin mirar el orden). Para pasar `conCambios` en paneles de selección.
export const mismaSeleccion = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x))
