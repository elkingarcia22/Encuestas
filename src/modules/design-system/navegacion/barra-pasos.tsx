import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { PageActionBar } from '@/shared/components/PageShell'

export type PrincipalPaso = {
  // Sin texto dice «Continuar» (con su flecha). En el último paso, el verbo del flujo: «Publicar aviso», «Crear plan».
  texto?: string
  onClick: () => void
  deshabilitado?: boolean
}

// La barra fija de todo asistente por pasos (regla «barra-de-pasos», war room del 13-oct). Es la barra de acciones del
// marco (PageActionBar: un borde, una sombra) con siempre lo mismo en el mismo sitio: a la izquierda el guardado
// (ChipGuardado) y lo que acompañe; a la derecha lo que falta, lo extra, «Atrás» desde el paso 2 (el paso anterior, no
// la pantalla anterior) y el principal, que dice «Continuar» a secas. Nada de «Volver», «Siguiente» ni «Continuar a…».
// Si el principal no cabe en un botón (dos acciones al editar, el primario de IA con su costo), se pasa ya armado.
export function BarraPasos({
  inicio,
  mensaje,
  extra,
  paso,
  onAtras,
  atrasDeshabilitado,
  onGuardar,
  guardarDeshabilitado,
  principal,
  className,
}: {
  // A la izquierda: el ChipGuardado y, si hace falta, un aviso corto o un resumen.
  inicio?: ReactNode
  // Qué falta para avanzar, junto a los botones. Con `problema`, con el icono en ámbar.
  mensaje?: { texto: string; problema?: boolean } | null
  // Otra cosa a la derecha, antes de «Atrás»: «Razonando», una segunda salida.
  extra?: ReactNode
  // El paso en que se está, desde 1. «Atrás» aparece desde el 2.
  paso: number
  onAtras?: () => void
  atrasDeshabilitado?: boolean
  // Guardar a mano (solo en los flujos que autoguardan y lo ofrecen, 21-oct: Crear y editar encuesta y ciclo): un botón
  // secundario entre «Atrás» y el principal. Sin esto, la barra no lo muestra.
  onGuardar?: () => void
  guardarDeshabilitado?: boolean
  principal: PrincipalPaso | ReactElement
  className?: string
}) {
  return (
    <PageActionBar className={className}>
      <div className="flex min-w-0 flex-wrap items-center gap-3">{inicio}</div>
      <div className="ml-auto flex min-w-0 items-center gap-3">
        {mensaje ? (
          // Lo que falta, como en el bloque «Faltan N datos» de los resúmenes: el icono en ámbar y el texto en medium,
          // del color de siempre (el texto entero en ámbar no llega al contraste mínimo).
          <span className="hidden min-w-0 items-center gap-2 md:flex">
            {mensaje.problema ? <HugeiconsIcon icon={Alert02Icon} size={16} className="shrink-0 text-warning" aria-hidden="true" /> : null}
            <Text
              as="p"
              size="sm"
              weight={mensaje.problema ? 'medium' : undefined}
              variant={mensaje.problema ? undefined : 'muted'}
              aria-live="polite"
              className="min-w-0 truncate"
            >
              {mensaje.texto}
            </Text>
          </span>
        ) : null}
        {extra}
        {paso > 1 && onAtras ? (
          <Button variant="outline" disabled={atrasDeshabilitado} onClick={onAtras}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
            Atrás
          </Button>
        ) : null}
        {onGuardar ? (
          <Button variant="outline" disabled={guardarDeshabilitado} onClick={onGuardar}>
            Guardar
          </Button>
        ) : null}
        {isValidElement(principal) ? principal : <BotonPrincipal {...(principal as PrincipalPaso)} />}
      </div>
    </PageActionBar>
  )
}

function BotonPrincipal({ texto = 'Continuar', onClick, deshabilitado }: PrincipalPaso) {
  return (
    <Button disabled={deshabilitado} onClick={onClick}>
      {texto}
      {texto === 'Continuar' ? <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /> : null}
    </Button>
  )
}
