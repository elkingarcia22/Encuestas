import { HugeiconsIcon } from '@hugeicons/react'
import { IconTile } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Orb } from '@/shared/components/Orb'
import { plural } from '@/modules/design-system/patrones/formato'
import type { Agente, EstadoAgente } from '../creditos'

// Piezas que comparten las tres exploraciones de créditos: la cara de cada agente y cómo está.

// La cara de un agente: su icono en la baldosa suave. Serena AI es la entrevistadora con IA: su cara es el orbe (nunca
// estrellas ni chispas, regla de IA del 23 sep).
export function IconoAgente({ agente, size = 'default' }: { agente: Agente; size?: 'sm' | 'default' | 'lg' }) {
  return (
    <IconTile variant="soft" size={size} className="shrink-0">
      {agente.id === 'serena' ? (
        <Orb className={size === 'lg' ? 'size-6' : size === 'sm' ? 'size-4' : 'size-5'} />
      ) : (
        <HugeiconsIcon icon={agente.icono} aria-hidden="true" />
      )}
    </IconTile>
  )
}

// Cómo está un agente, en una insignia que se lee sola: «Sin cupo», «Se agota en 3 días», «Alcanza para 20 días».
export function InsigniaSituacion({ estado }: { estado: EstadoAgente }) {
  const { situacion, diasRestantes, asignado } = estado
  if (situacion === 'gratis') return <Badge variant="success-light">Gratis</Badge>
  if (situacion === 'sin-cupo')
    return (
      <Badge variant="destructive-outline">
        {asignado ? 'Sin cupo' : 'Sin créditos'}
      </Badge>
    )
  if (situacion === 'pronto')
    return (
      <Badge variant="warning-light">
        {diasRestantes === 0 ? 'Se agota hoy' : diasRestantes === 1 ? 'Se agota mañana' : `Se agota en ${diasRestantes} días`}
      </Badge>
    )
  if (situacion === 'al-dia' && diasRestantes !== null)
    return (
      <Badge variant="outline">
        Alcanza para {plural(diasRestantes, '1 día', `${diasRestantes} días`)}
      </Badge>
    )
  return (
    <Badge variant="outline">
      Sin uso reciente
    </Badge>
  )
}
