import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Download01Icon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { PageActionBar } from '@/shared/components/PageShell'
import { BotonIa } from '@/shared/components/BotonIa'
import { TokenCost } from './tokens'
import { BarraPasos } from '@/modules/design-system/navegacion/barra-pasos'

// Las dos barras inferiores del editor, flotantes y fijas abajo como en Crear vacante. Nunca van las dos a la vez: en
// Editar está la del editor (Cancelar · qué falta · Atrás · a dónde lleva el botón) y en la Vista del colaborador la
// del colaborador (Regresar y dónde está · el botón según el estado de la página; el progreso vive en el índice).

export type AccionPrincipal = {
  texto: string
  onClick: () => void
  deshabilitado?: boolean
  flecha?: boolean
  /** La hace la IA: va con el primario de IA (degradado de marca) y, si cuesta, con su moneda. */
  ia?: boolean
  costo?: number
}

type PropsEditor = {
  /**
   * Sin él no hay «Cancelar»: en los pasos de creación la salida es una sola, «Salir de la creación» junto al título
   * (regla de creación del 6-oct), y la barra solo avanza.
   */
  onCancelar?: () => void
  /** A la izquierda, en el sitio de «Cancelar»: el ChipGuardado, si el paso guarda. */
  inicio?: ReactNode
  /** «Cancelar» por defecto; los flujos hijos que vuelven a «Agregar página» dicen «Volver». */
  textoCancelar?: string
  /** Qué falta para avanzar o publicar, o que ya está todo listo. */
  mensaje: { texto: string; problema: boolean } | null
  onAtras?: () => void
  /** Una segunda salida junto a la principal (p. ej. «Prefiero llenarlo yo» en el roleplay con IA). */
  secundario?: { texto: string; onClick: () => void }
  principal: AccionPrincipal
}

// Desde el 13-oct es la barra de los pasos del sistema (BarraPasos) con lo propio del editor: «Cancelar» a la
// izquierda y el primario de IA con su costo. Así «Atrás», la sombra y el sitio de cada cosa son los de todos.
export function BarraEditor({ onCancelar, inicio, textoCancelar = 'Cancelar', mensaje, onAtras, secundario, principal }: PropsEditor) {
  return (
    <BarraPasos
      className="z-20"
      inicio={
        <>
          {inicio}
          {onCancelar ? (
            <Button variant="outline" onClick={onCancelar}>
              {textoCancelar}
            </Button>
          ) : null}
        </>
      }
      mensaje={mensaje}
      extra={
        secundario ? (
          <Button variant="outline" onClick={secundario.onClick}>
            {secundario.texto}
          </Button>
        ) : null
      }
      paso={onAtras ? 2 : 1}
      onAtras={onAtras}
      principal={<Principal accion={principal} />}
    />
  )
}

type PropsColaborador = {
  onRegresar?: () => void
  mensaje?: string
  secundario?: { texto: string; descarga?: boolean; onClick: () => void }
  principal: AccionPrincipal
}

export function BarraColaborador({ onRegresar, mensaje, secundario, principal }: PropsColaborador) {
  return (
    <PageActionBar className="z-20">
      {/* **El progreso vive en el índice**, debajo de «Información general»: ahí es donde se mira cómo va el
          contenido, y en la barra competía con los botones. Esta barra se queda con lo que hace avanzar (Dave, 8-oct). */}
      <div className="ml-auto flex min-w-0 items-center gap-3">
        {mensaje ? (
          <Text as="p" size="sm" variant="muted" aria-live="polite" className="hidden min-w-0 truncate md:block">
            {mensaje}
          </Text>
        ) : null}
        {secundario ? (
          <Button variant="outline" onClick={secundario.onClick}>
            {secundario.descarga ? <HugeiconsIcon icon={Download01Icon} size={16} aria-hidden="true" /> : null}
            {secundario.texto}
          </Button>
        ) : null}
        {/* Atrás pegado a Continuar, como en los pasos de los asistentes: las dos del recorrido, juntas. */}
        {onRegresar ? (
          <Button variant="outline" onClick={onRegresar}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
            Atrás
          </Button>
        ) : null}
        <Principal accion={principal} />
      </div>
    </PageActionBar>
  )
}

function Principal({ accion }: { accion: AccionPrincipal }) {
  // «Continuar» lleva siempre su flecha a la derecha, como en los pasos de Crear contenido, también en el primario de IA
  // (el jefe de Dave, 13-oct).
  const flecha = accion.flecha ?? accion.texto === 'Continuar'
  if (accion.ia) {
    return (
      <BotonIa disabled={accion.deshabilitado} onClick={accion.onClick}>
        {accion.texto}
        {accion.costo ? <TokenCost cost={accion.costo} /> : null}
        {flecha ? <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /> : null}
      </BotonIa>
    )
  }
  return (
    <Button disabled={accion.deshabilitado} onClick={accion.onClick}>
      {accion.texto}
      {flecha ? <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /> : null}
    </Button>
  )
}
