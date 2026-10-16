import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FullScreenIcon } from '@hugeicons/core-free-icons'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'

// «Ver en pantalla completa» (9-oct): el botón de solo icono que abre un mapa de calor en la ventana del sistema a
// pantalla completa (ActionDialog «full», sin pie, se cierra con la X). Lo usan Favorabilidad y Riesgo › Mapa, eNPS ›
// Por segmento y el Comparativo › Mapa de calor. Lo que va dentro se pasa como hijo: suele ser el mismo mapa, con más
// sitio para las columnas de grupos. Sus controles (ver por, filtros, personalizar y la leyenda «cómo leer») se pasan en
// `acciones` y van en la misma línea del título de la ventana, junto a la X.

export function BotonPantallaCompleta({ titulo, descripcion, acciones, children }: { titulo: string; descripcion?: string; acciones?: ReactNode; children: ReactNode }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <Hint label="Ver en pantalla completa">
        <BotonIcono aria-label="Ver en pantalla completa" onClick={() => setAbierta(true)}>
          <HugeiconsIcon icon={FullScreenIcon} aria-hidden="true" />
        </BotonIcono>
      </Hint>
      {/* «!» con doble clase ([&&]): ActionDialog fija todas sus ventanas a 120 px del borde de arriba (top-30!) y su tamaño
          «full» intenta bajarlo a 16 px con otra clase igual de fuerte, que pierde por el orden del CSS; la ventana quedaba
          caída y se salía por abajo. La doble clase gana sin tocar src/shared. El arreglo de fondo va en ActionDialog
          (zona protegida, pendiente de permiso). */}
      <ActionDialog open={abierta} onOpenChange={setAbierta} size="full" title={titulo} sub={descripcion} hideFooter className="[&&]:top-4!" headerActions={acciones}>
        {abierta ? children : null}
      </ActionDialog>
    </>
  )
}
