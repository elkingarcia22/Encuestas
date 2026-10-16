import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AspectRatio, Button, Text, cn } from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// La celda que nombra algo en una fila de la tabla del sistema (TablaDatos): el título y, debajo, una línea gris con el
// dato que lo ubica (Vacante + Área, Persona + Cargo). Es la fila de Vacantes (Selección), que Cristian eligió el 5-oct
// como la buena, y **es la misma cuando hay imagen**: la miniatura a la izquierda, en 16:9 y 64 px de ancho como las
// portadas de Avisos, y el título con su línea gris al lado. Así las listas de contenidos con portada (Universidad
// corporativa, Zona de estudio, Contenidos) son tablas y no una cuadrícula de tarjetas aparte.
//
// El título abre el detalle cuando hay `to` (un enlace) u `onClick`; si no, es texto.
export function CeldaTitulo({
  titulo,
  detalle,
  imagen,
  sinImagen,
  to,
  onClick,
  dosLineas = false,
}: {
  titulo: string
  // El título a dos renglones en vez de recortado a uno: para columnas angostas (un panel lateral), donde el nombre
  // entero es lo que se compara (Dave, 6-oct, panel «Agregar contenidos» de la ruta).
  dosLineas?: boolean
  detalle?: ReactNode
  // La portada. Sin imagen pero con `sinImagen` (un icono), la miniatura muestra ese icono sobre gris.
  imagen?: string
  sinImagen?: ReactNode
  to?: string
  onClick?: () => void
}) {
  const conMiniatura = imagen !== undefined || sinImagen !== undefined
  const corte = dosLineas ? 'line-clamp-2 whitespace-normal' : 'truncate'
  const nombre =
    to || onClick ? (
      <Button
        variant="link"
        size="sm"
        nativeButton={!to}
        render={to ? <Link to={to} /> : undefined}
        onClick={onClick}
        className={cn('h-auto! max-w-full justify-start p-0! text-sm!', dosLineas && 'text-left! whitespace-normal!')}
      >
        <TextoCompleto texto={titulo}><span className={corte}>{titulo}</span></TextoCompleto>
      </Button>
    ) : (
      <TextoCompleto texto={titulo}><Text as="span" size="sm" weight="medium" className={corte}>
        {titulo}
      </Text></TextoCompleto>
    )

  // `w-0 min-w-full`: la celda ocupa el ancho de su columna sin empujarla; así un nombre largo se corta con «…» (y el
  // tooltip lo dice entero) en vez de ensanchar la tabla y sacar de la vista el «⋯» de la fila.
  return (
    <div className="flex w-0 min-w-full items-center gap-3">
      {conMiniatura ? (
        <div className="w-16 shrink-0">
          <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md bg-muted">
            {imagen ? (
              <img src={imagen} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">{sinImagen}</div>
            )}
          </AspectRatio>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col gap-0.5">
        {nombre}
        {detalle ? (
          <Text as="span" variant="muted" size="xs" className="truncate">
            {detalle}
          </Text>
        ) : null}
      </div>
    </div>
  )
}
