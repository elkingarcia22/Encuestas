import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDownRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@ubits/flux-ui'

// El Dashboard es del Archivo: sus piezas se mudaron a Design system › Métricas el 29-sep (las usan el Inicio real y
// Home operativo). Este archivo solo las reenvía para que el Archivo y la copia del concepto de Suite AI no cambien.
export { TarjetaIndicador } from '@/modules/design-system/metricas/cifras'

// La variación salió del sistema de diseño el 5-oct (decisión 11 de la auditoría: «ya no va a existir»). Esta copia es
// solo del Archivo y del concepto congelado de Suite AI, que no se tocan: no la uses en una pantalla.
export function Variacion({ valor, sufijo = ' %', menosEsMejor = false }: { valor: number; sufijo?: string; menosEsMejor?: boolean }) {
  const sube = valor >= 0
  const bueno = menosEsMejor ? !sube : sube
  const texto = `${sube ? '+' : '−'}${Math.abs(valor).toLocaleString('es-CO')}${sufijo}`
  return (
    <Badge variant={bueno ? 'success-light' : 'destructive-outline'} size="sm">
      <HugeiconsIcon icon={sube ? ArrowUpRight01Icon : ArrowDownRight01Icon} aria-hidden="true" />
      {texto}
    </Badge>
  )
}
