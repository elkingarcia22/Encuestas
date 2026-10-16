import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@ubits/flux-ui'

// «Primera vez»: la lista está vacía porque todavía nadie creó nada, no porque un filtro lo dejara fuera. Es uno de los
// cuatro estados vacíos del design system (Estados › Estados vacíos) y va con la misma anatomía: icono en recuadro,
// título, una línea de qué va a aparecer aquí y la acción que lo empieza.
//
// No confundir con [SinResultados]: ahí hay datos y la salida es aflojar el filtro; aquí no hay nada y la salida es
// crear —o, del lado del colaborador, ir a buscar—.

export function PrimeraVez({
  icono,
  titulo,
  descripcion,
  accion,
  className,
}: {
  /** Nombre del icono glass del design system, p. ej. «glass-add». */
  icono: string
  /** Qué falta, en positivo: «Todavía no hay contenidos». */
  titulo: string
  /** Qué va a aparecer aquí cuando lo haya. */
  descripcion: string
  /** Lo que empieza la historia. Sin acción cuando la pantalla no ofrece ninguna salida. */
  accion?: { texto: string; icono?: IconSvgElement; onClick: () => void }
  className?: string
}) {
  return (
    <Empty className={className ?? 'py-14'}>
      <EmptyHeader>
        {/* Icono glass: en un estado vacío hay sitio para una ilustración y se lee más amable que un símbolo. */}
        <EmptyMedia variant="default">
          <ImagenGlass nombre={icono} />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{descripcion}</EmptyDescription>
      </EmptyHeader>
      {accion ? (
        <EmptyContent>
          <Button onClick={accion.onClick}>
            {accion.icono ? <HugeiconsIcon icon={accion.icono} strokeWidth={2} aria-hidden="true" /> : null}
            {accion.texto}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}

/**
 * ¿La dirección pide ver el estado vacío? Se enseña con `?demo=vacio` —la convención que ya usaban Progreso
 * (`sin-planes`) y Eventos (`sin-eventos`), que siguen valiendo—. En Zona de estudio se combina con la pestaña:
 * `…/zona-de-estudio?demo=vacio#historial`.
 */
export const demoVacia = (consulta: URLSearchParams, ...alias: string[]) => {
  const demo = consulta.get('demo')
  return demo === 'vacio' || (demo != null && alias.includes(demo))
}
