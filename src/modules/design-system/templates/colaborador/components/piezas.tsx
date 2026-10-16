import { HugeiconsIcon } from '@hugeicons/react'
import { StarIcon } from '@hugeicons/core-free-icons'
import { Text } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import type { TarjetaContenidoProps } from '@/shared/components/TarjetaContenido'

import { BASE, ICONO_ESTADO, estadoDe, type Contenido, type EstadoPagina } from './data'

// Piezas compartidas por las pantallas del template. Solo combinan componentes de flux-ui.

// Encabezado de pantalla: es el mismo de los templates del administrador (admin-compartido/piezas.tsx), la cabecera
// de página del marco (`PageHeader`). Antes había aquí una copia recortada, sin volver ni etiqueta de estado.
export { EncabezadoPantalla } from '../../admin-compartido/piezas'

export function Valoracion({ valor }: { valor: number }) {
  return (
    <Text as="span" size="xs" weight="medium" className="flex items-center gap-1">
      <HugeiconsIcon icon={StarIcon} size={14} aria-hidden="true" />
      {valor.toLocaleString('es-CO', { minimumFractionDigits: 1 })}
    </Text>
  )
}

// La tarjeta de contenido del catálogo, el inicio y Zona de estudio es la compartida (TarjetaContenido de
// @/shared/components, la de David): decisión 17 de la auditoría. Aquí ya no hay una copia propia; solo se le pasan los
// datos de un contenido del template —avance y estado («En progreso» / «Completado») y la valoración arriba a la
// derecha, en su hueco de acciones— y toda la tarjeta abre la ficha.
export function datosDeTarjeta(
  contenido: Contenido,
  { conAvance = true, onAbrir }: { conAvance?: boolean; onAbrir: (ruta: string) => void },
): TarjetaContenidoProps {
  const estado = estadoDe(contenido)
  return {
    titulo: contenido.titulo,
    imagen: contenido.imagen,
    tipo: contenido.tipo,
    proveedor: contenido.proveedor,
    nivel: contenido.nivel,
    duracion: contenido.duracion,
    idioma: contenido.idioma,
    progreso: conAvance && estado === 'En progreso' ? contenido.avance : undefined,
    estado: !conAvance ? undefined : estado === 'Completado' ? 'completado' : estado === 'En progreso' ? 'en-progreso' : undefined,
    acciones: <Valoracion valor={contenido.valoracion} />,
    onClick: () => onAbrir(`${BASE}/contenido/${contenido.id}`),
    className: 'h-full',
  }
}

// HU experiencia de estudio, RN-06: el icono de estado de cada página lleva tooltip Visto,
// Pendiente o Bloqueado.
export function IconoEstado({ estado }: { estado: EstadoPagina }) {
  return (
    <Hint label={estado} side="top">
      <span tabIndex={0} aria-label={estado} className="inline-flex">
        <HugeiconsIcon icon={ICONO_ESTADO[estado]} size={16} aria-hidden="true" />
      </span>
    </Hint>
  )
}
